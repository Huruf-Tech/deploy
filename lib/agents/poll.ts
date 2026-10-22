import { MongoBulkWriteError } from "mongodb";
import { BoundedCache } from "@/lib/core/boundedCache.ts";
import { safetyLimit } from "@/lib/limits/safety.ts";
import { forgetAgent, type TAgentIdentity } from "@/lib/agents/agentAuth.ts";
import { getAgentConfig } from "@/lib/agents/config.ts";
import { recordHostSetup } from "@/lib/agents/commands.ts";
import { offlineSweep, shardOf } from "@/lib/agents/sweep.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import {
  agentCommandModel,
  agentEventModel,
} from "@/schemas/infrastructure/agentCommand.ts";
import type z from "zod";
import type {
  $commandResultEvent,
  TAgentEvent,
  TCommand,
  TPollRequest,
} from "@/schemas/protocol/agent.ts";
import { ingestChunks, pendingTerminalInput } from "@/lib/agents/streams.ts";
import { onBuildResult, onWorkloadStatus } from "@/lib/deploy/deployments.ts";
import { serverSpecModel } from "@/schemas/infrastructure/serverSpec.ts";

const COMMAND_BATCH = 50;
const EVENT_TTL_MS = 60 * 60_000;

/** Last poll per server, the first-line rate limit (PLAN §20.3): no DB writes. */
const lastPollAt = new BoundedCache<string, number>({
  maxEntries: 50_000,
  ttlMs: 2 * 60_000,
});

type TPollResult = { status: number; body: Record<string, unknown> };

/**
 * `POST /agents/api/poll` (PLAN §3.3). An idle poll where nothing changed is
 * exactly one findOneAndUpdate on the lease; commands cost reads only when
 * the agent is behind, and the ack write happens only on the poll that acks.
 */
export const pollAgent = async (
  identity: TAgentIdentity,
  fingerprint: string,
  request: TPollRequest,
): Promise<TPollResult> => {
  const key = identity.server.toHexString();
  const nowMs = Date.now();
  const { config, version: configVersion, leaseMs } = await getAgentConfig();
  const minInterval = await safetyLimit("SAFETY_MIN_POLL_INTERVAL_MS");
  const previous = lastPollAt.get(key);
  lastPollAt.set(key, nowMs);

  if (previous && nowMs - previous < minInterval * 0.8) {
    return {
      status: 429,
      body: {
        message: "Polling too fast",
        nextPollMs: config.poll.idleMs,
        configVersion,
      },
    };
  }

  const now = new Date(nowMs);
  const cursor = request.commandCursor;
  // Every idle poll renews; faster polls renew at most every ~0.8 idle intervals.
  const renewBelowMs = leaseMs - Math.round(config.poll.idleMs * 0.8);

  const lease = await serverLeaseModel.findOneAndUpdate(
    { _id: identity.server, status: "active" },
    [{
      $set: {
        aliveUntil: {
          $cond: [
            { $lt: ["$aliveUntil", new Date(nowMs + renewBelowMs)] },
            new Date(nowMs + leaseMs),
            "$aliveUntil",
          ],
        },
        deliveredSeq: {
          $max: ["$deliveredSeq", { $min: [cursor, "$commandSeq"] }],
        },
        offline: false,
        offlineSince: "$$REMOVE",
      },
    }],
    {
      returnDocument: "before",
      writeConcern: { w: 1, journal: false },
      projection: {
        shard: 1,
        commandSeq: 1,
        deliveredSeq: 1,
        fastPollUntil: 1,
        terminalUntil: 1,
        desiredVersion: 1,
      },
    },
  );

  if (!lease) {
    return refuse(identity, fingerprint, {
      nextPollMs: config.poll.idleMs,
      configVersion,
    });
  }

  const applied = request.appliedVersion ?? 0;
  const [commands, , , , , streamInput, desired] = await Promise.all([
    lease.commandSeq > cursor
      ? agentCommandModel
        .find({ server: identity.server, seq: { $gt: cursor } }, {
          sort: { seq: 1 },
          limit: COMMAND_BATCH,
          projection: { _id: 0, seq: 1, type: 1, payload: 1 },
        })
        .toArray() as Promise<TCommand[]>
      : [],
    cursor > lease.deliveredSeq &&
    agentCommandModel.updateMany(
      {
        server: identity.server,
        seq: { $gt: lease.deliveredSeq, $lte: cursor },
        status: "pending",
      },
      { $set: { status: "delivered" } },
    ),
    request.summary &&
    serverModel.updateOne({ _id: identity.server }, {
      $set: { resources: { ...request.summary, reportedAt: now } },
    }),
    offlineSweep.tick(lease.shard ?? shardOf(identity.server)),
    offlineSweep.tickRandom(),
    // Only an agent with an open terminal sends cursors: idle polls skip this.
    request.streams && pendingTerminalInput(identity.server, request.streams),
    // A newer desired state: one read of the precomputed, sealed spec (PLAN §4.4).
    (lease.desiredVersion ?? 0) > applied &&
    serverSpecModel.findOne(
      { _id: identity.server, version: { $gt: applied } },
      { projection: { _id: 0, version: 1, sealed: 1 } },
    ),
  ]);

  return {
    status: 200,
    body: {
      nextPollMs: lease.terminalUntil && lease.terminalUntil > now
        ? config.poll.terminalMs
        : commands.length || desired ||
            (lease.fastPollUntil && lease.fastPollUntil > now)
        ? config.poll.activeMs
        : config.poll.idleMs,
      configVersion,
      commands,
      ...(streamInput ? { streamInput } : {}),
      ...(desired ? { desired } : {}),
    },
  };
};

/** Only reached when the server has no active lease: pending, rejected or gone. */
const refuse = async (
  identity: TAgentIdentity,
  fingerprint: string,
  pacing: { nextPollMs: number; configVersion: string },
): Promise<TPollResult> => {
  const server = await serverModel.findOne(
    { _id: identity.server },
    { projection: { status: 1 } },
  );

  if (!server) forgetAgent(fingerprint);

  return {
    status: 403,
    body: {
      status: server?.status === "pending" || server?.status === "rejected"
        ? server.status
        : "unknown",
      ...pacing,
    },
  };
};

/**
 * Command results: idempotent by event id. Duplicates (agent retries)
 * are dropped by the unique index, so nothing is applied twice.
 */
const ingestCommandResults = async (
  identity: TAgentIdentity,
  events: z.output<typeof $commandResultEvent>[],
) => {
  const now = new Date();
  let duplicates = new Set<number>();

  try {
    await agentEventModel.insertMany(
      events.map((event) => ({
        server: identity.server,
        eventId: event.id,
        expiresAt: new Date(now.getTime() + EVENT_TTL_MS),
      })),
      { ordered: false },
    );
  } catch (error) {
    if (!(error instanceof MongoBulkWriteError)) throw error;

    const writeErrors = [error.writeErrors].flat();
    if (writeErrors.some((e) => e.code !== 11000)) throw error;
    duplicates = new Set(writeErrors.map((e) => e.index));
  }

  const fresh = events.filter((_, index) => !duplicates.has(index));
  if (!fresh.length) return 0;

  await agentCommandModel.bulkWrite(
    fresh.map((event) => ({
      updateOne: {
        filter: {
          server: identity.server,
          seq: event.data.seq,
          status: { $in: ["pending", "delivered"] },
        },
        update: {
          $set: {
            status: event.data.ok ? "done" : "failed",
            ...(event.data.result ? { result: event.data.result } : {}),
            ...(event.data.error ? { error: event.data.error } : {}),
            finishedAt: now,
          },
        },
      },
    })),
    { ordered: false },
  );

  // Host setup and build results drive more than the command record.
  const typed = await agentCommandModel
    .find({
      server: identity.server,
      seq: { $in: fresh.map((event) => event.data.seq) },
      type: { $in: ["docker.ensure", "build.run"] },
    }, { projection: { seq: 1, type: 1 } })
    .toArray();
  for (const { seq, type } of typed) {
    const event = fresh.find((e) => e.data.seq === seq)!;
    if (type === "docker.ensure") {
      await recordHostSetup(identity.server, event.data);
    } else await onBuildResult(identity.server, seq, event.data);
  }

  return fresh.length;
};

/** `POST /agents/api/events`: command results and stream output, batched. */
export const ingestEvents = async (
  identity: TAgentIdentity,
  events: TAgentEvent[],
) => {
  const results = events.filter((e) => e.type === "command.result");
  const chunks = events.filter((e) => e.type === "stream.chunk");
  const statuses = events.filter((e) => e.type === "workload.status");

  const [applied, streams] = await Promise.all([
    results.length ? ingestCommandResults(identity, results) : 0,
    ingestChunks(identity, chunks),
  ]);
  // Rollouts advance on these; each step is a conditional update, so retries are harmless.
  for (const status of statuses) {
    await onWorkloadStatus(identity.server, status.data);
  }
  return {
    applied: applied + streams.applied + statuses.length,
    close: streams.close,
  };
};
