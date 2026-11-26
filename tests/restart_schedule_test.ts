import { assert, assertEquals, assertFalse } from "@std/assert";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { isCron, isTimeZone } from "@/schemas/applications/schedule.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { joinAsPartition } from "./_partition.ts";
import { testSession } from "./_session.ts";

// Scheduled restarts (PLAN §10.1): the project's schedule reaches the agents
// of its servers as a timer job, and each run's result comes back to it.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.test("schedules: cron expressions and time zones", () => {
  for (
    const ok of [
      "0 3 * * *",
      "*/15 * * * *",
      "0 9-17/4 * * 1-5",
      "@daily",
      "30 2 1,15 * 7",
    ]
  ) {
    assert(isCron(ok), ok);
  }
  for (
    const bad of [
      "",
      "0 3 * *",
      "60 * * * *",
      "* 24 * * *",
      "* * 0 * *",
      "*/0 * * * *",
      "5-1 * * * *",
      "* * * * 8",
      "@reboot",
    ]
  ) {
    assertFalse(isCron(bad), bad);
  }
  assert(isTimeZone("Asia/Karachi"));
  assert(isTimeZone("UTC"));
  assertFalse(isTimeZone("Mars/Olympus"));
});

Deno.test({
  name: "schedules: a project's nightly restart reaches its servers",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const session = await testSession("restarts");
    const { call, tenant, tenantId, user } = session;
    const d = mongodb.db();
    const agent = new SimAgent(await createState("restarts-a"), {
      baseUrl: "http://localhost",
      tenant,
      send: (req) => Promise.resolve(handler(req)),
    });
    const poll = async () => {
      await sleep(110);
      return await agent.poll();
    };
    let server = "";
    let web = "";

    try {
      await t.step("a deployed project has no schedule", async () => {
        server = (await joinAsPartition(agent, tenantId, user)).json.server;
        await poll();
        const created = await call("POST", "/projects/api", {
          name: "web",
          slug: "web",
          source: { type: "image", image: "nginx:1.27" },
          runtime: { port: 80, memReserveMb: 64 },
          servers: [server],
        });
        assertEquals(created.status, 200, JSON.stringify(created.json));
        web = created.json._id;
        await call("POST", `/projects/api/${web}/deploy`, {});
        for (let i = 0; i < 4; i++) await poll();
        assert(agent.spec!.workloads.some((w) => w.name === "web"));
        assertEquals(agent.spec!.schedules, undefined);
      });

      await t.step("bad schedules are refused", async () => {
        const patch = (restartSchedule: unknown) =>
          call("PATCH", `/projects/api/${web}`, { restartSchedule });
        assertEquals(
          (await patch({ cron: "0 3 * *", timezone: "UTC" })).status,
          400,
        );
        assertEquals(
          (await patch({ cron: "0 3 * * *", timezone: "Nowhere/City" })).status,
          400,
        );
        assertEquals(
          (await patch({
            cron: "0 3 * * *",
            timezone: "UTC",
            servers: [new ObjectId().toHexString()],
          })).status,
          400,
          "a server the project isn't on",
        );
      });

      await t.step("every night at 03:00 in Karachi", async () => {
        const saved = await call("PATCH", `/projects/api/${web}`, {
          restartSchedule: {
            cron: "0 3 * * *",
            timezone: "Asia/Karachi",
            servers: [server],
          },
        });
        assertEquals(saved.status, 200, JSON.stringify(saved.json));
        await poll();
        assertEquals(agent.spec!.schedules, [{
          id: `restart:${web}:web`,
          cron: "0 3 * * *",
          timezone: "Asia/Karachi",
          restart: { workload: "web" },
        }]);
      });

      await t.step("the agent's result shows on the project", async () => {
        const startedAt = Date.now();
        await agent.sendEvents([{
          id: `sr-1-${startedAt}`,
          type: "schedule.ran",
          data: { job: `restart:${web}:web`, startedAt, status: "ok" },
        }, {
          // Another tenant's project: never touched.
          id: `sr-2-${startedAt}`,
          type: "schedule.ran",
          data: {
            job: `restart:${new ObjectId()}:web`,
            startedAt,
            status: "failed",
          },
        }]);
        const { json: project } = await call("GET", `/projects/api/${web}`);
        assertEquals(project.restartSchedule.timezone, "Asia/Karachi");
        assertEquals(project.restarts.length, 1);
        assertEquals(project.restarts[0].status, "ok");
        assertEquals(project.restarts[0].server, server);
      });

      await t.step("turning it off removes the job", async () => {
        const off = await call("PATCH", `/projects/api/${web}`, {
          restartSchedule: null,
        });
        assertEquals(off.status, 200);
        await poll();
        assertEquals(agent.spec!.schedules, undefined);
        const { json: project } = await call("GET", `/projects/api/${web}`);
        assertEquals(project.restartSchedule, undefined);
        assertEquals(project.restarts, undefined);
      });
    } finally {
      const serverIds = server ? [new ObjectId(server)] : [];
      await Promise.all([
        ...[
          "projects",
          "releases",
          "deployments",
          "variables",
          "servers",
          "serverLeases",
          "agentCommands",
          "networks",
        ].map((name) => d.collection(name).deleteMany({ tenant: tenantId })),
        d.collection("serverSpecs").deleteMany({ _id: { $in: serverIds } }),
        d.collection("agentEvents").deleteMany({ server: { $in: serverIds } }),
      ]);
      await session.cleanup();
    }
  },
});
