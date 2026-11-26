import { assertEquals } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

// Folders on the Servers page, as projects have (PLAN §5).

Deno.test({
  name: "servers: folders keep servers together",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const a = await testSession("folders-a");
    const b = await testSession("folders-b");
    const ids = [new ObjectId(), new ObjectId()];
    await mongodb.db().collection("servers").insertMany(ids.map((_id) => ({
      _id,
      tenant: a.tenantId,
      name: String(_id),
      labels: {},
      status: "active",
      identity: { fingerprint: `folder-${_id}` },
    })));
    const groupOf = async (id: ObjectId) =>
      (await serverModel.findOne({ _id: id }))?.group?.toString();

    try {
      let folder = "";
      await t.step("a folder, servers moved in, listed by it", async () => {
        const res = await a.call("POST", "/serverGroups/api", {
          name: "Production",
        });
        assertEquals(res.status, 200, JSON.stringify(res.json));
        folder = res.json._id;
        const moved = await a.call("POST", "/servers/api/moveToFolder", {
          servers: [String(ids[0])],
          group: folder,
        });
        assertEquals(moved.json.moved, 1, JSON.stringify(moved.json));
        assertEquals(await groupOf(ids[0]), folder);
        assertEquals(await groupOf(ids[1]), undefined);
      });

      await t.step("another workspace's folder is refused", async () => {
        const other = await b.call("POST", "/serverGroups/api", {
          name: "Theirs",
        });
        const res = await a.call("POST", "/servers/api/moveToFolder", {
          servers: [String(ids[1])],
          group: other.json._id,
        });
        assertEquals(res.status, 404);
        assertEquals(await groupOf(ids[1]), undefined);
        // Nor can they move this workspace's servers.
        await b.call("POST", "/servers/api/moveToFolder", {
          servers: [String(ids[1])],
          group: other.json._id,
        });
        assertEquals(await groupOf(ids[1]), undefined);
      });

      await t.step(
        "out of the folder, and deleting it keeps its servers",
        async () => {
          await a.call("POST", "/servers/api/moveToFolder", {
            servers: ids.map(String),
            group: folder,
          });
          await a.call("POST", "/servers/api/moveToFolder", {
            servers: [String(ids[1])],
            group: null,
          });
          assertEquals(await groupOf(ids[1]), undefined);
          const del = await a.call("DELETE", `/serverGroups/api/${folder}`);
          assertEquals(del.status, 200, JSON.stringify(del.json));
          assertEquals(await groupOf(ids[0]), undefined);
          assertEquals(
            await serverModel.countDocuments({ _id: { $in: ids } }),
            2,
          );
        },
      );
    } finally {
      const db = mongodb.db();
      await db.collection("servers").deleteMany({ _id: { $in: ids } });
      await db.collection("serverGroups").deleteMany({
        tenant: { $in: [a.tenantId, b.tenantId] },
      });
      await a.cleanup();
      await b.cleanup();
    }
  },
});
