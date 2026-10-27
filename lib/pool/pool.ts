import { moveRelay } from "@/lib/domains/tunnels.ts";
import { encodeBase64 } from "@std/encoding/base64";
import {
  LIVE_RENTAL,
  subscriptionModel,
} from "@/schemas/billing/subscription.ts";
import { ObjectId } from "mongodb";
import type z from "zod";
import { Response } from "@/core/http/response.ts";
import { readNumberSetting } from "@/lib/core/settings.ts";
import { issueCommand } from "@/lib/agents/commands.ts";
import { agentEndpoints, createJoinToken } from "@/lib/agents/bootstrap.ts";
import { sealTo } from "@/lib/agents/sealing.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { bootstrapSessionModel } from "@/schemas/infrastructure/bootstrapSession.ts";
import { encodeHex } from "@std/encoding/hex";
import {
  type $partitionCreatePayload,
  type $partitionReceivePayload,
  type $partitionSendPayload,
  type $partitionSize,
  type $poolEnsurePayload,
  MOVE_PORT,
} from "@/schemas/protocol/agent.ts";

type TPartitionSize = z.output<typeof $partitionSize>;

/**
 * Machines and their partitions (PLAN §27): every agent is a host; a
 * partition runs our agent and joins a tenant (its owner's, or a renter's,
 * §28). The agent's host role does the work; these issue its commands.
 */

/** Partition names become bridge names (`hp-<name>`): `p` + 11 hex of an id. */
export const partitionName = (id: ObjectId) =>
  `p${id.toHexString().slice(-11)}`;

/** An active machine (PLAN §27), optionally one whose host setup is done. */
async function machine(server: ObjectId, prepared: boolean) {
  const doc = await serverModel.findOne(
    { _id: server, status: "active" },
    {
      projection: {
        tenant: 1,
        name: 1,
        identity: 1,
        pool: 1,
        provider: 1,
        "inventory.publicIp": 1,
        "inventory.privateIp": 1,
      },
    },
  );
  if (!doc) throw Response.notFound("No active server with this id");
  if (doc.provider?.kind === "partition" || doc.provider?.kind === "rented") {
    throw Response.badRequest("This server is a partition, not a machine");
  }
  if (prepared && doc.pool?.status !== "ready") {
    throw Response.badRequest("This machine isn't set up for partitions yet");
  }
  return doc;
}

/** What host setup leaves out of partitions' reach, from settings. */
const reserve = async () => ({
  cpus: await readNumberSetting("POOL_RESERVE_CPUS", 0.25),
  memMb: await readNumberSetting("POOL_RESERVE_MEM_MB", 512),
  diskGb: await readNumberSetting("POOL_RESERVE_DISK_GB", 10),
});

/**
 * Host setup on any machine (PLAN §27.3): Sysbox beside the Docker already
 * there, partition data on a sparse XFS file. Runs at install and again
 * after an agent update.
 */
export async function setUpMachine(server: ObjectId, createdBy?: ObjectId) {
  const doc = await machine(server, false);
  await serverModel.updateOne({ _id: doc._id }, {
    $set: { "pool.status": "pending", "pool.updatedAt": new Date() },
    $unset: { "pool.error": "" },
  });
  const rentals = await subscriptionModel.find({
    kind: "server",
    "rental.host": doc._id,
    "rental.partition": { $exists: true },
    status: { $in: [...LIVE_RENTAL] },
  }, { projection: { "rental.partition": 1 }, limit: 500 }).toArray();
  const payload: z.input<typeof $poolEnsurePayload> = {
    reserve: await reserve(),
    isolated: rentals.map((r) => r.rental!.partition!),
  };
  return await issueCommand({
    server: doc._id,
    tenant: doc.tenant,
    type: "pool.ensure",
    payload,
    createdBy,
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
      ...(outcome.error ? { "pool.error": outcome.error.slice(0, 1_000) } : {}),
      "pool.updatedAt": new Date(),
    },
  });
}

/**
 * A partition on a machine, with our agent inside joining `tenant`
 * through a one-time join token (`partition.create`, sealed: it carries the
 * token).
 */
export async function createPartition(opts: {
  host: ObjectId;
  name: string;
  tenant: ObjectId;
  size: TPartitionSize;
  createdBy: ObjectId;
  /** A rental: the server its agent creates is `rented`, named so (PLAN §26). */
  rental?: { subscription: ObjectId; name: string };
  /** The server's name in the dashboard (PLAN §27). */
  label?: string;
}) {
  // A rental is kept apart on its machine (PLAN §28).
  const isolated = !!opts.rental;
  const doc = await machine(opts.host, true);
  const { session, token } = await createJoinToken({
    tenant: opts.tenant,
    createdBy: opts.createdBy,
    host: `${doc.name}/${opts.name}`,
    port: 0,
    username: "partition",
    partition: {
      host: doc._id,
      name: opts.name,
      size: opts.size,
      ...(opts.label ? { label: opts.label } : {}),
    },
    ...(opts.rental ? { rental: { host: doc._id, ...opts.rental } } : {}),
  });
  const { controlPlaneUrl, downloadBase } = await agentEndpoints();
  const payload: z.input<typeof $partitionCreatePayload> = {
    name: opts.name,
    size: opts.size,
    isolated,
    install: {
      url: controlPlaneUrl,
      tenant: opts.tenant.toHexString(),
      joinToken: token,
      downloadBase,
    },
  };
  const issued = await issueCommand({
    server: doc._id,
    tenant: doc.tenant,
    type: "partition.create",
    payload: {
      sealed: await sealTo(doc.identity.boxPublicKey, JSON.stringify(payload)),
    },
    createdBy: opts.createdBy,
  });
  await bootstrapSessionModel.updateOne({ _id: session }, {
    $set: { "partition.command": issued.command },
  });
  return issued;
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
/** Deletes a partition and its data. */
export const removePartition = partitionCommand("partition.remove");

/** Resizes a partition live. */
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

/** Where a machine serves a moving partition: its public address, else its private one. */
export const moveAddress = (machine: {
  inventory?: { publicIp?: string; privateIp?: string };
}) => {
  const ip = machine.inventory?.publicIp || machine.inventory?.privateIp;
  return ip && `${ip.includes(":") ? `[${ip}]` : ip}:${MOVE_PORT}`;
};

/**
 * Moves a partition between machines (PLAN §26.10): the source stops it
 * and serves it on its address for the move only, the target pulls it and
 * starts it. Both commands are sealed: they carry the move's one-time token
 * and the key that encrypts the transfer. The control plane removes the
 * source's copy once the target reports it running.
 */
export async function movePartition(opts: {
  from: ObjectId;
  to: ObjectId;
  name: string;
  size: TPartitionSize;
  createdBy: ObjectId;
}) {
  const [source, target] = await Promise.all([
    machine(opts.from, true),
    machine(opts.to, true),
  ]);
  const token = encodeHex(crypto.getRandomValues(new Uint8Array(32)));
  const key = encodeBase64(crypto.getRandomValues(new Uint8Array(32)));
  // Machines that can't open a port move through the tunnel server; the
  // target uses whichever of the two answers first.
  const [sourceRelay, targetRelay] = await Promise.all([
    moveRelay(source._id, target._id, opts.name),
    moveRelay(target._id, source._id, opts.name),
  ]);
  const from = moveAddress(source);
  if (!from && !(sourceRelay && targetRelay)) {
    throw Response.badRequest(`${source.name} has no address to move from`);
  }
  const send: z.input<typeof $partitionSendPayload> = {
    name: opts.name,
    listen: `:${MOVE_PORT}`,
    token,
    key,
    ...(sourceRelay && targetRelay ? { relay: sourceRelay } : {}),
  };
  const receive: z.input<typeof $partitionReceivePayload> = {
    name: opts.name,
    size: opts.size,
    // Only rentals move (PLAN §26.10), and they stay apart.
    isolated: true,
    from: from || "",
    token,
    key,
    ...(sourceRelay && targetRelay ? { relay: targetRelay } : {}),
  };
  // The target first: it waits for the source, not the other way round.
  const received = await issueCommand({
    server: target._id,
    tenant: target.tenant,
    type: "partition.receive",
    payload: {
      sealed: await sealTo(
        target.identity.boxPublicKey,
        JSON.stringify(receive),
      ),
    },
    createdBy: opts.createdBy,
  });
  await issueCommand({
    server: source._id,
    tenant: source.tenant,
    type: "partition.send",
    payload: {
      sealed: await sealTo(source.identity.boxPublicKey, JSON.stringify(send)),
    },
    createdBy: opts.createdBy,
  });
  return received;
}
