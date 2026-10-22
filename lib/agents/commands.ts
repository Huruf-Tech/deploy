import type { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { readNumberSetting, readTextSetting } from "@/lib/core/settings.ts";
import { safetyLimit } from "@/lib/limits/safety.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import { ensureMeshIndex } from "@/lib/network/mesh.ts";
import { MESH_CIDR, subnetOf } from "@/schemas/infrastructure/network.ts";
import type { $commandType, $hostCheck } from "@/schemas/protocol/agent.ts";
import type z from "zod";

const COMMAND_TTL_MS = 6 * 60 * 60_000;

/** The local Docker network for projects (PLAN D35). */
export const PROJECT_NETWORK = "huruf-internal";

export const issueCommand = async (opts: {
  server: ObjectId;
  tenant: ObjectId;
  type: z.output<typeof $commandType>;
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

/**
 * Asks the agent to make the host ready (PLAN §16 Phase 2): Docker installed
 * and configured, the project network, the edge proxy. Idempotent on the
 * agent; the values come from settings (agent defaults, PLAN §20.3 C).
 */
export const prepareHost = async (
  server: ObjectId,
  tenant: ObjectId,
  createdBy?: ObjectId,
) => {
  await serverModel.updateOne({ _id: server }, {
    $set: { setup: { status: "pending", updatedAt: new Date() } },
  });
  // The tenant-unique subnet makes container IPs routable over the mesh (PLAN §8.2).
  const index = await ensureMeshIndex(server, tenant);

  return await issueCommand({
    server,
    tenant,
    type: "docker.ensure",
    createdBy,
    payload: {
      logMaxSize: await readTextSetting("AGENT_CONTAINER_LOG_MAX_SIZE", "10m"),
      logMaxFile: await readNumberSetting("AGENT_CONTAINER_LOG_MAX_FILE", 5),
      edgeImage: await readTextSetting("AGENT_EDGE_IMAGE", "caddy:2-alpine"),
      network: PROJECT_NETWORK,
      ...(index ? { subnet: subnetOf(index), meshCidr: MESH_CIDR } : {}),
    },
  });
};

/**
 * Re-issues `docker.ensure` when an agent restarts before reporting a result
 * (it was delivered but never finished), unless one is still waiting.
 */
export const resumeHostSetup = async (server: ObjectId, tenant: ObjectId) => {
  const waiting = await agentCommandModel.countDocuments({
    server,
    type: "docker.ensure",
    status: "pending",
  });
  if (!waiting) await prepareHost(server, tenant);
};

/** Records a finished `docker.ensure` on the server document. */
export const recordHostSetup = async (
  server: ObjectId,
  outcome: {
    ok: boolean;
    result?: Record<string, unknown>;
    error?: string;
  },
) => {
  const dockerVersion = outcome.result?.dockerVersion as string | undefined;
  const checks = outcome.result?.checks as
    | z.output<typeof $hostCheck>[]
    | undefined;

  // Only fields with values: the driver stores `undefined` as `null`,
  // which the schemas (and the dashboard) treat as invalid.
  await serverModel.updateOne({ _id: server }, {
    $set: {
      setup: {
        status: outcome.ok ? "ready" : "failed",
        ...(dockerVersion ? { dockerVersion } : {}),
        ...(checks ? { checks } : {}),
        ...(outcome.error ? { error: outcome.error } : {}),
        updatedAt: new Date(),
      },
      ...(dockerVersion ? { "inventory.dockerVersion": dockerVersion } : {}),
    },
  });
};
