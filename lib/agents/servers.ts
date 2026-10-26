import { type ClientSession, ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { entitlements, quotaGuard, rateLimiter } from "@/lib/services.ts";
import { safetyFlag, safetyLimit } from "@/lib/limits/safety.ts";
import { pairingCodeOf } from "@/lib/agents/signing.ts";
import { forgetAgent } from "@/lib/agents/agentAuth.ts";
import { shardOf } from "@/lib/agents/sweep.ts";
import { getAgentConfig } from "@/lib/agents/config.ts";
import { prepareHost, resumeHostSetup } from "@/lib/agents/commands.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { bootstrapSessionModel } from "@/schemas/infrastructure/bootstrapSession.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { isPublicAddress } from "@/lib/agents/addresses.ts";
import { createHash, SupportedHashAlg } from "@/core/utils/hash.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import type { THelloResponse, TInventory } from "@/schemas/protocol/agent.ts";

const PAIRING_TTL_MS = 15 * 60_000;

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
    joinToken?: string;
  },
  fingerprint: string,
  clientIp: string | null,
): Promise<THelloResponse> => {
  // The address the agent connects from is how peers on the internet reach
  // it (the mesh endpoint, PLAN §8.2), when it's public.
  const inventory =
    !hello.inventory.publicIp && clientIp && isPublicAddress(clientIp)
      ? { ...hello.inventory, publicIp: clientIp }
      : hello.inventory;
  const existing = await serverModel.findOneAndUpdate(
    { "identity.fingerprint": fingerprint },
    { $set: { inventory } },
    {
      projection: {
        tenant: 1,
        status: 1,
        pairingCode: 1,
        pairingExpiresAt: 1,
        "setup.status": 1,
        "inventory.agentSha256": 1,
      },
    },
  );

  if (existing) {
    if (existing.tenant.toString() !== hello.tenant) {
      throw Response.forbidden("This agent is registered to another tenant");
    }
    // Re-running the SSH wizard on an installed server: report it, change nothing.
    if (hello.joinToken && existing.status === "active") {
      const session = await claimJoinToken(hello.joinToken, existing.tenant);
      if (session) {
        await bootstrapSessionModel.updateOne({ _id: session._id }, {
          $set: { server: existing._id },
        });
      }
    }
    // An agent that restarts mid-setup lost the running command: start it again.
    if (existing.status === "active" && existing.setup?.status !== "ready") {
      await resumeHostSetup(existing._id, existing.tenant);
    } else if (
      // A new agent binary (an update): host setup brings its dependencies up to date.
      existing.status === "active" && existing.inventory?.agentSha256 &&
      inventory.agentSha256 &&
      existing.inventory.agentSha256 !== inventory.agentSha256
    ) {
      await prepareHost(existing._id, existing.tenant);
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

  // An SSH wizard install carries a one-time token: activate without pairing.
  const joined = hello.joinToken &&
    await claimJoinToken(hello.joinToken, tenant._id);
  if (joined) {
    return await registerJoinedAgent(
      { ...hello, inventory },
      fingerprint,
      tenant._id,
      joined,
    );
  }

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
      inventory,
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

/** Atomically consumes a bootstrap session's join token; null when invalid, used or expired. */
const claimJoinToken = async (token: string, tenant: ObjectId) =>
  await bootstrapSessionModel.findOneAndUpdate(
    {
      tokenHash: await createHash(SupportedHashAlg.SHA_256, token),
      tenant,
      status: "installing",
      expiresAt: { $gt: new Date() },
    },
    {
      $set: { status: "registered" },
      $push: { steps: { at: new Date(), message: "Agent registered" } },
    },
    { projection: { createdBy: 1, rental: 1 } },
  );

const registerJoinedAgent = async (
  hello: Parameters<typeof registerAgent>[0],
  fingerprint: string,
  tenant: ObjectId,
  session: {
    _id: ObjectId;
    createdBy: ObjectId;
    rental?: { host: ObjectId; subscription: ObjectId; name: string };
  },
): Promise<THelloResponse> => {
  const failSession = (error: string) =>
    bootstrapSessionModel.updateOne({ _id: session._id }, {
      $set: { status: "failed", error },
    });

  // A rented partition (PLAN §26) was approved by an admin: no plan quota.
  const { rental } = session;
  if (!rental && !await acquireServerSlot(tenant)) {
    await failSession("Your plan's server limit is reached");
    throw Response.forbidden("Your plan's server limit is reached");
  }

  const now = new Date();
  const { insertedId } = await serverModel.insertOne({
    tenant,
    name: rental?.name ?? hello.inventory.hostname,
    labels: {},
    status: "active",
    identity: {
      signPublicKey: hello.signPublicKey,
      boxPublicKey: hello.boxPublicKey,
      fingerprint,
    },
    installMethod: "ssh",
    provider: rental
      ? { kind: "rented", host: rental.host, subscription: rental.subscription }
      : { kind: "byo" },
    inventory: hello.inventory,
    acceptedBy: session.createdBy,
    acceptedAt: now,
    createdAt: now,
  });
  forgetAgent(fingerprint);
  await openLease(insertedId, tenant);
  await bootstrapSessionModel.updateOne({ _id: session._id }, {
    $set: { server: insertedId },
  });
  if (rental) {
    await subscriptionModel.updateOne({ _id: rental.subscription }, {
      $set: { server: insertedId, updatedAt: now },
    });
  }
  await prepareHost(insertedId, tenant, session.createdBy);

  return {
    server: insertedId.toString(),
    status: "active",
    ...await helloConfig(),
  };
};

/** Gate for every way of adding a server (PLAN §20.3 safety limits). */
export const assertCanAddServers = async (
  user: { emailVerified?: boolean },
) => {
  if (
    !user.emailVerified && !await safetyFlag("SAFETY_ALLOW_UNVERIFIED_EMAIL")
  ) throw Response.forbidden("Verify your email before adding servers");
};

const acquireServerSlot = async (tenant: ObjectId) => {
  const { limits } = await entitlements.resolve(tenant);
  return await quotaGuard.acquire(tenant, "servers", limits.servers);
};

/** A fresh lease gives the agent one lease period to show up before it reads as offline. */
const openLease = async (server: ObjectId, tenant: ObjectId) => {
  await serverLeaseModel.updateOne(
    { _id: server },
    {
      $setOnInsert: {
        tenant,
        shard: shardOf(server),
        status: "active",
        aliveUntil: new Date(Date.now() + (await getAgentConfig()).leaseMs),
        offline: false,
        desiredVersion: 0,
        commandSeq: 0,
        deliveredSeq: 0,
      },
    },
    { upsert: true },
  );
};

export const acceptServer = async (opts: {
  server: ObjectId;
  tenant: ObjectId;
  user: { _id: ObjectId; emailVerified?: boolean };
  pairingCode: string;
}) => {
  await assertCanAddServers(opts.user);

  const code = opts.pairingCode.trim().toUpperCase();
  let server = await serverModel.findOne(
    { _id: opts.server, tenant: opts.tenant, status: "pending" },
    {
      projection: {
        pairingCode: 1,
        pairingExpiresAt: 1,
        name: 1,
        "inventory.hostname": 1,
        createdAt: 1,
      },
    },
  );
  if (!server) throw Response.notFound("No pending server with this id");

  // The code is derived from the agent's key, so it names one registration.
  // A reinstalled machine registers again (a new key) next to its old entry,
  // which then can't match: accept the registration the code belongs to.
  if (server.pairingCode !== code) {
    const owner = await serverModel.findOne(
      { tenant: opts.tenant, status: "pending", pairingCode: code },
      {
        projection: {
          pairingCode: 1,
          pairingExpiresAt: 1,
          name: 1,
          "inventory.hostname": 1,
          createdAt: 1,
        },
      },
    );
    if (owner) {
      server = owner;
      opts = { ...opts, server: owner._id };
    }
  }

  if (!server.pairingExpiresAt || server.pairingExpiresAt < new Date()) {
    throw Response.badRequest(
      "Pairing expired: restart the agent to get a new code",
    );
  }

  if (server.pairingCode !== code) {
    throw Response.badRequest("The pairing code does not match");
  }

  if (!await acquireServerSlot(opts.tenant)) {
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

  await openLease(opts.server, opts.tenant);
  await prepareHost(opts.server, opts.tenant, opts.user._id);

  // Earlier registrations of this machine (installed again since) can never
  // be accepted: their agents are gone. Reject them so they stop showing.
  const { modifiedCount: superseded } = await serverModel.updateMany(
    {
      tenant: opts.tenant,
      status: "pending",
      _id: { $ne: opts.server },
      "inventory.hostname": server.inventory.hostname,
      createdAt: { $lt: server.createdAt },
    },
    {
      $set: { status: "rejected" },
      $unset: { pairingCode: "", pairingExpiresAt: "" },
    },
  );

  return { server: opts.server, name: server.name, superseded };
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
    { projection: { status: 1, "provider.kind": 1 }, session },
  );
  if (doc?.status !== "active") return;

  // A rented server never took a quota slot (PLAN §26.6 D).
  if (doc.provider?.kind !== "rented") {
    await quotaGuard.release(tenant, "servers", session);
  }
  await serverLeaseModel.deleteOne({ _id: server }, { session });
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
