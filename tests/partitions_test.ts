import { assert, assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { createJoinToken } from "@/lib/agents/bootstrap.ts";
import { openSealed } from "@/lib/agents/sealing.ts";
import { registerAgent } from "@/lib/agents/servers.ts";
import { ingestEvents } from "@/lib/agents/poll.ts";
import { recordPoolSetup } from "@/lib/pool/pool.ts";
import { computeSpec } from "@/lib/deploy/specs.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";
import { MESH_PORT } from "@/schemas/infrastructure/network.ts";
import { projectModel } from "@/schemas/applications/project.ts";
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
        // Shown at once, before the machine reports it.
        const creating = await call(
          "GET",
          `/servers/api/${machine}/partitions`,
        );
        assertEquals(
          creating.json.map((p: Record<string, unknown>) => [
            p.name,
            p.creating,
            p.joining,
            p.label,
          ]),
          [[firstName, true, true, "apps"]],
        );
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

      await t.step(
        "deleting a partition removes it from its machine, with its projects",
        async () => {
          const joinAs = async (name: string) =>
            new ObjectId(
              (await join(
                name,
                (await createJoinToken({
                  tenant,
                  createdBy: user,
                  host: `box/${name}`,
                  port: 0,
                  username: "partition",
                  partition: { host: machine, name },
                })).token,
              )).server,
            );
          const second = (await serverModel.findOne({
            "provider.partition": "p00000000002",
          }))!._id;
          const third = await joinAs("p00000000003");
          const project = async (slug: string, servers: ObjectId[]) => {
            const res = await call("POST", "/projects/api", {
              name: slug,
              slug,
              source: { type: "image", image: "nginx:1.27" },
              servers: servers.map(String),
            });
            assertEquals(res.status, 200, JSON.stringify(res.json));
            return new ObjectId(res.json._id);
          };
          const solo = await project("solo", [second]);
          const both = await project("both", [second, third]);

          const res = await call("DELETE", `/servers/api/${second}`);
          assertEquals(res.status, 200, JSON.stringify(res.json));
          assertEquals(
            (await last(machine, "partition.remove")).payload,
            { name: "p00000000002" },
          );
          assertEquals(await projectModel.countDocuments({ _id: solo }), 0);
          assertEquals(
            (await projectModel.findOne({ _id: both }))!.servers.map(String),
            [String(third)],
          );

          // While the machine can't remove partitions, the delete is refused.
          await serverModel.updateOne({ _id: machine }, {
            $set: { "pool.status": "pending" },
          });
          const refused = await call("DELETE", `/servers/api/${third}`);
          assertEquals(refused.status, 400, JSON.stringify(refused.json));
          assertEquals(await serverModel.countDocuments({ _id: third }), 1);
          await serverModel.updateOne({ _id: machine }, {
            $set: { "pool.status": "ready" },
          });

          // A partition the machine reports, whose server is gone: still removable.
          await serverModel.updateOne({ _id: machine }, {
            $set: {
              "resources.partitions": [{
                name: "p00000000009",
                remainder: false,
                state: "running",
                size: { cpus: 1, memMb: 1024, diskGb: 10 },
                cpuMicros: 0,
                memUsed: 0,
                diskUsed: 0,
                rxBytes: 0,
                txBytes: 0,
              }],
            },
          });
          // Joining while its join token waits; otherwise its server is gone.
          await createJoinToken({
            tenant,
            createdBy: user,
            host: "box/p00000000010",
            port: 0,
            username: "partition",
            partition: { host: machine, name: "p00000000010" },
          });
          await serverModel.updateOne({ _id: machine }, {
            $push: {
              "resources.partitions": {
                name: "p00000000010",
                remainder: false,
                state: "running",
                size: { cpus: 1, memMb: 1024, diskGb: 10 },
                cpuMicros: 0,
                memUsed: 0,
                diskUsed: 0,
                rxBytes: 0,
                txBytes: 0,
              },
            },
          });
          const listed = await call(
            "GET",
            `/servers/api/${machine}/partitions`,
          );
          assertEquals(listed.status, 200, JSON.stringify(listed.json));
          assertEquals(
            listed.json.map((p: { name: string; joining: boolean }) => [
              p.name,
              p.joining,
            ]),
            [["p00000000009", false], ["p00000000010", true]],
          );
          await serverModel.updateOne({ _id: machine }, {
            $pull: { "resources.partitions": { name: "p00000000010" } },
          });
          const orphan = await call(
            "DELETE",
            `/servers/api/${machine}/partitions/p00000000009`,
          );
          assertEquals(orphan.status, 200, JSON.stringify(orphan.json));
          assert(orphan.json.command);
          // The machine's answer drops it from the list at once, not at its next report.
          const removal = await agentCommandModel.findOne({
            _id: new ObjectId(orphan.json.command),
          });
          await ingestEvents(
            { server: machine, tenant, key: undefined as unknown as CryptoKey },
            [{
              id: `cmd-${removal!.seq}`,
              type: "command.result",
              data: {
                seq: removal!.seq,
                ok: true,
                result: { name: "p00000000009", removed: true },
              },
            }],
          );
          assertEquals(
            (await serverModel.findOne({ _id: machine }))!.resources
              ?.partitions,
            [],
          );
          const unknown = await call(
            "DELETE",
            `/servers/api/${machine}/partitions/p00000000008`,
          );
          assertEquals(unknown.status, 404);
        },
      );

      await t.step("a failed creation shows why and is dismissed", async () => {
        const res = await call("POST", `/servers/api/${machine}/partitions`, {
          name: "broken",
          size: { cpus: 1, memMb: 1024, diskGb: 10 },
        });
        assertEquals(res.status, 200, JSON.stringify(res.json));
        const create = await last(machine, "partition.create");
        await agentCommandModel.updateOne({ _id: create._id }, {
          $set: { status: "failed", error: "installing the agent: timed out" },
        });
        const failed = (await call("GET", `/servers/api/${machine}/partitions`))
          .json.find((p: { name: string }) => p.name === res.json.name);
        assertEquals(
          [failed.creating, failed.joining, failed.error],
          [true, false, "installing the agent: timed out"],
        );
        const dismissed = await call(
          "DELETE",
          `/servers/api/${machine}/partitions/${res.json.name}`,
        );
        assertEquals(dismissed.status, 200, JSON.stringify(dismissed.json));
        assert(
          !(await call("GET", `/servers/api/${machine}/partitions`)).json.some(
            (p: { name: string }) => p.name === res.json.name,
          ),
        );
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
