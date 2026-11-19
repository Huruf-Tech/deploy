import { assertEquals } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";

// Rebooting a server: its own host, or for a partition, its machine restarts
// it; a rented one only while its rental runs. The owner only.

Deno.test({
  name: "servers: reboot a host, restart a partition through its machine",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const owner = await testSession("reboot-owner");
    const db = mongodb.db();
    const tenant = owner.tenantId;
    const ids = {
      machine: new ObjectId(),
      partition: new ObjectId(),
      rented: new ObjectId(),
      plain: new ObjectId(),
    };
    const subscription = new ObjectId();
    const server = (_id: ObjectId, provider?: Record<string, unknown>) => ({
      _id,
      tenant,
      name: String(_id),
      identity: { fingerprint: `reboot-${_id}` },
      status: "active",
      ...(provider ? { provider } : {}),
    });
    await db.collection("servers").insertMany([
      server(ids.plain),
      {
        ...server(ids.machine, { kind: "machine" }),
        pool: { status: "ready" },
      },
      server(ids.partition, {
        kind: "partition",
        host: ids.machine,
        partition: "p0123456789a",
      }),
      server(ids.rented, {
        kind: "rented",
        host: ids.machine,
        partition: "pbbbbbbbbbbb",
        subscription,
      }),
    ]);
    await db.collection("serverLeases").insertMany(
      Object.values(ids).map((_id) => ({
        _id,
        tenant,
        status: "active",
        commandSeq: 0,
      })),
    );
    await db.collection("subscriptions").insertOne({
      _id: subscription,
      status: "suspended",
    });
    const reboot = (id: ObjectId) =>
      owner.call("POST", `/servers/api/${id}/reboot`, {});
    const issued = async (command: string) =>
      await agentCommandModel.findOne({ _id: new ObjectId(command) });

    try {
      await t.step("a server or machine reboots its own host", async () => {
        for (const id of [ids.plain, ids.machine]) {
          const res = await reboot(id);
          assertEquals(res.status, 200, JSON.stringify(res.json));
          const command = await issued(res.json.command);
          assertEquals([command?.type, String(command?.server)], [
            "host.reboot",
            String(id),
          ]);
        }
      });

      await t.step("a partition is restarted by its machine", async () => {
        const res = await reboot(ids.partition);
        assertEquals(res.status, 200, JSON.stringify(res.json));
        const command = await issued(res.json.command);
        assertEquals(
          [command?.type, String(command?.server), command?.payload],
          ["partition.restart", String(ids.machine), {
            name: "p0123456789a",
          }],
        );
      });

      await t.step("a suspended rental stays stopped", async () => {
        const res = await reboot(ids.rented);
        assertEquals(res.status, 400);
        await db.collection("subscriptions").updateOne({ _id: subscription }, {
          $set: { status: "active" },
        });
        const running = await reboot(ids.rented);
        assertEquals(running.status, 200, JSON.stringify(running.json));
        assertEquals(
          (await issued(running.json.command))?.type,
          "partition.restart",
        );
      });

      await t.step("another workspace's server is not found", async () => {
        const other = await testSession("reboot-other");
        try {
          assertEquals(
            (await other.call(
              "POST",
              `/servers/api/${ids.plain}/reboot`,
              {},
            )).status,
            404,
          );
        } finally {
          await other.cleanup();
        }
      });
    } finally {
      await db.collection("servers").deleteMany({
        _id: { $in: Object.values(ids) },
      });
      await db.collection("serverLeases").deleteMany({
        _id: { $in: Object.values(ids) },
      });
      await db.collection("subscriptions").deleteOne({ _id: subscription });
      await agentCommandModel.deleteMany({ tenant });
      await owner.cleanup();
    }
  },
});
