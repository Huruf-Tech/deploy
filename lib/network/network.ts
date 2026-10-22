import type { ObjectId } from "mongodb";
import { encodeBase64Url } from "@std/encoding/base64url";
import { Response } from "@/core/http/response.ts";
import { refreshSpecs } from "@/lib/deploy/specs.ts";
import {
  endpointOf,
  inMesh,
  meshServers,
  reachable,
  sealRegistryPassword,
} from "@/lib/network/mesh.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import {
  meshIpOf,
  networkModel,
  subnetOf,
} from "@/schemas/infrastructure/network.ts";
import { projectModel } from "@/schemas/applications/project.ts";
import { variableModel } from "@/schemas/configuration/variable.ts";
import { keyring } from "@/lib/services.ts";

/** Every active server of the tenant: mesh peers change for all of them. */
const refreshTenant = async (tenant: ObjectId) =>
  await refreshSpecs((await meshServers(tenant)).map((s) => s._id));

/**
 * `mesh.status` from an agent: its WireGuard public key and which peers it
 * has a recent handshake with. A new key changes every peer's spec.
 */
export async function recordMeshStatus(
  server: ObjectId,
  status: { publicKey: string; peers: Record<string, boolean>; error?: string },
) {
  const before = await serverModel.findOneAndUpdate(
    { _id: server, "mesh.index": { $exists: true } },
    {
      $set: {
        "mesh.publicKey": status.publicKey,
        "mesh.peers": status.peers,
        "mesh.reportedAt": new Date(),
        ...(status.error ? { "mesh.error": status.error } : {}),
      },
      ...(status.error ? {} : { $unset: { "mesh.error": "" } }),
    },
    { returnDocument: "before", projection: { tenant: 1, mesh: 1 } },
  );
  if (before && before.mesh?.publicKey !== status.publicKey) {
    await refreshTenant(before.tenant);
  }
}

/** The private network page (PLAN §15.6): servers, addresses and the reachability matrix. */
export async function networkOverview(tenant: ObjectId) {
  const [servers, network, leases] = await Promise.all([
    meshServers(tenant),
    networkModel.findOne({ tenant }, { projection: { primaryServer: 1 } }),
    serverLeaseModel.find({ tenant }, { projection: { aliveUntil: 1 } })
      .toArray(),
  ]);
  const now = Date.now();
  const members = servers.filter((s) => s.mesh?.index);

  return {
    primaryServer: network?.primaryServer,
    servers: members.map((s) => ({
      _id: s._id,
      name: s.name,
      enabled: inMesh(s),
      meshIp: meshIpOf(s.mesh!.index),
      subnet: subnetOf(s.mesh!.index),
      endpoint: endpointOf(s),
      endpointOverride: s.mesh?.endpoint,
      joined: !!s.mesh?.publicKey,
      online: leases.some((l) =>
        l._id.equals(s._id) && l.aliveUntil.getTime() > now
      ),
      error: s.mesh?.error,
      reportedAt: s.mesh?.reportedAt,
    })),
    reachability: members.flatMap((a) =>
      members.filter((b) => !a._id.equals(b._id)).map((b) => ({
        from: a._id,
        to: b._id,
        reachable: inMesh(a) && inMesh(b) ? reachable(a, b) : null,
      }))
    ),
  };
}

export async function updateMeshMember(
  tenant: ObjectId,
  server: ObjectId,
  patch: { enabled?: boolean; endpoint?: string | null },
) {
  const { matchedCount } = await serverModel.updateOne(
    { _id: server, tenant, "mesh.index": { $exists: true } },
    {
      ...(patch.enabled !== undefined || patch.endpoint
        ? {
          $set: {
            ...(patch.enabled !== undefined
              ? { "mesh.enabled": patch.enabled }
              : {}),
            ...(patch.endpoint ? { "mesh.endpoint": patch.endpoint } : {}),
          },
        }
        : {}),
      ...(patch.endpoint === null ? { $unset: { "mesh.endpoint": "" } } : {}),
    },
  );
  if (!matchedCount) {
    throw Response.notFound(
      "That server isn't set up for the private network yet",
    );
  }
  await refreshTenant(tenant);
}

/**
 * The primary server hosts the built-in registry (PLAN §8.4); the first time,
 * a registry user is created. `null` removes the registry.
 */
export async function setPrimaryServer(
  tenant: ObjectId,
  server: ObjectId | null,
) {
  if (server) {
    const doc = await serverModel.findOne({
      _id: server,
      tenant,
      status: "active",
    }, {
      projection: { mesh: 1 },
    });
    if (!doc || !inMesh(doc)) {
      throw Response.badRequest("Pick a server that is in the private network");
    }
  }
  const network = await networkModel.findOne({ tenant }, {
    projection: { registry: 1 },
  });
  await networkModel.updateOne(
    { tenant },
    server
      ? {
        $set: {
          primaryServer: server,
          ...(network?.registry ? {} : {
            registry: {
              username: "huruf",
              passwordEnc: await sealRegistryPassword(
                tenant,
                encodeBase64Url(crypto.getRandomValues(new Uint8Array(24))),
              ),
            },
          }),
        },
      }
      : { $unset: { primaryServer: "" } },
    { upsert: true },
  );
  await refreshTenant(tenant);
}

const REFERENCE =
  /\$\{\{\s*([a-z0-9-]+)\.[A-Za-z_]\w*\s*\}\}|\b([a-z0-9][a-z0-9-]*)(?:\.[a-z0-9-]+)?\.internal\b/g;

/**
 * Projects this one reaches on other servers (PLAN §8.2): `${{slug.KEY}}`
 * references and `<slug>.internal` names in its variables, plus the
 * `needsPrivateNetwork` flag. Warns when its servers can't reach theirs.
 */
export async function networkWarnings(tenant: ObjectId, projectId: ObjectId) {
  const project = await projectModel.findOne({ _id: projectId, tenant }, {
    projection: { slug: 1, servers: 1, needsPrivateNetwork: 1 },
  });
  if (!project) return [];

  const variables = await variableModel.find(
    { scope: "project", tenant, project: projectId },
    { projection: { valueEnc: 1 } },
  ).toArray();
  const slugs = new Set<string>();
  for (const v of variables) {
    const value = await keyring.decrypt(
      { kind: "tenant", ref: tenant },
      v.valueEnc,
      `variable:${v._id}`,
    );
    for (const [, ref, name] of value.matchAll(REFERENCE)) {
      if ((ref ?? name) !== project.slug) slugs.add(ref ?? name);
    }
  }

  const [targets, servers] = await Promise.all([
    projectModel.find({ tenant, slug: { $in: [...slugs] } }, {
      projection: { slug: 1, servers: 1 },
    }).toArray(),
    meshServers(tenant),
  ]);
  const byId = (id: ObjectId) => servers.find((s) => s._id.equals(id));
  const can = (from: ObjectId, to: ObjectId) => {
    const a = byId(from);
    const b = byId(to);
    return !!a && !!b && reachable(a, b);
  };

  const warnings: string[] = [];
  for (const target of targets) {
    for (const from of project.servers) {
      if (!target.servers.some((to) => can(from, to))) {
        warnings.push(
          `${
            byId(from)?.name ?? "A server"
          } can't reach any server running ${target.slug}. Put them on the same server, or let them reach each other over the private network (UDP 51820 open, or the same VPC).`,
        );
      }
    }
  }
  if (project.needsPrivateNetwork) {
    for (const a of project.servers) {
      for (const b of project.servers) {
        if (a.toHexString() < b.toHexString() && !can(a, b)) {
          warnings.push(
            `${byId(a)?.name} and ${
              byId(b)?.name
            } can't reach each other over the private network.`,
          );
        }
      }
    }
  }
  return warnings;
}
