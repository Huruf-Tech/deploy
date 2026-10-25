import { storageModel } from "@/schemas/infrastructure/storage.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { planModel } from "@/schemas/billing/plan.ts";
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
export const syncDeployIndexes = async () => {
  // The first version left `project` out: projects of one tenant couldn't
  // share a variable name. Replaced by uniqueKeyPerScopeOwner.
  await variableModel.dropIndex("uniqueKeyPerOwner").catch(() => {});

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
    // One subscription per tenant (PLAN §22.1).
    subscriptionModel.createIndex({ tenant: 1 }, {
      name: "uniqueTenant",
      unique: true,
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
