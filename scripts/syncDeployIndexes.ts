import { planModel } from "@/schemas/billing/plan.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { keyringModel } from "@/schemas/crypto/keyring.ts";
import { rateCounterModel } from "@/schemas/limits/rateCounter.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import {
  agentCommandModel,
  agentEventModel,
  sweepShardModel,
} from "@/schemas/infrastructure/agentCommand.ts";
import { SHARD_COUNT } from "@/lib/agents/sweep.ts";

/** Every Huruf Deploy index lives here (PLAN §6). Run by setup, never at startup. */
export const syncDeployIndexes = async () => {
  await Promise.all([
    keyringModel.createIndex(
      { "owner.kind": 1, "owner.ref": 1 },
      { name: "uniqueOwner", unique: true },
    ),
    planModel.createIndex({ slug: 1 }, { name: "uniqueSlug", unique: true }),
    planModel.createIndex(
      { isFree: 1 },
      {
        name: "singleFreePlan",
        unique: true,
        partialFilterExpression: { isFree: true },
      },
    ),
    subscriptionPeriodModel.createIndex(
      { subscription: 1, periodStart: 1 },
      { name: "uniquePeriod", unique: true },
    ),
    subscriptionPeriodModel.createIndex(
      { tenant: 1, periodEnd: -1 },
      { name: "tenantPeriods" },
    ),
    // QuotaGuard relies on this being unique.
    tenantUsageModel.createIndex(
      { tenant: 1 },
      { name: "uniqueTenant", unique: true },
    ),
    rateCounterModel.createIndex(
      { expiresAt: 1 },
      { name: "ttl", expireAfterSeconds: 0 },
    ),

    serverModel.createIndex(
      { "identity.fingerprint": 1 },
      { name: "uniqueFingerprint", unique: true },
    ),
    serverModel.createIndex({ tenant: 1, status: 1 }, { name: "tenantStatus" }),
    // Unaccepted servers disappear once their pairing code expires.
    serverModel.createIndex(
      { pairingExpiresAt: 1 },
      {
        name: "pendingTtl",
        expireAfterSeconds: 0,
        partialFilterExpression: { status: "pending" },
      },
    ),
    serverLeaseModel.createIndex(
      { shard: 1, aliveUntil: 1 },
      {
        name: "sweep",
        partialFilterExpression: { status: "active", offline: false },
      },
    ),
    serverLeaseModel.createIndex({ tenant: 1 }, { name: "tenant" }),
    agentCommandModel.createIndex(
      { server: 1, seq: 1 },
      { name: "uniqueSeq", unique: true },
    ),
    agentCommandModel.createIndex(
      { server: 1, status: 1 },
      { name: "serverStatus" },
    ),
    agentCommandModel.createIndex(
      { expiresAt: 1 },
      { name: "ttl", expireAfterSeconds: 0 },
    ),
    agentEventModel.createIndex(
      { server: 1, eventId: 1 },
      { name: "uniqueEvent", unique: true },
    ),
    agentEventModel.createIndex(
      { expiresAt: 1 },
      { name: "ttl", expireAfterSeconds: 0 },
    ),
  ]);

  // The offline sweep claims these slots; they must exist (PLAN §3.4).
  await sweepShardModel.bulkWrite(
    Array.from({ length: SHARD_COUNT }, (_, shard) => ({
      updateOne: {
        filter: { _id: shard },
        update: { $setOnInsert: { nextRunAt: new Date(0) } },
        upsert: true,
      },
    })),
  );
};

if (import.meta.main) {
  await syncDeployIndexes();
  Deno.exit();
}
