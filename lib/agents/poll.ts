import { recordOutage } from "@/lib/monitoring/uptime.ts";
import { MongoBulkWriteError } from "mongodb";
import { BoundedCache } from "@/lib/core/boundedCache.ts";
import { Logger } from "@/core/utils/logger.ts";
import { safetyLimit } from "@/lib/limits/safety.ts";
import { forgetAgent, type TAgentIdentity } from "@/lib/agents/agentAuth.ts";
import { getAgentConfig } from "@/lib/agents/config.ts";
import { recordHostSetup } from "@/lib/agents/commands.ts";
import { recordPoolSetup } from "@/lib/pool/pool.ts";
import { rentals } from "@/lib/services.ts";
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
import { recordMeshStatus } from "@/lib/network/network.ts";
import {
  deliverInBackground,
  onAgentAlert,
  onAutoscale,
  onServerBack,
} from "@/lib/monitoring/alerts.ts";
import { refreshSpecs } from "@/lib/deploy/specs.ts";
import { serverSpecModel } from "@/schemas/infrastructure/serverSpec.ts";
import { serverWakeups } from "@/lib/agents/wakeups.ts";

const COMMAND_BATCH = 50;
/** Tests shorten the hold; production uses AGENT_LONG_POLL_MS. */
export const longPollOptions: { maxHoldMs?: number } = {};
/** Servers beyond the plan's quota after the grace poll this slowly (PLAN §22.5). */
const THROTTLED_POLL_MS = 60_000;
const EVENT_TTL_MS = 60 * 60_000;

/** Last poll per server, the first-line rate limit (PLAN §20.3): no DB writes. */
const lastPollAt = new BoundedCache<string, number>({
  maxEntries: 50_000,
  ttlMs: 2 * 60_000,
});

type TPollResult = {
  status: number;
  body: Record<string, unknown>;
  /** Time spent held (long polling), left out of the request metrics. */
  heldMs?: number;
};

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
  const { config, version: configVersion } = await getAgentConfig();
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

  // Long polling (PLAN Phase 13): only agents that ask are held.
  const holdMs = request.wait
    ? Math.min(config.poll.waitMs ?? 0, longPollOptions.maxHoldMs ?? Infinity)
    : 0;
  // Registered before anything is read, so a wake in between isn't lost.
  const waiter = holdMs ? serverWakeups.register(key) : undefined;
  try {
    const result = await poll(identity, fingerprint, request, {
      nowMs,
      holdMs,
      waiter,
      minIntervalMs: minInterval,
    });
    return waiter ? { ...result, heldMs: waiter.heldMs } : result;
  } finally {
    waiter?.cancel();
  }
};

const poll = async (
  identity: TAgentIdentity,
  fingerprint: string,
  request: TPollRequest,
  opts: {
    nowMs: number;
    holdMs: number;
    waiter?: ReturnType<typeof serverWakeups.register>;
    minIntervalMs: number;
  },
): Promise<TPollResult> => {
  const { nowMs, holdMs, waiter } = opts;
  const { config, version: configVersion, leaseMs: baseLeaseMs } =
    await getAgentConfig();
  // A held poll keeps the server alive for as long as it may be held.
  const leaseMs = baseLeaseMs + holdMs;
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
            { $eq: ["$throttled", true] },
            new Date(nowMs + 2 * THROTTLED_POLL_MS),
            {
              $cond: [
                { $lt: ["$aliveUntil", new Date(nowMs + renewBelowMs)] },
                new Date(nowMs + leaseMs),
                "$aliveUntil",
              ],
            },
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
        offline: 1,
        aliveUntil: 1,
        throttled: 1,
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

  // Back from offline: resolve its agentOffline alerts (rare, so off the idle path).
  if (lease.offline) await onServerBack(identity.server);
  // Back after its lease ran out: a rented server was down since then (PLAN
  // §26.11). Not the sweep's flag, which can lag minutes in a small fleet.
  if (lease.aliveUntil && lease.aliveUntil < now) {
    await Promise.all([
      recordOutage(identity.server, identity.tenant, lease.aliveUntil, now)
        .catch((e) => Logger.warn(`[uptime] outage: ${e}`)),
      rentals.recordDowntime(identity.server, lease.aliveUntil, now)
        .catch((e) => Logger.warn(`[rentals] downtime: ${e}`)),
    ]);
  }

  const applied = request.appliedVersion ?? 0;
  /** What's waiting for the agent: commands, terminal input, a newer spec. */
  const collect = (counters: { commandSeq: number; desiredVersion?: number }) =>
    Promise.all([
      counters.commandSeq > cursor
        ? agentCommandModel
          .find({ server: identity.server, seq: { $gt: cursor } }, {
            sort: { seq: 1 },
            limit: COMMAND_BATCH,
            projection: { _id: 0, seq: 1, type: 1, payload: 1 },
          })
          .toArray() as Promise<TCommand[]>
        : [],
      // Only an agent with an open terminal sends cursors: idle polls skip this.
      request.streams && pendingTerminalInput(identity.server, request.streams),
      // A newer desired state: one read of the precomputed, sealed spec (PLAN §4.4).
      (counters.desiredVersion ?? 0) > applied &&
      serverSpecModel.findOne(
        { _id: identity.server, version: { $gt: applied } },
        { projection: { _id: 0, version: 1, sealed: 1 } },
      ),
    ]);

  let [[commands, streamInput, desired]] = await Promise.all([
    collect(lease),
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
    // A machine's partitions: rentals' traffic and lazy renewal (PLAN §26).
    request.summary?.partitions?.length &&
    rentals.recordUsage(identity.server, request.summary.partitions)
      .catch((e) => console.warn("[rentals] usage:", e)),
    offlineSweep.tick(lease.shard ?? shardOf(identity.server)),
    offlineSweep.tickRandom(),
  ]);

  // Nothing to deliver: wait for a wake (a command, a spec, terminal input).
  const reset = cursor > lease.commandSeq;
  let held = false;
  if (
    waiter && !lease.throttled && !reset && !commands.length && !streamInput &&
    !desired
  ) {
    held = true;
    if (await waiter.wait(holdMs)) {
      const counters = await serverLeaseModel.findOne(
        { _id: identity.server },
        { projection: { commandSeq: 1, desiredVersion: 1 } },
      );
      if (counters) [commands, streamInput, desired] = await collect(counters);
    }
  }
  const delivered = commands.length || streamInput || desired;

  return {
    status: 200,
    body: {
      // After an empty hold the agent comes straight back to wait again.
      nextPollMs: lease.throttled
        ? THROTTLED_POLL_MS
        // A waiting agent comes straight back (its next poll waits anyway):
        // at once after an empty hold, after the minimum after a delivery.
        : waiter
        ? (held && !delivered ? 0 : opts.minIntervalMs)
        : lease.terminalUntil && lease.terminalUntil > now
        ? config.poll.terminalMs
        : commands.length || desired ||
            (lease.fastPollUntil && lease.fastPollUntil > now)
        ? config.poll.activeMs
        : config.poll.idleMs,
      configVersion,
      commands,
      ...(streamInput ? { streamInput } : {}),
      ...(desired ? { desired } : {}),
      // A cursor past every command came from an earlier registration of this agent.
      ...(reset ? { resetCommands: true } : {}),
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
      type: {
        $in: [
          "docker.ensure",
          "pool.ensure",
          "build.run",
          "partition.receive",
          "partition.remove",
        ],
      },
    }, { projection: { seq: 1, type: 1 } })
    .toArray();
  for (const { _id, seq, type } of typed) {
    const event = fresh.find((e) => e.data.seq === seq)!;
    if (type === "partition.remove") {
      // Gone now, not at the machine's next report (PLAN §27.2).
      const name = event.data.result?.name;
      if (event.data.ok && typeof name === "string") {
        await serverModel.updateOne({ _id: identity.server }, {
          $pull: { "resources.partitions": { name } },
        });
      }
    } else if (type === "partition.receive") {
      // A move ends with the target's result (PLAN §26.10).
      await rentals.moveFinished(_id, event.data);
    } else if (type === "docker.ensure" || type === "pool.ensure") {
      if (type === "pool.ensure") {
        await recordPoolSetup(identity.server, event.data);
      } else await recordHostSetup(identity.server, event.data);
      // A prepared host gets its spec, private network included (PLAN §8.2).
      if (event.data.ok) await refreshSpecs([identity.server]);
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
  const mesh = events.filter((e) => e.type === "mesh.status");
  const alerts = events.filter((e): e is Extract<
    TAgentEvent,
    { type: "alert.fired" | "alert.resolved" }
  > => e.type === "alert.fired" || e.type === "alert.resolved");
  const scaled = events.filter((e) => e.type === "autoscale.changed");

  const [applied, streams] = await Promise.all([
    results.length ? ingestCommandResults(identity, results) : 0,
    ingestChunks(identity, chunks),
  ]);
  // Rollouts advance on these; each step is a conditional update, so retries are harmless.
  for (const status of statuses) {
    await onWorkloadStatus(identity.server, status.data);
  }
  // Only the latest matters.
  if (mesh.length) await recordMeshStatus(identity.server, mesh.at(-1)!.data);
  for (const alert of alerts) await onAgentAlert(identity.server, alert);
  for (const event of scaled) await onAutoscale(identity.server, event.data);
  // Event ingestion carries the alert outbox too (PLAN §3.4), never polls.
  deliverInBackground();
  return {
    applied: applied + streams.applied + statuses.length + mesh.length +
      alerts.length + scaled.length,
    close: streams.close,
  };
};
