import { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { entitlements } from "@/lib/services.ts";
import { retireServer } from "@/lib/agents/retire.ts";
import {
  createPartition,
  partitionName,
  removePartition,
  resizePartition,
} from "@/lib/pool/pool.ts";
import { serverModel, SLOT_SERVERS } from "@/schemas/infrastructure/server.ts";
import { bootstrapSessionModel } from "@/schemas/infrastructure/bootstrapSession.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import {
  LIVE_RENTAL,
  subscriptionModel,
} from "@/schemas/billing/subscription.ts";
import { planModel } from "@/schemas/billing/plan.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { detachServer } from "@/lib/deploy/projects.ts";
import { freeOf, takenOn } from "@/lib/pool/room.ts";
import type { TPartitionSize as TSize } from "@/schemas/protocol/agent.ts";

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

export async function createOwnPartition(opts: {
  tenant: ObjectId;
  machine: ObjectId;
  user: ObjectId;
  label?: string;
  size: TSize;
}) {
  const doc = await ownMachine(opts.tenant, opts.machine);
  const free = freeOf(doc, (await takenOn([doc])).get(String(doc._id))!);
  const cpus = doc.pool!.allocatable!.cpus;
  if (
    opts.size.cpus > cpus || opts.size.memMb > free.memMb ||
    opts.size.diskGb > free.diskGb
  ) {
    throw Response.badRequest(
      `At most ${cpus} vCPU, ${free.memMb} MB of memory and ${free.diskGb} GB of disk are free on ${doc.name}`,
    );
  }
  // The slot is taken when its agent joins; fail early if there's none.
  const { limits } = await entitlements.resolve(opts.tenant);
  const servers = await serverModel.countDocuments({
    tenant: opts.tenant,
    ...SLOT_SERVERS,
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
      status: { $in: [...LIVE_RENTAL] },
    });
  if (rented) {
    throw Response.badRequest("A rented partition goes with its rental");
  }
  const reported = machine.resources?.partitions?.some((p) =>
    p.name === opts.name
  );
  // Being created (or failed to be): its join token goes, so it can't join later.
  const { modifiedCount: creating } = await bootstrapSessionModel.updateMany({
    tenant: opts.tenant,
    "partition.host": opts.machine,
    "partition.name": opts.name,
    status: "installing",
  }, { $set: { status: "failed", error: "Removed" } });
  if (!doc && !reported && !creating) {
    throw Response.notFound("No partition with this name on this machine");
  }
  const { command } = await removePartition(opts.machine, opts.name);
  if (doc) await retireServer(opts.tenant, doc._id);
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
    for (const p of partitions) await retireServer(tenant, p._id);
  }
}

/**
 * A machine's partitions: those it reports, each with its server or whether
 * it's still joining (its join token waits), and those being created that it
 * doesn't report yet, with the machine's error if creating failed. A
 * reported one with neither has lost its server: remove it.
 */
export async function partitionsOf(tenant: ObjectId, machine: ObjectId) {
  const doc = await serverModel.findOne(
    { _id: machine, tenant, "provider.kind": "machine" },
    { projection: { "resources.partitions": 1 } },
  );
  if (!doc) throw Response.notFound("No machine with this id");
  const reported = doc.resources?.partitions ?? [];
  const [servers, sessions] = await Promise.all([
    serverModel.find({ tenant, "provider.host": machine }, {
      projection: { name: 1, "provider.partition": 1 },
    }).toArray(),
    bootstrapSessionModel.find({
      tenant,
      "partition.host": machine,
      status: "installing",
      expiresAt: { $gt: new Date() },
    }, { projection: { partition: 1, createdAt: 1 } }).toArray(),
  ]);
  // Rentals on a platform machine (PLAN §28): theirs, changed through the rental.
  const rentals = await subscriptionModel.find({
    kind: "server",
    "rental.host": machine,
    status: { $in: [...LIVE_RENTAL] },
  }, { projection: { tenant: 1, plan: 1, "rental.partition": 1 } }).toArray();
  const [tenants, plans] = await Promise.all([
    tenantModel.find({ _id: { $in: rentals.map((r) => r.tenant) } }, {
      projection: { name: 1 },
    }).toArray(),
    planModel.find({ _id: { $in: rentals.map((r) => r.plan) } }, {
      projection: { name: 1 },
    }).toArray(),
  ]);
  const rentalOf = (name: string) => {
    const r = rentals.find((x) => x.rental?.partition === name);
    return r && {
      tenant: tenants.find((t) => t._id.equals(r.tenant))?.name ?? "",
      plan: plans.find((p) => p._id.equals(r.plan))?.name ?? "",
    };
  };
  const commands = await agentCommandModel.find({
    _id: { $in: sessions.flatMap((s) => s.partition?.command ?? []) },
  }, { projection: { status: 1, error: 1 } }).toArray();
  const serverOf = (name: string) =>
    servers.find((s) => s.provider?.partition === name);
  type TRow = {
    name: string;
    size?: TSize;
    state?: string;
    memUsed?: number;
    diskUsed?: number;
    server?: { _id: string; name: string };
    joining: boolean;
    rented?: { tenant: string; plan: string };
    creating?: boolean;
    error?: string;
    label?: string;
  };
  const rows: TRow[] = reported.map((p) => {
    const server = serverOf(p.name);
    return {
      name: p.name,
      size: p.size,
      state: p.state,
      memUsed: p.memUsed,
      diskUsed: p.diskUsed,
      ...(server
        ? { server: { _id: String(server._id), name: server.name } }
        : {}),
      ...(rentalOf(p.name) ? { rented: rentalOf(p.name) } : {}),
      joining: !server && !rentalOf(p.name) &&
        sessions.some((s) => s.partition?.name === p.name),
    };
  });
  for (const session of sessions) {
    const name = session.partition!.name;
    if (reported.some((p) => p.name === name) || serverOf(name)) continue;
    const command = commands.find((c) =>
      c._id.equals(session.partition!.command ?? new ObjectId())
    );
    rows.push(
      {
        name,
        joining: command?.status !== "failed",
        creating: true,
        ...(command?.status === "failed"
          ? { error: command.error ?? "The machine couldn't create it" }
          : {}),
        label: session.partition!.label,
      },
    );
  }
  return rows;
}
