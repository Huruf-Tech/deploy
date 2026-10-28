import type { ObjectId } from "mongodb";
import { serverOutageModel } from "@/schemas/infrastructure/serverOutage.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";

const DAY_MS = 24 * 60 * 60_000;
const KEEP_MS = 120 * DAY_MS;

/** A server polled again after its lease ran out: it was down since then. */
export async function recordOutage(
  server: ObjectId,
  tenant: ObjectId,
  from: Date,
  to: Date,
) {
  if (to <= from) return;
  await serverOutageModel.insertOne({
    server,
    tenant,
    from,
    to,
    expiresAt: new Date(to.getTime() + KEEP_MS),
  });
}

/**
 * Each server's uptime over the last `days` (PLAN §29), in percent: the
 * time it wasn't down, counted from when it was added if that's later. A
 * server down right now counts until now. One query each for every server.
 */
export async function uptimesOf(
  servers: { _id: ObjectId; createdAt?: Date }[],
  days = 30,
  now = new Date(),
) {
  const since = new Date(now.getTime() - days * DAY_MS);
  const ids = servers.map((s) => s._id);
  const [outages, leases] = await Promise.all([
    serverOutageModel.find({ server: { $in: ids }, to: { $gt: since } }, {
      projection: { server: 1, from: 1, to: 1 },
    }).toArray(),
    serverLeaseModel.find({ _id: { $in: ids }, aliveUntil: { $lt: now } }, {
      projection: { aliveUntil: 1 },
    }).toArray(),
  ]);
  const out = new Map<string, number>();
  for (const server of servers) {
    const start = Math.max(
      since.getTime(),
      server.createdAt?.getTime() ?? since.getTime(),
    );
    const window = now.getTime() - start;
    if (window <= 0) continue;
    let down = 0;
    for (const o of outages) {
      if (!o.server.equals(server._id)) continue;
      down += Math.max(
        0,
        Math.min(o.to.getTime(), now.getTime()) -
          Math.max(o.from.getTime(), start),
      );
    }
    const lease = leases.find((l) => l._id.equals(server._id));
    if (lease) {
      down += now.getTime() - Math.max(lease.aliveUntil.getTime(), start);
    }
    out.set(String(server._id), Math.max(0, 100 * (1 - down / window)));
  }
  return out;
}
