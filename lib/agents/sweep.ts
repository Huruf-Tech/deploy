import type { ObjectId } from "mongodb";
import { PiggybackScheduler } from "@/lib/core/piggybackScheduler.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { sweepShardModel } from "@/schemas/infrastructure/agentCommand.ts";
import { onServersOffline } from "@/lib/monitoring/alerts.ts";

export const SHARD_COUNT = 64;
const SWEEP_LIMIT = 200;

export const shardOf = (server: ObjectId) =>
  parseInt(server.toHexString().slice(-4), 16) % SHARD_COUNT;

/** Flags expired leases in one shard as offline. Bounded: at most 200 per run. */
export const sweepShard = async (shard: number) => {
  const now = new Date();
  const expired = {
    shard,
    status: "active" as const,
    offline: false,
    aliveUntil: { $lt: now },
  };

  const dead = await serverLeaseModel
    .find(expired, { projection: { _id: 1 }, limit: SWEEP_LIMIT })
    .toArray();
  if (!dead.length) return;

  await serverLeaseModel.bulkWrite(
    dead.map(({ _id }) => ({
      updateOne: {
        filter: { ...expired, _id },
        update: { $set: { offline: true, offlineSince: now } },
      },
    })),
    { ordered: false },
  );
  // agentOffline alerts go to the outbox; each waits out its rule's grace.
  await onServersOffline(dead.map((d) => d._id), now);
};

export const offlineSweep = new PiggybackScheduler(
  sweepShardModel,
  { slotCount: SHARD_COUNT, intervalMs: 5_000 },
  sweepShard,
);
