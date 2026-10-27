import type { ObjectId } from "mongodb";
import { bootstrapSessionModel } from "@/schemas/infrastructure/bootstrapSession.ts";
import {
  LIVE_RENTAL,
  subscriptionModel,
} from "@/schemas/billing/subscription.ts";
import type {
  TPartitionSize,
  TPartitionUsage,
} from "@/schemas/protocol/agent.ts";

type TMachine = {
  _id: ObjectId;
  pool?: { allocatable?: TPartitionSize };
  resources?: { partitions?: TPartitionUsage[] };
};

const NONE: TPartitionSize = { cpus: 0, memMb: 0, diskGb: 0 };

/**
 * What's taken on each machine (PLAN §27, §28): every partition it reports,
 * the owner's and rentals alike, plus partitions being created (their join
 * token waits) and rentals approved but not reported yet. One query each,
 * for any number of machines.
 */
export async function takenOn(machines: TMachine[]) {
  const ids = machines.map((m) => m._id);
  const [sessions, rentals] = await Promise.all([
    bootstrapSessionModel.find({
      "partition.host": { $in: ids },
      status: "installing",
      expiresAt: { $gt: new Date() },
    }, { projection: { partition: 1 } }).toArray(),
    subscriptionModel.find({
      kind: "server",
      "rental.host": { $in: ids },
      status: { $in: [...LIVE_RENTAL] },
    }, {
      projection: { "rental.host": 1, "rental.size": 1, "rental.partition": 1 },
    }).toArray(),
  ]);
  const taken = new Map<string, TPartitionSize>();
  for (const m of machines) {
    const sizes = new Map<string, TPartitionSize>();
    for (const p of m.resources?.partitions ?? []) sizes.set(p.name, p.size);
    for (const s of sessions) {
      const p = s.partition!;
      if (p.host.equals(m._id) && p.size && !sizes.has(p.name)) {
        sizes.set(p.name, p.size);
      }
    }
    for (const r of rentals) {
      const { host, partition, size } = r.rental!;
      if (host!.equals(m._id) && partition && !sizes.has(partition)) {
        sizes.set(partition, size);
      }
    }
    taken.set(
      String(m._id),
      [...sizes.values()].reduce((a, s) => ({
        cpus: a.cpus + s.cpus,
        memMb: a.memMb + s.memMb,
        diskGb: a.diskGb + s.diskGb,
      }), NONE),
    );
  }
  return taken;
}

/** A machine's allocatable capacity minus what's taken (memory and disk; CPU is shared). */
export function freeOf(machine: TMachine, taken: TPartitionSize) {
  const all = machine.pool?.allocatable ?? NONE;
  return {
    memMb: all.memMb - taken.memMb,
    diskGb: all.diskGb - taken.diskGb,
  };
}
