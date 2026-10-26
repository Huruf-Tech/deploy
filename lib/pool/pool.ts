import { ObjectId } from "mongodb";
import type z from "zod";
import { Response } from "@/core/http/response.ts";
import { readNumberSetting, readTextSetting } from "@/lib/core/settings.ts";
import { hostSetupPayload, issueCommand } from "@/lib/agents/commands.ts";
import { agentEndpoints, createJoinToken } from "@/lib/agents/bootstrap.ts";
import { sealTo } from "@/lib/agents/sealing.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import type {
  $partitionCreatePayload,
  $partitionSize,
  $poolEnsurePayload,
} from "@/schemas/protocol/agent.ts";

type TPartitionSize = z.output<typeof $partitionSize>;

/**
 * Pool machines and their partitions (PLAN §26.5): a pool machine is one of
 * the platform tenant's servers, split into partitions that each run our
 * agent and join a tenant. The agent's host role does the work; these issue
 * its commands.
 */

/** Partition names become bridge names (`hp-<name>`): `p` + 11 hex of an id. */
export const partitionName = (id: ObjectId) =>
  `p${id.toHexString().slice(-11)}`;

async function platformTenant() {
  const id = await readTextSetting("PLATFORM_TENANT", "");
  if (!ObjectId.isValid(id)) {
    throw Response.badRequest("Payments aren't set up yet");
  }
  return new ObjectId(id);
}

/** An active server of the platform tenant, optionally prepared as a pool machine. */
async function machine(server: ObjectId, prepared: boolean) {
  const doc = await serverModel.findOne(
    { _id: server, status: "active" },
    { projection: { tenant: 1, name: 1, identity: 1, pool: 1 } },
  );
  if (!doc) throw Response.notFound("No active server with this id");
  if (!doc.tenant.equals(await platformTenant())) {
    throw Response.forbidden(
      "Only the platform's own servers can be pool machines",
    );
  }
  if (prepared && doc.pool?.status !== "ready") {
    throw Response.badRequest("This server isn't a ready pool machine");
  }
  return doc;
}

/**
 * Makes a platform server a pool machine (`pool.ensure`): Sysbox, the XFS
 * partition volume, Docker on it, the partition network rules, then the
 * usual host setup. For a fresh machine only; the agent refuses otherwise.
 */
export async function makePoolMachine(opts: {
  server: ObjectId;
  volume: z.input<typeof $poolEnsurePayload>["volume"];
  createdBy?: ObjectId;
}) {
  const doc = await machine(opts.server, false);
  await serverModel.updateOne({ _id: doc._id }, {
    $set: { "pool.status": "pending", "pool.updatedAt": new Date() },
    $unset: { "pool.error": "" },
  });
  const allowIps = (await readTextSetting("POOL_ALLOW_IPS", ""))
    .split(/[\s,]+/).filter(Boolean);
  const payload: z.input<typeof $poolEnsurePayload> = {
    reserve: {
      cpus: await readNumberSetting("POOL_RESERVE_CPUS", 0.25),
      memMb: await readNumberSetting("POOL_RESERVE_MEM_MB", 512),
      diskGb: await readNumberSetting("POOL_RESERVE_DISK_GB", 10),
    },
    volume: opts.volume,
    allowIps,
    docker: await hostSetupPayload(doc._id, doc.tenant),
  };
  return await issueCommand({
    server: doc._id,
    tenant: doc.tenant,
    type: "pool.ensure",
    payload,
    createdBy: opts.createdBy,
  });
}

/** Records a finished `pool.ensure` on the server document. */
export async function recordPoolSetup(
  server: ObjectId,
  outcome: { ok: boolean; result?: Record<string, unknown>; error?: string },
) {
  const result = outcome.result ?? {};
  // Field by field: the admin's class, accepting flag and cost stay.
  await serverModel.updateOne({ _id: server }, {
    $set: {
      "pool.status": outcome.ok ? "ready" : "failed",
      ...(result.allocatable
        ? { "pool.allocatable": result.allocatable as TPartitionSize }
        : {}),
      ...(typeof result.sysbox === "string"
        ? { "pool.sysbox": result.sysbox }
        : {}),
      ...(Array.isArray(result.notes)
        ? { "pool.notes": result.notes as string[] }
        : {}),
      ...(outcome.error ? { "pool.error": outcome.error.slice(0, 1_000) } : {}),
      "pool.updatedAt": new Date(),
    },
  });
}

/**
 * A partition on a pool machine, with our agent inside joining `tenant`
 * through a one-time join token (`partition.create`, sealed: it carries the
 * token). The remainder is sized by the machine; a rental needs `size`.
 */
export async function createPartition(opts: {
  host: ObjectId;
  name: string;
  tenant: ObjectId;
  size?: TPartitionSize;
  remainder?: boolean;
  createdBy: ObjectId;
  /** A rental: the server its agent creates is `rented`, named so (PLAN §26). */
  rental?: { subscription: ObjectId; name: string };
}) {
  const doc = await machine(opts.host, true);
  const { token } = await createJoinToken({
    tenant: opts.tenant,
    createdBy: opts.createdBy,
    host: `${doc.name}/${opts.name}`,
    port: 0,
    username: "partition",
    ...(opts.rental ? { rental: { host: doc._id, ...opts.rental } } : {}),
  });
  const { controlPlaneUrl, downloadBase } = await agentEndpoints();
  const payload: z.input<typeof $partitionCreatePayload> = {
    name: opts.name,
    ...(opts.size ? { size: opts.size } : {}),
    remainder: opts.remainder ?? false,
    install: {
      url: controlPlaneUrl,
      tenant: opts.tenant.toHexString(),
      joinToken: token,
      downloadBase,
    },
  };
  return await issueCommand({
    server: doc._id,
    tenant: doc.tenant,
    type: "partition.create",
    payload: {
      sealed: await sealTo(doc.identity.boxPublicKey, JSON.stringify(payload)),
    },
    createdBy: opts.createdBy,
  });
}

const partitionCommand = (
  type: "partition.stop" | "partition.start" | "partition.remove",
) =>
async (host: ObjectId, name: string, createdBy?: ObjectId) => {
  const doc = await machine(host, true);
  return await issueCommand({
    server: doc._id,
    tenant: doc.tenant,
    type,
    payload: { name },
    createdBy,
  });
};

/** Suspends a partition: everything in it stops, data and size are kept. */
export const stopPartition = partitionCommand("partition.stop");
export const startPartition = partitionCommand("partition.start");
/** Deletes a partition and its data; its size goes back to the remainder. */
export const removePartition = partitionCommand("partition.remove");

/** Resizes a rented partition live; the remainder gives or takes the difference. */
export async function resizePartition(
  host: ObjectId,
  name: string,
  size: TPartitionSize,
  createdBy?: ObjectId,
) {
  const doc = await machine(host, true);
  return await issueCommand({
    server: doc._id,
    tenant: doc.tenant,
    type: "partition.resize",
    payload: { name, size },
    createdBy,
  });
}
