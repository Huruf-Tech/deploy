import type { ObjectId, WithId } from "mongodb";
import { keyring } from "@/lib/services.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { serverModel, type TServer } from "@/schemas/infrastructure/server.ts";
import {
  MAX_MESH_INDEX,
  MESH_PORT,
  meshIpOf,
  networkModel,
  subnetOf,
} from "@/schemas/infrastructure/network.ts";
import type { TDesiredSpec } from "@/schemas/protocol/agent.ts";

/**
 * Private network building blocks (PLAN §8.2–8.4) with no spec refreshes, so
 * spec computation and host setup can use them. Actions that change specs are
 * in lib/network/network.ts.
 */

type TServerDoc = WithId<TServer>;

/**
 * The server's index in its tenant's network: its mesh address and container
 * subnet derive from it. Allocated once, on first host setup.
 */
export async function ensureMeshIndex(server: ObjectId, tenant: ObjectId) {
  const current = await serverModel.findOne({ _id: server }, {
    projection: { mesh: 1 },
  });
  if (current?.mesh?.index) return current.mesh.index;

  const network = await networkModel.findOneAndUpdate(
    { tenant },
    { $inc: { nextIndex: 1 } },
    { upsert: true, returnDocument: "after", projection: { nextIndex: 1 } },
  );
  const index = network!.nextIndex;
  if (index > MAX_MESH_INDEX) return undefined; // no address left: stays out of the mesh

  const claimed = await serverModel.updateOne(
    { _id: server, "mesh.index": { $exists: false } },
    { $set: { mesh: { index, enabled: true } } },
  );
  if (claimed.modifiedCount) return index;
  // Another request set it first.
  return (await serverModel.findOne({ _id: server }, {
    projection: { mesh: 1 },
  }))?.mesh?.index;
}

/** Where peers send WireGuard packets: the override, else the public, else the private IP. */
export const endpointOf = (server: Pick<TServerDoc, "mesh" | "inventory">) => {
  if (server.mesh?.endpoint) return server.mesh.endpoint;
  const ip = server.inventory.publicIp || server.inventory.privateIp;
  return ip ? `${ip}:${MESH_PORT}` : undefined;
};

export const inMesh = (server: Pick<TServerDoc, "mesh">) =>
  !!server.mesh?.index && server.mesh.enabled !== false;

/** Either side saw a recent WireGuard handshake: they can talk (PLAN §8.2). */
export const reachable = (
  a: Pick<TServerDoc, "_id" | "mesh">,
  b: Pick<TServerDoc, "_id" | "mesh">,
) =>
  a._id.equals(b._id) ||
  (inMesh(a) && inMesh(b) &&
    (!!a.mesh?.peers?.[b._id.toHexString()] ||
      !!b.mesh?.peers?.[a._id.toHexString()]));

/** The tenant's active servers, with what the mesh needs. */
export const meshServers = (tenant: ObjectId) =>
  serverModel.find(
    { tenant, status: "active" },
    {
      projection: { name: 1, mesh: 1, inventory: 1, labels: 1 },
      limit: MAX_MESH_INDEX + 10,
    },
  ).toArray();

const registryPassword = (tenant: ObjectId, passwordEnc: string) =>
  keyring.decrypt(
    { kind: "tenant", ref: tenant },
    passwordEnc,
    `network:${tenant}:registry`,
  );

export const sealRegistryPassword = (tenant: ObjectId, password: string) =>
  keyring.encrypt(
    { kind: "tenant", ref: tenant },
    password,
    `network:${tenant}:registry`,
  );

/** The built-in registry, when the tenant has a primary server in the mesh. */
export async function builtinRegistry(
  tenant: ObjectId,
  servers?: TServerDoc[],
) {
  const network = await networkModel.findOne({ tenant });
  if (!network?.primaryServer || !network.registry) return undefined;
  const all = servers ?? await meshServers(tenant);
  const primary = all.find((s) => s._id.equals(network.primaryServer!));
  if (!primary || !inMesh(primary)) return undefined;
  return {
    primary,
    host: `${meshIpOf(primary.mesh!.index)}:5000`,
    username: network.registry.username,
    password: await registryPassword(tenant, network.registry.passwordEnc),
  };
}

/** This server's part of the desired state: WireGuard peers and, on the primary, the registry. */
export async function meshSpecFor(
  server: TServerDoc,
): Promise<Pick<TDesiredSpec, "mesh" | "registry">> {
  // Host setup installs WireGuard's tools: join only once it's done.
  if (!inMesh(server) || server.setup?.status !== "ready") return {};
  const servers = await meshServers(server.tenant);
  const index = server.mesh!.index;

  const peers = servers
    .filter((s) => !s._id.equals(server._id) && inMesh(s) && s.mesh?.publicKey)
    .map((s) => {
      const endpoint = endpointOf(s);
      return {
        server: s._id.toHexString(),
        publicKey: s.mesh!.publicKey!,
        ...(endpoint ? { endpoint } : {}),
        meshIp: meshIpOf(s.mesh!.index),
        subnet: subnetOf(s.mesh!.index),
      };
    })
    .sort((a, b) => a.server.localeCompare(b.server));

  const registry = await builtinRegistry(server.tenant, servers);
  return {
    mesh: {
      address: `${meshIpOf(index)}/16`,
      listenPort: MESH_PORT,
      subnet: subnetOf(index),
      peers,
    },
    ...(registry?.primary._id.equals(server._id)
      ? {
        registry: {
          listen: registry.host,
          username: registry.username,
          password: registry.password,
          image: await readTextSetting("AGENT_REGISTRY_IMAGE", "registry:2"),
        },
      }
      : {}),
  };
}
