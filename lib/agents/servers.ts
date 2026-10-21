import { type ClientSession, ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { entitlements, quotaGuard, rateLimiter } from "@/lib/services.ts";
import { safetyFlag, safetyLimit } from "@/lib/limits/safety.ts";
import { pairingCodeOf } from "@/lib/agents/signing.ts";
import { forgetAgent } from "@/lib/agents/agentAuth.ts";
import { shardOf } from "@/lib/agents/sweep.ts";
import { getAgentConfig } from "@/lib/agents/config.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import type { THelloResponse, TInventory } from "@/schemas/protocol/agent.ts";

const PAIRING_TTL_MS = 15 * 60_000;
const COMMAND_TTL_MS = 6 * 60 * 60_000;

const tooManyRequests = async (message: string) =>
  Response.json({
    message,
    nextPollMs: (await getAgentConfig()).config.maxBackoffMs,
  }, { status: 429 });

/** Every hello hands the agent its runtime config, so it never starts on hardcoded values. */
const helloConfig = async () => {
  const { config, version } = await getAgentConfig();
  return { config, version, nextPollMs: config.poll.idleMs };
};

/** `POST /agents/api/hello`: registers a new agent as pending, or reports its state. */
export const registerAgent = async (
  hello: {
    tenant: string;
    signPublicKey: string;
    boxPublicKey: string;
    inventory: TInventory;
  },
  fingerprint: string,
  clientIp: string | null,
): Promise<THelloResponse> => {
  const existing = await serverModel.findOneAndUpdate(
    { "identity.fingerprint": fingerprint },
    { $set: { inventory: hello.inventory } },
    {
      projection: { tenant: 1, status: 1, pairingCode: 1, pairingExpiresAt: 1 },
    },
  );

  if (existing) {
    if (existing.tenant.toString() !== hello.tenant) {
      throw Response.forbidden("This agent is registered to another tenant");
    }
    return {
      server: existing._id.toString(),
      status: existing.status,
      pairingCode: existing.pairingCode,
      pairingExpiresAt: existing.pairingExpiresAt?.toISOString(),
      ...await helloConfig(),
    };
  }

  // ponytail: without a client IP header the per-IP limit is skipped; the per-tenant pending cap still applies.
  if (
    clientIp &&
    !await rateLimiter.hit(
      `hello:${clientIp}`,
      await safetyLimit("SAFETY_HELLO_PER_IP_PER_MIN"),
      60,
    )
  ) throw await tooManyRequests("Too many registrations from this address");

  const tenant = await tenantModel.findOne(
    { _id: ObjectId.createFromHexString(hello.tenant) },
    { projection: { _id: 1 } },
  );
  if (!tenant) throw Response.notFound("Unknown tenant");

  const now = new Date();
  const pending = await serverModel.countDocuments({
    tenant: tenant._id,
    status: "pending",
    pairingExpiresAt: { $gt: now },
  });
  if (pending >= await safetyLimit("SAFETY_PENDING_SERVERS_PER_TENANT")) {
    throw Response.forbidden("Too many servers are waiting for approval");
  }

  const pairingCode = await pairingCodeOf(hello.signPublicKey);
  const pairingExpiresAt = new Date(now.getTime() + PAIRING_TTL_MS);

  try {
    const { insertedId } = await serverModel.insertOne({
      tenant: tenant._id,
      name: hello.inventory.hostname,
      labels: {},
      status: "pending",
      identity: {
        signPublicKey: hello.signPublicKey,
        boxPublicKey: hello.boxPublicKey,
        fingerprint,
      },
      pairingCode,
      pairingExpiresAt,
      installMethod: "manual",
      provider: { kind: "byo" },
      inventory: hello.inventory,
      createdAt: now,
    });
    forgetAgent(fingerprint);

    return {
      server: insertedId.toString(),
      status: "pending",
      pairingCode,
      pairingExpiresAt: pairingExpiresAt.toISOString(),
      ...await helloConfig(),
    };
  } catch (error) {
    // A concurrent hello with the same key won: report its state instead.
    if ((error as { code?: number }).code === 11000) {
      return registerAgent(hello, fingerprint, clientIp);
    }
    throw error;
  }
};

export const acceptServer = async (opts: {
  server: ObjectId;
  tenant: ObjectId;
  user: { _id: ObjectId; emailVerified?: boolean };
  pairingCode: string;
}) => {
  if (
    !opts.user.emailVerified &&
    !await safetyFlag("SAFETY_ALLOW_UNVERIFIED_EMAIL")
  ) throw Response.forbidden("Verify your email before adding servers");

  const server = await serverModel.findOne(
    { _id: opts.server, tenant: opts.tenant, status: "pending" },
    { projection: { pairingCode: 1, pairingExpiresAt: 1 } },
  );
  if (!server) throw Response.notFound("No pending server with this id");

  if (!server.pairingExpiresAt || server.pairingExpiresAt < new Date()) {
    throw Response.badRequest(
      "Pairing expired: restart the agent to get a new code",
    );
  }

  if (server.pairingCode !== opts.pairingCode.trim().toUpperCase()) {
    throw Response.badRequest("The pairing code does not match");
  }

  const { limits } = await entitlements.resolve(opts.tenant);
  if (!await quotaGuard.acquire(opts.tenant, "servers", limits.servers)) {
    throw Response.forbidden("Your plan's server limit is reached");
  }

  const now = new Date();
  const { modifiedCount } = await serverModel.updateOne(
    { _id: opts.server, status: "pending", pairingCode: server.pairingCode },
    {
      $set: { status: "active", acceptedBy: opts.user._id, acceptedAt: now },
      $unset: { pairingCode: "", pairingExpiresAt: "" },
    },
  );

  if (!modifiedCount) {
    await quotaGuard.release(opts.tenant, "servers");
    throw Response.badRequest("The server was accepted or removed meanwhile");
  }

  // The agent is polling as pending, so give it one lease period to show up.
  await serverLeaseModel.updateOne(
    { _id: opts.server },
    {
      $setOnInsert: {
        tenant: opts.tenant,
        shard: shardOf(opts.server),
        status: "active",
        aliveUntil: new Date(
          now.getTime() + (await getAgentConfig()).leaseMs,
        ),
        offline: false,
        desiredVersion: 0,
        commandSeq: 0,
        deliveredSeq: 0,
      },
    },
    { upsert: true },
  );
};

export const rejectServer = async (server: ObjectId, tenant: ObjectId) => {
  const { modifiedCount } = await serverModel.updateOne(
    { _id: server, tenant, status: "pending" },
    {
      $set: { status: "rejected" },
      $unset: { pairingCode: "", pairingExpiresAt: "" },
    },
  );
  if (!modifiedCount) throw Response.notFound("No pending server with this id");
};

/** Called inside the delete transaction: frees the quota and revokes polling at once. */
export const releaseServer = async (
  server: ObjectId,
  tenant: ObjectId,
  session?: ClientSession,
) => {
  const doc = await serverModel.findOne(
    { _id: server, tenant },
    { projection: { status: 1 }, session },
  );
  if (doc?.status !== "active") return;

  await quotaGuard.release(tenant, "servers", session);
  await serverLeaseModel.deleteOne({ _id: server }, { session });
};

export const issueCommand = async (opts: {
  server: ObjectId;
  tenant: ObjectId;
  type: "ping";
  payload?: Record<string, unknown>;
  createdBy?: ObjectId;
}) => {
  const pending = await agentCommandModel.countDocuments({
    server: opts.server,
    status: "pending",
  });
  if (pending >= await safetyLimit("SAFETY_PENDING_COMMANDS_PER_SERVER")) {
    throw Response.forbidden("Too many commands are waiting for this server");
  }

  const now = new Date();
  const lease = await serverLeaseModel.findOneAndUpdate(
    { _id: opts.server, tenant: opts.tenant, status: "active" },
    {
      $inc: { commandSeq: 1 },
      $set: { fastPollUntil: new Date(now.getTime() + 30_000) },
    },
    { returnDocument: "after", projection: { commandSeq: 1 } },
  );
  if (!lease) throw Response.notFound("No active server with this id");

  const { insertedId } = await agentCommandModel.insertOne({
    tenant: opts.tenant,
    server: opts.server,
    seq: lease.commandSeq,
    type: opts.type,
    payload: opts.payload ?? {},
    status: "pending",
    createdBy: opts.createdBy,
    createdAt: now,
    expiresAt: new Date(now.getTime() + COMMAND_TTL_MS),
  });

  return { command: insertedId, seq: lease.commandSeq };
};

/** Online state for the dashboard: online means the lease has not expired. */
export const serverLiveness = async (tenant: ObjectId) => {
  const now = Date.now();
  const { leaseMs } = await getAgentConfig();
  const leases = await serverLeaseModel
    .find({ tenant }, {
      projection: { aliveUntil: 1, offlineSince: 1 },
      limit: 2_000,
    })
    .toArray();

  return leases.map((lease) => ({
    server: lease._id.toString(),
    online: lease.aliveUntil.getTime() > now,
    lastSeenAt: new Date(lease.aliveUntil.getTime() - leaseMs).toISOString(),
    offlineSince: lease.offlineSince?.toISOString(),
  }));
};
