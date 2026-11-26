import type { ObjectId } from "mongodb";
import { Logger } from "@/core/utils/logger.ts";
import { BoundedCache } from "@/lib/core/boundedCache.ts";
import { hostPort, isPublicAddress } from "@/lib/agents/addresses.ts";
import { refreshSpecs } from "@/lib/deploy/specs.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

/**
 * Servers without a fixed IP (PLAN §8.2): a server is known by its agent's
 * key, and its public address is the one its agent connects from. When that
 * changes (an AWS stop/start without an Elastic IP, a dynamic ISP address),
 * the stored address follows within a poll, its partitions' private-network
 * endpoints with it, and every private-network peer gets the new address.
 */

/** The address each server last polled from, on this instance: no read when unchanged. */
const seen = new BoundedCache<string, string>({
  maxEntries: 50_000,
  ttlMs: 60 * 60_000,
});

/** On a poll: records a new public address of the server, rarely costing a read. */
export async function followAddress(server: ObjectId, ip: string | null) {
  if (!ip || !isPublicAddress(ip)) return;
  const key = server.toHexString();
  if (seen.get(key) === ip) return;
  seen.set(key, ip);
  const before = await serverModel.findOneAndUpdate(
    { _id: server, "inventory.publicIp": { $ne: ip } },
    { $set: { "inventory.publicIp": ip } },
    {
      returnDocument: "before",
      projection: { tenant: 1, "provider.kind": 1, "inventory.publicIp": 1 },
    },
  );
  if (before) await addressChanged(before, ip, before.inventory?.publicIp);
}

/**
 * The server's public address changed from `old` (already stored): its
 * partitions' endpoints follow, and its peers get them and its own.
 */
export async function addressChanged(
  server: {
    _id: ObjectId;
    tenant: ObjectId;
    provider?: { kind?: string };
  },
  ip: string,
  old?: string,
) {
  Logger.info(
    `[network] Server ${server._id} moved from ${old ?? "no address"} to ${ip}`,
  );
  const tenants = [server.tenant];
  // A machine's partitions are reached through its address and a forwarded
  // port (PLAN §27.3). An endpoint set by hand (not the old computed one) stays.
  if ((server.provider?.kind ?? "machine") === "machine") {
    const partitions = await serverModel.find(
      { "provider.host": server._id, "provider.meshPort": { $exists: true } },
      { projection: { tenant: 1, "provider.meshPort": 1 }, limit: 500 },
    ).toArray();
    for (const p of partitions) {
      const port = p.provider.meshPort!;
      await serverModel.updateOne(
        {
          _id: p._id,
          $or: [
            { "mesh.endpoint": { $exists: false } },
            ...(old ? [{ "mesh.endpoint": hostPort(old, port) }] : []),
          ],
        },
        { $set: { "mesh.endpoint": hostPort(ip, port) } },
      );
      tenants.push(p.tenant);
    }
  }
  // Every private-network peer of these tenants: their next spec has it.
  const peers = await serverModel.find(
    {
      tenant: { $in: tenants },
      status: "active",
      "mesh.index": { $exists: true },
    },
    { projection: { _id: 1 }, limit: 2_000 },
  ).toArray();
  if (peers.length) await refreshSpecs(peers.map((p) => p._id));
}
