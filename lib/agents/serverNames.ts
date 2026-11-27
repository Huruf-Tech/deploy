import type { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { isDuplicateKeyError } from "@/database.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

/**
 * A server's `.internal` name (PLAN §8.3): `<project>.<dnsName>.srv.internal`
 * reaches one server's replicas of a project, from any server in the private
 * network. Unique in the workspace; kept when the server is renamed.
 */

/** The label a server name suggests: "Web Server #2" → "web-server-2". */
export const dnsLabelOf = (name: string) =>
  name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 36).replace(/-+$/, "") || "server";

/** The server's name, given from its name the first time (with -2, -3… when taken). */
export async function ensureDnsName(
  server: { _id: ObjectId; tenant: ObjectId; name: string; dnsName?: string },
) {
  if (server.dnsName) return server.dnsName;
  const base = dnsLabelOf(server.name);
  for (let n = 1; n <= 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    // The unique index settles races; this check also holds before
    // `setup:prod` has made it.
    if (
      await serverModel.findOne(
        { tenant: server.tenant, dnsName: candidate },
        { projection: { _id: 1 } },
      )
    ) continue;
    try {
      const { modifiedCount } = await serverModel.updateOne(
        { _id: server._id, dnsName: { $exists: false } },
        { $set: { dnsName: candidate } },
      );
      if (modifiedCount) return candidate;
      // Given meanwhile (another instance): that one stands.
      const doc = await serverModel.findOne({ _id: server._id }, {
        projection: { dnsName: 1 },
      });
      return doc?.dnsName;
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }
  }
  return undefined; // 50 servers of one name: it goes without one
}

/** Before a user sets it: refused when another of the workspace's servers has it. */
export async function assertDnsNameFree(
  tenant: ObjectId,
  server: ObjectId,
  dnsName: string,
) {
  const taken = await serverModel.findOne(
    { tenant, dnsName, _id: { $ne: server } },
    { projection: { name: 1 } },
  );
  if (taken) {
    throw Response.badRequest(`${taken.name} already has the name ${dnsName}`);
  }
}
