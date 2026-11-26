import { assert, assertEquals } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import { followAddress } from "@/lib/agents/address.ts";
import { hostPort } from "@/lib/agents/addresses.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { createState } from "@/tools/agent-sim/agent.ts";

// Servers without a fixed IP (PLAN §8.2): the stored address follows the one
// the agent polls from, a machine's partitions with it, and peers learn it.

Deno.test({
  name: "network: a server's new IP is followed, partitions and peers too",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const { tenantId, cleanup } = await testSession("address");
    const ids = {
      machine: new ObjectId(),
      partition: new ObjectId(),
      pinned: new ObjectId(),
      peer: new ObjectId(),
    };
    // Specs are sealed to each server's real key.
    const { boxPublicKey } = await createState("address");
    const server = (
      _id: ObjectId,
      index: number,
      extra: Record<string, unknown>,
    ) => ({
      _id,
      tenant: tenantId,
      name: String(_id),
      labels: {},
      status: "active",
      identity: {
        fingerprint: `address-${_id}`,
        signPublicKey: "x",
        boxPublicKey,
      },
      inventory: {
        hostname: String(_id),
        os: "Ubuntu 24.04",
        arch: "amd64",
        cpuCores: 2,
        memory: 2 ** 31,
        disk: 2 ** 34,
        agentVersion: "test",
        publicIp: "203.0.113.5",
      },
      mesh: { index, enabled: true, publicKey: `key-${index}` },
      ...extra,
    });
    await mongodb.db().collection("servers").insertMany([
      server(ids.machine, 1, { provider: { kind: "machine" } }),
      server(ids.partition, 2, {
        provider: {
          kind: "partition",
          host: ids.machine,
          partition: "p0123456789a",
          meshPort: 51821,
        },
        mesh: {
          index: 2,
          enabled: true,
          publicKey: "key-2",
          endpoint: "203.0.113.5:51821",
        },
      }),
      // An endpoint set by hand stays.
      server(ids.pinned, 3, {
        provider: {
          kind: "partition",
          host: ids.machine,
          partition: "pbbbbbbbbbbb",
          meshPort: 51822,
        },
        mesh: {
          index: 3,
          enabled: true,
          publicKey: "key-3",
          endpoint: "198.51.100.9:6000",
        },
      }),
      server(ids.peer, 4, {
        provider: { kind: "direct" },
        inventory: {
          hostname: "peer",
          os: "Ubuntu 24.04",
          arch: "amd64",
          cpuCores: 2,
          memory: 2 ** 31,
          disk: 2 ** 34,
          agentVersion: "test",
          publicIp: "192.0.2.44",
        },
      }),
    ]);
    await mongodb.db().collection("serverLeases").insertMany(
      Object.values(ids).map((_id) => ({
        _id,
        tenant: tenantId,
        status: "active",
        commandSeq: 0,
        desiredVersion: 0,
      })),
    );
    const doc = (id: ObjectId) => serverModel.findOne({ _id: id });
    const desired = async (id: ObjectId) =>
      (await serverLeaseModel.findOne({ _id: id }))?.desiredVersion ?? 0;

    try {
      await t.step("IPv6 endpoints are bracketed", () => {
        assertEquals(hostPort("203.0.113.5", 51820), "203.0.113.5:51820");
        assertEquals(hostPort("2001:db8::7", 51821), "[2001:db8::7]:51821");
      });

      await t.step("a private address is never taken", async () => {
        await followAddress(ids.machine, "10.0.0.5");
        assertEquals(
          (await doc(ids.machine))?.inventory.publicIp,
          "203.0.113.5",
        );
      });

      await t.step("the machine moves, its partitions with it", async () => {
        const before = await desired(ids.peer);
        await followAddress(ids.machine, "198.51.100.7");
        assertEquals(
          (await doc(ids.machine))?.inventory.publicIp,
          "198.51.100.7",
        );
        assertEquals(
          (await doc(ids.partition))?.mesh?.endpoint,
          "198.51.100.7:51821",
        );
        assertEquals(
          (await doc(ids.pinned))?.mesh?.endpoint,
          "198.51.100.9:6000",
        );
        // Its peers get a spec with the new address.
        assert(await desired(ids.peer) > before, "the peer's spec refreshed");
      });

      await t.step("the same address again costs nothing", async () => {
        const version = await desired(ids.peer);
        await followAddress(ids.machine, "198.51.100.7");
        assertEquals(await desired(ids.peer), version);
      });

      await t.step("an IPv6 address works the same", async () => {
        await followAddress(ids.machine, "2001:db8::7");
        assertEquals(
          (await doc(ids.partition))?.mesh?.endpoint,
          "[2001:db8::7]:51821",
        );
      });
    } finally {
      const db = mongodb.db();
      const all = Object.values(ids);
      await Promise.all([
        db.collection("servers").deleteMany({ _id: { $in: all } }),
        db.collection("serverLeases").deleteMany({ _id: { $in: all } }),
        db.collection("serverSpecs").deleteMany({ _id: { $in: all } }),
      ]);
      await cleanup();
    }
  },
});
