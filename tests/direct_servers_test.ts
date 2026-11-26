import { assert, assertEquals, assertRejects } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { createJoinToken } from "@/lib/agents/bootstrap.ts";
import { releaseServer } from "@/lib/agents/servers.ts";
import { placement } from "@/lib/deploy/projects.ts";
import { rebootServer, setUpMachine } from "@/lib/pool/pool.ts";
import type z from "zod";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import type { $commandType } from "@/schemas/protocol/agent.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";

// Direct servers (PLAN §27.6): a machine chosen at install to run projects
// itself, without Sysbox. It takes a plan slot and never hosts partitions.

Deno.test({
  name: "servers: a direct machine runs projects and never hosts partitions",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const { call, tenant, tenantId, user, cleanup } = await testSession(
      "direct",
    );
    const slots = async () =>
      (await tenantUsageModel.findOne({ tenant: tenantId }))?.servers ?? 0;
    const commands = async (
      server: ObjectId,
      type: z.output<typeof $commandType>,
    ) => await agentCommandModel.countDocuments({ server, type });
    let server = new ObjectId();

    try {
      await t.step("joins as direct, with host setup and a slot", async () => {
        const before = await slots();
        const agent = new SimAgent(await createState("direct-a"), {
          baseUrl: "http://localhost",
          tenant,
          send: (req) => Promise.resolve(handler(req)),
        });
        const { token } = await createJoinToken({
          tenant: tenantId,
          createdBy: user,
          host: "203.0.113.20",
          port: 22,
          username: "root",
          direct: true,
        });
        agent.joinWith(token);
        const { json } = await agent.hello();
        server = new ObjectId(json.server);
        const doc = await serverModel.findOne({ _id: server });
        assertEquals(doc?.provider.kind, "direct");
        assertEquals(doc?.status, "active");
        assertEquals(await slots(), before + 1);
        // Regular host setup, never the partition setup.
        assertEquals(await commands(server, "docker.ensure"), 1);
        assertEquals(await commands(server, "pool.ensure"), 0);
      });

      await t.step("partition setup is refused on it", async () => {
        await assertRejects(() => setUpMachine(server));
        const res = await call("POST", `/servers/api/${server}/partitions`, {
          size: { cpus: 1, memMb: 1024, diskGb: 10 },
        });
        assert(res.status >= 400, JSON.stringify(res.json));
        assertEquals(await commands(server, "partition.create"), 0);
      });

      await t.step("projects can be placed on it", async () => {
        const servers = await placement(tenantId);
        assert(
          servers.some((s) => String(s.server) === String(server)),
          JSON.stringify(servers),
        );
      });

      await t.step("reboot reboots the machine itself", async () => {
        await rebootServer(tenantId, server, user);
        assertEquals(await commands(server, "host.reboot"), 1);
      });

      await t.step("removing it gives the slot back", async () => {
        const before = await slots();
        await releaseServer(server, tenantId);
        assertEquals(await slots(), before - 1);
      });
    } finally {
      const db = mongodb.db();
      await Promise.all([
        db.collection("servers").deleteMany({ tenant: tenantId }),
        db.collection("serverLeases").deleteMany({ tenant: tenantId }),
        db.collection("agentCommands").deleteMany({ tenant: tenantId }),
        db.collection("bootstrapSessions").deleteMany({ tenant: tenantId }),
        tenantUsageModel.deleteOne({ tenant: tenantId }),
      ]);
      await cleanup();
    }
  },
});
