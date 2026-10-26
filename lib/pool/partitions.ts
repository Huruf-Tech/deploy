import { ObjectId } from "mongodb";
import type z from "zod";
import { Response } from "@/core/http/response.ts";
import { entitlements } from "@/lib/services.ts";
import { releaseServer } from "@/lib/agents/servers.ts";
import {
  createPartition,
  partitionName,
  removePartition,
  resizePartition,
} from "@/lib/pool/pool.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { detachServer } from "@/lib/deploy/projects.ts";
import type { $partitionSize } from "@/schemas/protocol/agent.ts";

type TSize = z.output<typeof $partitionSize>;

/**
 * A tenant's own partitions (PLAN §27.2): the customer gives part of a
 * machine to Huruf Deploy and leaves the rest to other tools. A partition is
 * a server (it takes a plan slot); its machine isn't. Rented partitions are
 * changed through their rental only (§26).
 */

async function ownMachine(tenant: ObjectId, id: ObjectId) {
  const doc = await serverModel.findOne(
    { _id: id, tenant, status: "active", "provider.kind": "machine" },
    { projection: { name: 1, pool: 1, "resources.partitions": 1 } },
  );
  if (!doc) throw Response.notFound("No machine with this id");
  if (doc.pool?.status !== "ready") {
    throw Response.badRequest(
      "The machine is still being set up for partitions",
    );
  }
  return doc;
}

/** What's left on a machine: its allocatable capacity minus its partitions. */
export const freeOn = (
  doc: Awaited<ReturnType<typeof ownMachine>>,
) => {
  const all = doc.pool!.allocatable!;
  const used = (doc.resources?.partitions ?? []).reduce(
    (u, p) => ({
      memMb: u.memMb + p.size.memMb,
      diskGb: u.diskGb + p.size.diskGb,
    }),
    { memMb: 0, diskGb: 0 },
  );
  return {
    cpus: all.cpus,
    memMb: all.memMb - used.memMb,
    diskGb: all.diskGb - used.diskGb,
  };
};

export async function createOwnPartition(opts: {
  tenant: ObjectId;
  machine: ObjectId;
  user: ObjectId;
  label?: string;
  size: TSize;
}) {
  const doc = await ownMachine(opts.tenant, opts.machine);
  const free = freeOn(doc);
  if (
    opts.size.cpus > free.cpus || opts.size.memMb > free.memMb ||
    opts.size.diskGb > free.diskGb
  ) {
    throw Response.badRequest(
      `At most ${free.cpus} vCPU, ${free.memMb} MB of memory and ${free.diskGb} GB of disk are free on ${doc.name}`,
    );
  }
  // The slot is taken when its agent joins; fail early if there's none.
  const { limits } = await entitlements.resolve(opts.tenant);
  const servers = await serverModel.countDocuments({
    tenant: opts.tenant,
    status: "active",
    "provider.kind": { $in: ["partition", "byo"] },
  });
  if (servers >= limits.servers) {
    throw Response.forbidden(`Your plan allows ${limits.servers} servers`);
  }
  const name = partitionName(new ObjectId());
  await createPartition({
    host: doc._id,
    name,
    tenant: opts.tenant,
    size: opts.size,
    createdBy: opts.user,
    label: opts.label?.trim() || doc.name,
  });
  return { name };
}

/** One of this tenant's partitions on its machine (not a rented one). */
async function ownPartition(tenant: ObjectId, machine: ObjectId, name: string) {
  const doc = await serverModel.findOne({
    tenant,
    "provider.host": machine,
    "provider.partition": name,
  }, { projection: { provider: 1, status: 1 } });
  if (!doc) throw Response.notFound("No partition with this name");
  if (doc.provider.kind === "rented") {
    throw Response.badRequest("A rented partition changes through its rental");
  }
  return doc;
}

export async function resizeOwnPartition(opts: {
  tenant: ObjectId;
  machine: ObjectId;
  name: string;
  size: TSize;
}) {
  await ownMachine(opts.tenant, opts.machine);
  await ownPartition(opts.tenant, opts.machine, opts.name);
  // The agent refuses what doesn't fit, or shrinking below what it uses.
  return await resizePartition(opts.machine, opts.name, opts.size);
}

/**
 * Deletes a partition with its projects and their data, and its server. It
 * works from what the machine reports too, so a partition whose server is
 * gone can still be removed. Returns the machine's command, whose result
 * says whether the agent removed it.
 */
export async function removeOwnPartition(opts: {
  tenant: ObjectId;
  machine: ObjectId;
  name: string;
}) {
  const machine = await serverModel.findOne({
    _id: opts.machine,
    tenant: opts.tenant,
    "provider.kind": "machine",
  }, { projection: { "resources.partitions": 1 } });
  if (!machine) throw Response.notFound("No machine with this id");
  const doc = await serverModel.findOne({
    tenant: opts.tenant,
    "provider.host": opts.machine,
    "provider.partition": opts.name,
  }, { projection: { provider: 1 } });
  const rented = doc?.provider.kind === "rented" ||
    await subscriptionModel.countDocuments({
      "rental.host": opts.machine,
      "rental.partition": opts.name,
      status: { $in: ["active", "pastDue", "suspended"] },
    });
  if (rented) {
    throw Response.badRequest("A rented partition goes with its rental");
  }
  const reported = machine.resources?.partitions?.some((p) =>
    p.name === opts.name && !p.remainder
  );
  if (!doc && !reported) {
    throw Response.notFound("No partition with this name on this machine");
  }
  const { command } = await removePartition(opts.machine, opts.name);
  if (doc) {
    await detachServer(opts.tenant, doc._id);
    await releaseServer(doc._id, opts.tenant);
    await serverModel.deleteOne({ _id: doc._id, tenant: opts.tenant });
  }
  return { command: String(command) };
}

/**
 * Deleting a server (PLAN §27.4): its projects go with it (or drop it, when
 * they run elsewhere too); a partition goes from its machine, and the delete
 * is refused when that can't be started; a machine takes its partitions'
 * servers with it (its uninstall removes the partitions themselves).
 */
export async function onServerDeleted(id: ObjectId, tenant: ObjectId) {
  const doc = await serverModel.findOne({ _id: id, tenant }, {
    projection: { provider: 1 },
  });
  if (doc?.provider?.kind === "partition" && doc.provider.host) {
    try {
      await removePartition(doc.provider.host, doc.provider.partition!);
    } catch (error) {
      // Only a machine that's gone has nothing left to remove.
      if ((error as Response)?.status !== 404) throw error;
    }
  }
  await detachServer(tenant, id);
  if (doc?.provider?.kind === "machine") {
    const partitions = await serverModel.find({
      tenant,
      "provider.host": id,
      "provider.kind": "partition",
    }, { projection: { _id: 1 } }).toArray();
    for (const p of partitions) {
      await detachServer(tenant, p._id);
      await releaseServer(p._id, tenant);
      await serverModel.deleteOne({ _id: p._id });
    }
  }
}
