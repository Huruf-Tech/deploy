import { serverOutageModel } from "@/schemas/infrastructure/serverOutage.ts";
import { storageModel } from "@/schemas/infrastructure/storage.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { planModel, rentalPlanModel } from "@/schemas/billing/plan.ts";
import {
  abuseReportModel,
  claimRevertModel,
  disputeModel,
  earningModel,
  machineRatingModel,
} from "@/schemas/billing/market.ts";
import { platformTenantId } from "@/lib/billing/platform.ts";
import { mongodb } from "@/database.ts";
import { walletTopupModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/walletTopup.ts";
import {
  billingAccountModel,
  paymentCardModel,
  paymentEventModel,
} from "@/schemas/billing/payment.ts";
import { alertEventModel, alertRuleModel } from "@/schemas/monitoring/alert.ts";
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
import { controlPlaneSampleModel } from "@/schemas/monitoring/controlPlane.ts";
import { variableModel } from "@/schemas/configuration/variable.ts";
import { gitIntegrationModel } from "@/schemas/build/gitIntegration.ts";
import {
  templateModel,
  templateVersionModel,
} from "@/schemas/build/template.ts";
import {
  projectGroupModel,
  projectModel,
} from "@/schemas/applications/project.ts";
import {
  deploymentModel,
  releaseModel,
} from "@/schemas/applications/deployment.ts";
import { registryModel } from "@/schemas/infrastructure/serverSpec.ts";
import {
  acmeChallengeModel,
  certificateArchiveModel,
  domainJobSlotModel,
  domainModel,
} from "@/schemas/applications/domain.ts";
import { networkModel } from "@/schemas/infrastructure/network.ts";
import { bootstrapSessionModel } from "@/schemas/infrastructure/bootstrapSession.ts";
import {
  streamChunkModel,
  streamInputModel,
  streamSessionModel,
} from "@/schemas/infrastructure/stream.ts";

/** Every Huruf Deploy index lives here (PLAN §6). Run by setup, never at startup. */
/**
 * Phase 19 (PLAN §30): the classes' rate cards move onto their machines (by
 * the hour), size plans stop being offered, and existing rentals belong to
 * the platform. Idempotent; requests made before the market have no
 * machine to accept them, so they're declined (nothing was charged).
 */
async function migrateToMarket() {
  const classes = await mongodb.db().collection<{
    rates: { vcpu: number; memGb: number; diskGb: number; trafficGb: number };
  }>("serverClasses").find().toArray();
  for (const cls of classes) {
    await serverModel.updateMany(
      { "pool.class": cls._id, "pool.rent": { $exists: false } } as never,
      {
        $set: {
          "pool.rent": {
            enabled: true,
            autoAccept: false,
            prices: {
              vcpu: cls.rates.vcpu / 730,
              memGb: cls.rates.memGb / 730,
              diskGb: cls.rates.diskGb / 730,
              trafficGb: cls.rates.trafficGb,
            },
          },
        },
      },
    );
  }
  await serverModel.updateMany({ "pool.class": { $exists: true } } as never, {
    $unset: { "pool.class": "" } as never,
  });
  await planModel.updateMany({ kind: "server" }, {
    $set: { custom: true, visibility: "private" },
    $unset: { class: "" } as never,
  });
  // Rentals' plans have their own collection (PLAN §30.3): the plans
  // admins manage are workspace plans only.
  for await (const plan of planModel.find({ kind: "server" })) {
    await rentalPlanModel.replaceOne({ _id: plan._id }, plan, { upsert: true });
    await planModel.deleteOne({ _id: plan._id });
  }
  const platform = await platformTenantId();
  if (platform) {
    await subscriptionModel.updateMany({
      kind: "server",
      "rental.host": { $exists: true },
      "rental.owner": { $exists: false },
    }, { $set: { "rental.owner": platform } });
  }
  await subscriptionModel.updateMany({
    kind: "server",
    status: "requested",
    "rental.host": { $exists: false },
  }, {
    $set: {
      status: "rejected",
      "rental.rejectedReason":
        "Rentals moved to the market: pick a machine there and request again",
    },
  });
  await subscriptionModel.updateMany(
    { kind: "server", "rental.class": { $exists: true } } as never,
    { $unset: { "rental.class": "" } as never },
  );
}

export const syncDeployIndexes = async () => {
  // The first version left `project` out: projects of one tenant couldn't
  // share a variable name. Replaced by uniqueKeyPerScopeOwner.
  await variableModel.dropIndex("uniqueKeyPerOwner").catch(() => {});
  // Subscriptions per subject (PLAN §26.6 B): existing ones are workspace
  // plans, and "one per tenant" becomes "one workspace plan per tenant".
  await subscriptionModel.updateMany({ kind: { $exists: false } }, {
    $set: { kind: "workspace" },
  });
  await subscriptionModel.dropIndex("uniqueTenant").catch(() => {});
  await subscriptionModel.dropIndex("uniqueServer").catch(() => {});
  await migrateToMarket();

  await Promise.all([
    controlPlaneSampleModel.createIndex({ at: 1 }, { name: "at" }),
    controlPlaneSampleModel.createIndex({ instance: 1, at: 1 }, {
      name: "instance_at",
    }),
    controlPlaneSampleModel.createIndex(
      { expiresAt: 1 },
      { name: "ttl", expireAfterSeconds: 0 },
    ),
    keyringModel.createIndex(
      { "owner.kind": 1, "owner.ref": 1 },
      { name: "uniqueOwner", unique: true },
    ),
    planModel.createIndex({ slug: 1 }, { name: "uniqueSlug", unique: true }),
    // Payments (PLAN §25.4).
    billingAccountModel.createIndex({ tenant: 1 }, {
      name: "uniqueTenant",
      unique: true,
    }),
    paymentCardModel.createIndex({ providerRef: 1 }, {
      name: "uniqueProviderRef",
      unique: true,
    }),
    paymentCardModel.createIndex({ tenant: 1, isDefault: -1 }, {
      name: "tenantCards",
    }),
    paymentEventModel.createIndex({ eventId: 1 }, {
      name: "uniqueEvent",
      unique: true,
    }),
    paymentEventModel.createIndex({ processedAt: -1 }, {
      name: "keptEvents",
      partialFilterExpression: { kept: true },
    }),
    // Admin → Payments lists top-ups by status, newest first.
    walletTopupModel.createIndex({ status: 1, createdAt: -1 }, {
      name: "statusCreated",
    }),
    // Refunds and disputes have no expiresAt and are kept.
    paymentEventModel.createIndex(
      { expiresAt: 1 },
      { name: "ttl", expireAfterSeconds: 0 },
    ),
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
    // A replayed charge's period is refused by its ledger reference.
    subscriptionPeriodModel.createIndex(
      { ledgerReference: 1 },
      {
        name: "ledgerReference",
        partialFilterExpression: { ledgerReference: { $exists: true } },
      },
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
    // A machine's partitions; each has its own private-network port on it.
    serverModel.createIndex(
      { "provider.host": 1, "provider.meshPort": -1 },
      {
        name: "uniqueMeshPort",
        unique: true,
        partialFilterExpression: { "provider.meshPort": { $exists: true } },
      },
    ),
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
    streamSessionModel.createIndex(
      { tenant: 1, status: 1 },
      { name: "tenantOpen" },
    ),
    streamSessionModel.createIndex(
      { expiresAt: 1 },
      { name: "ttl", expireAfterSeconds: 0 },
    ),
    streamChunkModel.createIndex(
      { session: 1, seq: 1 },
      { name: "uniqueSeq", unique: true },
    ),
    streamChunkModel.createIndex(
      { expiresAt: 1 },
      { name: "ttl", expireAfterSeconds: 0 },
    ),
    streamInputModel.createIndex(
      { session: 1, seq: 1 },
      { name: "uniqueSeq", unique: true },
    ),
    streamInputModel.createIndex(
      { expiresAt: 1 },
      { name: "ttl", expireAfterSeconds: 0 },
    ),
    bootstrapSessionModel.createIndex(
      { tokenHash: 1 },
      { name: "uniqueToken", unique: true },
    ),
    bootstrapSessionModel.createIndex(
      { expiresAt: 1 },
      { name: "ttl", expireAfterSeconds: 0 },
    ),
    // Partitions being created on a machine (room and its partition list).
    bootstrapSessionModel.createIndex(
      { "partition.host": 1, status: 1 },
      {
        name: "partitionHost",
        partialFilterExpression: { "partition.host": { $exists: true } },
      },
    ),

    // One key per scope owner (a project is its own owner); also serves
    // listing (sorted by key) and the quota count.
    variableModel.createIndex(
      { scope: 1, user: 1, tenant: 1, project: 1, key: 1 },
      { name: "uniqueKeyPerScopeOwner", unique: true },
    ),

    gitIntegrationModel.createIndex(
      { tenant: 1, owner: 1 },
      { name: "tenantOwner" },
    ),

    // Also serves listing: system templates (tenant null) and a tenant's own.
    templateModel.createIndex(
      { scope: 1, tenant: 1, slug: 1 },
      { name: "uniqueSlug", unique: true },
    ),
    // Version numbers come from the template's counter; this makes them unique.
    templateVersionModel.createIndex(
      { template: 1, version: -1 },
      { name: "uniqueVersion", unique: true },
    ),

    projectModel.createIndex(
      { tenant: 1, slug: 1 },
      { name: "uniqueSlug", unique: true },
    ),
    // Spec computation: the projects placed on (or moving to) a server.
    projectModel.createIndex({ placedOn: 1 }, { name: "placedOn" }),
    projectModel.createIndex({ servers: 1 }, { name: "servers" }),
    // Push deploys look projects up by their GitHub source.
    projectModel.createIndex(
      { "source.gitIntegration": 1, "source.repo": 1, "source.branch": 1 },
      {
        name: "githubSource",
        partialFilterExpression: { "source.type": "github" },
      },
    ),
    projectGroupModel.createIndex({ tenant: 1 }, { name: "tenant" }),
    releaseModel.createIndex(
      { project: 1, number: -1 },
      { name: "uniqueNumber", unique: true },
    ),
    deploymentModel.createIndex(
      { project: 1, createdAt: -1 },
      { name: "projectHistory" },
    ),
    // One building-or-deploying deployment per project (PLAN §9.3).
    deploymentModel.createIndex(
      { project: 1 },
      {
        name: "oneActive",
        unique: true,
        partialFilterExpression: { active: true },
      },
    ),
    deploymentModel.createIndex(
      { servers: 1, status: 1 },
      { name: "serverRollouts" },
    ),
    deploymentModel.createIndex(
      { "builds.server": 1, "builds.seq": 1 },
      { name: "builds", partialFilterExpression: { status: "building" } },
    ),
    registryModel.createIndex({ tenant: 1, name: 1 }, { name: "tenantName" }),
    storageModel.createIndex({ tenant: 1, name: 1 }, { name: "tenantName" }),
    domainModel.createIndex({ tenant: 1, hostname: 1 }, {
      name: "tenantHostname",
      unique: true,
    }),
    // A hostname is verified by one tenant only (PLAN §14).
    domainModel.createIndex({ hostname: 1 }, {
      name: "verifiedHostname",
      unique: true,
      partialFilterExpression: { verifiedAt: { $exists: true } },
    }),
    domainModel.createIndex({ project: 1 }, { name: "project" }),
    // One free test domain per project (PLAN §14).
    domainModel.createIndex({ project: 1 }, {
      name: "oneAppDomain",
      unique: true,
      partialFilterExpression: { appDomain: true },
    }),
    // Uptime (PLAN §29): a server's outages over a window; kept 120 days.
    serverOutageModel.createIndex({ server: 1, to: -1 }, { name: "serverTo" }),
    serverOutageModel.createIndex({ expiresAt: 1 }, {
      name: "ttl",
      expireAfterSeconds: 0,
    }),
    // Removed domains' certificates go when they expire.
    certificateArchiveModel.createIndex({ "certificate.notAfter": 1 }, {
      name: "ttl",
      expireAfterSeconds: 0,
    }),
    serverModel.createIndex({ tunnelPort: 1 }, {
      name: "uniqueTunnelPort",
      unique: true,
      partialFilterExpression: { tunnelPort: { $exists: true } },
    }),
    domainModel.createIndex({ issueAt: 1 }, {
      name: "dueIssues",
      partialFilterExpression: { issueAt: { $exists: true } },
    }),
    acmeChallengeModel.createIndex({ expiresAt: 1 }, {
      name: "ttl",
      expireAfterSeconds: 0,
    }),
    domainModel.createIndex({ nextCheckAt: 1 }, {
      name: "dueChecks",
      partialFilterExpression: { status: "checking" },
    }),
    // One workspace subscription per tenant (PLAN §22.1), one per rented
    // server (PLAN §26.6 B); due renewals per tenant.
    subscriptionModel.createIndex({ tenant: 1 }, {
      name: "uniqueWorkspace",
      unique: true,
      partialFilterExpression: { kind: "workspace" },
    }),
    subscriptionModel.createIndex({ server: 1 }, {
      name: "uniqueRentedServer",
      unique: true,
      // A requested rental has no server yet.
      partialFilterExpression: { kind: "server", server: { $exists: true } },
    }),
    // Rentals by pool machine and partition (PLAN §26.9).
    subscriptionModel.createIndex({ "rental.host": 1, "rental.partition": 1 }, {
      name: "rentalPartition",
      partialFilterExpression: { kind: "server" },
    }),
    // The admin's queue: requests and resizes waiting.
    subscriptionModel.createIndex({ status: 1, updatedAt: 1 }, {
      name: "rentalRequests",
      partialFilterExpression: { kind: "server" },
    }),
    // The market (PLAN §30): machines for rent, owners' queues and money.
    serverModel.createIndex({ "pool.rent.enabled": 1 }, {
      name: "forRent",
      partialFilterExpression: { "pool.rent.enabled": true },
    }),
    subscriptionModel.createIndex({ "rental.owner": 1, status: 1 }, {
      name: "rentalOwner",
      partialFilterExpression: { kind: "server" },
    }),
    subscriptionPeriodModel.createIndex({ "market.owner": 1, periodEnd: 1 }, {
      name: "marketOwner",
      partialFilterExpression: { "market.owner": { $exists: true } },
    }),
    subscriptionPeriodModel.createIndex({ "market.split.owner": 1 }, {
      name: "marketSplitOwner",
      partialFilterExpression: { "market.split.owner": { $exists: true } },
    }),
    subscriptionPeriodModel.createIndex(
      { "market.machine": 1, periodEnd: -1 },
      {
        name: "marketMachine",
        partialFilterExpression: { "market.machine": { $exists: true } },
      },
    ),
    earningModel.createIndex({ key: 1 }, { name: "uniqueKey", unique: true }),
    earningModel.createIndex({ owner: 1, createdAt: -1 }, { name: "owner" }),
    earningModel.createIndex({ machine: 1, bucket: 1 }, { name: "machine" }),
    claimRevertModel.createIndex({ claim: 1 }, { name: "claim" }),
    claimRevertModel.createIndex({ status: 1, createdAt: 1 }, {
      name: "status",
    }),
    disputeModel.createIndex({ machine: 1, status: 1 }, { name: "machine" }),
    disputeModel.createIndex({ subscription: 1, status: 1 }, {
      name: "subscription",
    }),
    disputeModel.createIndex({ owner: 1, status: 1 }, { name: "owner" }),
    disputeModel.createIndex({ status: 1, createdAt: 1 }, { name: "status" }),
    machineRatingModel.createIndex({ subscription: 1 }, {
      name: "uniqueRental",
      unique: true,
    }),
    machineRatingModel.createIndex({ machine: 1 }, { name: "machine" }),
    abuseReportModel.createIndex({ status: 1, createdAt: 1 }, {
      name: "status",
    }),
    subscriptionModel.createIndex({ tenant: 1, currentPeriodEnd: 1 }, {
      name: "tenantDue",
    }),
    // Throttling servers beyond the quota (PLAN §22.5).
    serverLeaseModel.createIndex({ tenant: 1, throttled: 1 }, {
      name: "throttled",
      partialFilterExpression: { throttled: true },
    }),
    // Projects mounting a storage connection (update and delete checks).
    projectModel.createIndex({ "volumes.storage": 1 }, {
      name: "volumeStorage",
      partialFilterExpression: { "volumes.storage": { $exists: true } },
    }),
    alertRuleModel.createIndex({ tenant: 1, metric: 1 }, {
      name: "tenantMetric",
    }),
    // One open episode per rule and subject: repeats are deduped (PLAN §13).
    alertEventModel.createIndex({ key: 1 }, {
      name: "uniqueOpen",
      unique: true,
      partialFilterExpression: { open: true },
    }),
    alertEventModel.createIndex({ tenant: 1, firedAt: -1 }, {
      name: "history",
    }),
    // Resolved alerts are kept 90 days; open ones have no resolvedAt.
    alertEventModel.createIndex({ resolvedAt: 1 }, {
      name: "resolvedTtl",
      expireAfterSeconds: 90 * 24 * 60 * 60,
    }),
    alertEventModel.createIndex({ server: 1, metric: 1 }, {
      name: "server",
      partialFilterExpression: { open: true },
    }),
    alertEventModel.createIndex({ project: 1, metric: 1 }, {
      name: "project",
      partialFilterExpression: { open: true },
    }),
    alertEventModel.createIndex({ rule: 1 }, {
      name: "rule",
      partialFilterExpression: { open: true },
    }),
    // The outbox: only pending notices are indexed (PLAN §20.2).
    alertEventModel.createIndex({ "delivery.nextAttemptAt": 1 }, {
      name: "outbox",
      partialFilterExpression: { "delivery.status": "pending" },
    }),
    // ensureMeshIndex upserts one per tenant.
    networkModel.createIndex({ tenant: 1 }, {
      name: "uniqueTenant",
      unique: true,
    }),
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
  await domainJobSlotModel.updateOne({ _id: 0 }, {
    $setOnInsert: { nextRunAt: new Date(0) },
  }, { upsert: true });
};

if (import.meta.main) {
  await syncDeployIndexes();
  Deno.exit();
}
