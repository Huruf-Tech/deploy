import { assert, assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { createJoinToken } from "@/lib/agents/bootstrap.ts";
import { openSealed } from "@/lib/agents/sealing.ts";
import { registerAgent } from "@/lib/agents/servers.ts";
import { recordPoolSetup } from "@/lib/pool/pool.ts";
import { computeSpec } from "@/lib/deploy/specs.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";
import { MESH_PORT } from "@/schemas/infrastructure/network.ts";
import { seedKeys } from "./sealing_test.ts";
import { testSession } from "./_session.ts";

// Partitions on every server (PLAN §27, Phase 17): an agent on a machine is
// its host; the customer gives part of the machine to partitions, which are
// the servers projects run on.

Deno.test({
  name: "partitions: machines host them, customers size them, ports forward",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const session = await testSession("partitions");
    const { call, tenantId: tenant, user } = session;
    const { privateKey, publicKey } = await seedKeys();
    const inventory = (hostname: string) => ({
      hostname,
      os: "Ubuntu 24.04",
      arch: "amd64" as const,
      cpuCores: 8,
      memory: 16 * 2 ** 30,
      disk: 200 * 2 ** 30,
      agentVersion: "0.0.22",
      publicIp: "203.0.113.20",
    });
    const join = async (name: string, token?: string) =>
      await registerAgent(
        {
          tenant: String(tenant),
          signPublicKey: `sign-${name}`,
          boxPublicKey: publicKey,
          joinToken: token ??
            (await createJoinToken({
              tenant,
              createdBy: user,
              host: name,
              port: 22,
              username: "root",
            })).token,
          inventory: inventory(name),
        },
        `fp-${name}-${tenant}`,
        null,
      );
    const last = async (server: ObjectId, type: string) =>
      (await agentCommandModel.find({ server, type: type as never }, {
        sort: { seq: -1 },
        limit: 1,
      }).toArray())[0];
    const slots = async () =>
      (await tenantUsageModel.findOne({ tenant }))?.servers ?? 0;
    let machine: ObjectId;
    let first: ObjectId;
    let firstName = "";

    try {
      await t.step("an agent installed on a machine is its host", async () => {
        const hello = await join("box");
        machine = new ObjectId(hello.server);
        const doc = (await serverModel.findOne({ _id: machine }))!;
        assertEquals(doc.provider.kind, "machine");
        assertEquals(await slots(), 0, "a machine takes no plan slot");
        const setup = await last(machine, "pool.ensure");
        assertEquals((setup.payload as { mode: string }).mode, "machine");
        // Projects can't go there.
        const res = await call("POST", "/projects/api", {
          name: "web",
          slug: "web",
          source: { type: "image", image: "nginx:1.27" },
          servers: [String(machine)],
        });
        assertEquals(res.status, 400, JSON.stringify(res.json));
        assert(JSON.stringify(res.json).includes("is a machine"));
      });

      await t.step("the customer creates a partition of it", async () => {
        const early = await call(
          "POST",
          `/servers/api/${machine}/partitions`,
          { size: { cpus: 2, memMb: 4096, diskGb: 50 } },
        );
        assertEquals(early.status, 400, "not set up yet");
        await recordPoolSetup(machine, {
          ok: true,
          result: { allocatable: { cpus: 7.75, memMb: 15_872, diskGb: 190 } },
        });
        const tooBig = await call(
          "POST",
          `/servers/api/${machine}/partitions`,
          { size: { cpus: 2, memMb: 32_768, diskGb: 50 } },
        );
        assertEquals(tooBig.status, 400, JSON.stringify(tooBig.json));
        const res = await call("POST", `/servers/api/${machine}/partitions`, {
          name: "apps",
          size: { cpus: 2, memMb: 4096, diskGb: 50 },
        });
        assertEquals(res.status, 200, JSON.stringify(res.json));
        firstName = res.json.name;
        const create = await last(machine, "partition.create");
        const payload = JSON.parse(
          await openSealed(
            privateKey,
            publicKey,
            (create.payload as { sealed: string }).sealed,
          ),
        );
        assertEquals(payload.name, firstName);
        assertEquals(payload.size, { cpus: 2, memMb: 4096, diskGb: 50 });

        // Its agent joins with the token: a server, a slot, a forwarded port.
        const hello = await join(firstName, payload.install.joinToken);
        first = new ObjectId(hello.server);
        const doc = (await serverModel.findOne({ _id: first }))!;
        assertEquals(doc.name, "apps");
        assertEquals(
          [doc.provider.kind, doc.provider.partition, doc.provider.meshPort],
          ["partition", firstName, MESH_PORT + 1],
        );
        assert(doc.provider.host!.equals(machine));
        assertEquals(doc.mesh?.endpoint, `203.0.113.20:${MESH_PORT + 1}`);
        assertEquals(await slots(), 1);
        assertEquals(
          (await last(first, "docker.ensure"))?.type,
          "docker.ensure",
        );
        assertEquals((await computeSpec(machine)).forwards, [{
          protocol: "udp",
          port: MESH_PORT + 1,
          partition: firstName,
          to: MESH_PORT,
        }]);
      });

      await t.step("public ports forward; partitions share them", async () => {
        const second = new ObjectId(
          (await join(
            "second",
            (await createJoinToken({
              tenant,
              createdBy: user,
              host: "box/p2",
              port: 0,
              username: "partition",
              partition: { host: machine, name: "p00000000002" },
            })).token,
          )).server,
        );
        assertEquals(
          (await serverModel.findOne({ _id: second }))!.provider.meshPort,
          MESH_PORT + 2,
        );
        const web = await call("POST", "/projects/api", {
          name: "web",
          slug: "web",
          source: { type: "image", image: "nginx:1.27" },
          runtime: { port: 80 },
          publicPort: 8080,
          servers: [String(first)],
        });
        assertEquals(web.status, 200, JSON.stringify(web.json));
        const forwards = (await computeSpec(machine)).forwards;
        assert(
          forwards.some((f) =>
            f.protocol === "tcp" && f.port === 8080 && f.partition === firstName
          ),
          JSON.stringify(forwards),
        );
        const clash = await call("POST", "/projects/api", {
          name: "api",
          slug: "api",
          source: { type: "image", image: "nginx:1.27" },
          runtime: { port: 80 },
          publicPort: 8080,
          servers: [String(second)],
        });
        assertEquals(clash.status, 400, JSON.stringify(clash.json));
        await call("DELETE", `/projects/api/${web.json._id}`);
      });

      await t.step("resized live, then removed with its server", async () => {
        const resize = await call(
          "PATCH",
          `/servers/api/${machine}/partitions/${firstName}`,
          { size: { cpus: 3, memMb: 6144, diskGb: 60 } },
        );
        assertEquals(resize.status, 200, JSON.stringify(resize.json));
        assertEquals(
          (await last(machine, "partition.resize")).payload,
          { name: firstName, size: { cpus: 3, memMb: 6144, diskGb: 60 } },
        );
        const before = await slots();
        const removed = await call(
          "DELETE",
          `/servers/api/${machine}/partitions/${firstName}`,
        );
        assertEquals(removed.status, 200, JSON.stringify(removed.json));
        assertEquals(
          (await last(machine, "partition.remove")).payload,
          { name: firstName },
        );
        assertEquals(await serverModel.countDocuments({ _id: first }), 0);
        assertEquals(await slots(), before - 1);
      });

      await t.step("deleting the machine takes its partitions", async () => {
        const res = await call("DELETE", `/servers/api/${machine}`);
        assertEquals(res.status, 200, JSON.stringify(res.json));
        assertEquals(
          await serverModel.countDocuments({ "provider.host": machine }),
          0,
        );
        assertEquals(await slots(), 0);
      });
    } finally {
      const d = mongodb.db();
      await Promise.all(
        [
          "servers",
          "serverLeases",
          "agentCommands",
          "bootstrapSessions",
          "projects",
          "tenantUsage",
        ].map((c) => d.collection(c).deleteMany({ tenant })),
      );
      await session.cleanup();
    }
  },
});
