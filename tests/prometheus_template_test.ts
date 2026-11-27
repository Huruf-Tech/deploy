import { assert, assertEquals } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import handler from "@/serve.base.ts";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import { renderContent } from "@/lib/build/render.ts";
import { seedTemplates } from "@/scripts/seedTemplates.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { joinAsPartition } from "./_partition.ts";

// One-click Prometheus (PLAN §9.1): its scrape config is a `file` template
// input, created as a file variable and mounted where Prometheus reads it.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.test("templates: a file input renders as its mount path", () => {
  const { files } = renderContent(
    "service",
    {
      inputs: [{
        key: "appConfig",
        label: "Config",
        type: "file",
        required: true,
        default: "a: 1",
      }],
      compose:
        "services:\n  x:\n    image: x\n    command: [{{inputs.appConfig}}]\n",
    },
    {},
    { cacheKey: "test" },
  );
  assert(files["compose.yaml"].includes("[/run/secrets/APP_CONFIG]"));
});

Deno.test({
  name: "templates: one-click Prometheus with its config as a file variable",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    await seedTemplates();
    const session = await testSession("prometheus");
    const { call, tenant, tenantId, user } = session;
    const db = mongodb.db();
    const agent = new SimAgent(await createState("prometheus-a"), {
      baseUrl: "http://localhost",
      tenant,
      send: (req) => Promise.resolve(handler(req)),
    });
    const poll = async () => {
      await sleep(110);
      return await agent.poll();
    };
    let server = "";

    try {
      await t.step("created, deployed, configured from the file", async () => {
        server = (await joinAsPartition(agent, tenantId, user)).json.server;
        await poll();
        const { json: templates } = await call("GET", "/templates/api");
        const prometheus = templates.find((x: { slug: string }) =>
          x.slug === "prometheus"
        )._id;
        const config = "global:\n  scrape_interval: 30s\n";
        const created = await call("POST", "/projects/api", {
          name: "Prometheus",
          slug: "prometheus",
          source: { type: "template" },
          template: { template: prometheus },
          inputs: { prometheusYml: config, retention: "30d" },
          servers: [server],
        });
        assertEquals(created.status, 200, JSON.stringify(created.json));
        const project = created.json._id;

        const { json: vars } = await call(
          "GET",
          `/variables/api?scope=project&project=${project}`,
        );
        assertEquals(
          vars.map((v: { key: string; kind: string }) => [v.key, v.kind]),
          [["PROMETHEUS_YML", "file"]],
        );

        await call("POST", `/projects/api/${project}/deploy`, {});
        for (let i = 0; i < 3; i++) await poll();
        const workload = agent.spec!.workloads.find((w) =>
          w.name === "prometheus"
        )!;
        const [release] = workload.releases;
        assertEquals(release.image, "prom/prometheus:v3.5.0");
        assertEquals(release.command, [
          "--config.file=/run/secrets/PROMETHEUS_YML",
          "--storage.tsdb.path=/prometheus",
          "--storage.tsdb.retention.time=30d",
        ]);
        assertEquals(release.files.PROMETHEUS_YML, config);
        assertEquals(release.port, 9090);
        assertEquals(workload.strategy, "stopFirst", "a local volume");
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
        ].map((name) => db.collection(name).deleteMany({ tenant: tenantId })),
        db.collection("serverSpecs").deleteMany({ _id: { $in: serverIds } }),
        db.collection("agentEvents").deleteMany({ server: { $in: serverIds } }),
      ]);
      await session.cleanup();
    }
  },
});
