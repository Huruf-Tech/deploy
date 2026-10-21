import { MongoBulkWriteError } from "mongodb";
import { BoundedCache } from "@/lib/core/boundedCache.ts";
import { safetyLimit } from "@/lib/limits/safety.ts";
import { forgetAgent, type TAgentIdentity } from "@/lib/agents/agentAuth.ts";
import { getAgentConfig } from "@/lib/agents/config.ts";
import { offlineSweep, shardOf } from "@/lib/agents/sweep.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import {
  agentCommandModel,
  agentEventModel,
} from "@/schemas/infrastructure/agentCommand.ts";
import type {
  TAgentEvent,
  TCommand,
  TPollRequest,
} from "@/schemas/protocol/agent.ts";

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
      },
    },
  );

  if (!lease) {
    return refuse(identity, fingerprint, {
      nextPollMs: config.poll.idleMs,
      configVersion,
    });
  }

  const [commands] = await Promise.all([
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
  ]);

  return {
    status: 200,
    body: {
      nextPollMs: lease.terminalUntil && lease.terminalUntil > now
        ? config.poll.terminalMs
        : commands.length || (lease.fastPollUntil && lease.fastPollUntil > now)
        ? config.poll.activeMs
        : config.poll.idleMs,
      configVersion,
      commands,
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
 * `POST /agents/api/events`: idempotent by event id. Duplicates (agent retries)
 * are dropped by the unique index, so nothing is applied twice.
 */
export const ingestEvents = async (
  identity: TAgentIdentity,
  events: TAgentEvent[],
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
  if (!fresh.length) return { applied: 0 };

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
            result: event.data.result,
            error: event.data.error,
            finishedAt: now,
          },
        },
      },
    })),
    { ordered: false },
  );

  return { applied: fresh.length };
};
