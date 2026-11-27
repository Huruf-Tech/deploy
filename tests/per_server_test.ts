import { assert, assertEquals, assertMatch } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import handler from "@/serve.base.ts";
import { ObjectId } from "mongodb";
import { encodeBase64 } from "@std/encoding/base64";
import { Env } from "@/core/utils/env.ts";
import { mongodb } from "@/database.ts";
import { resolver } from "@/lib/domains/dns.ts";
import { dnsLabelOf } from "@/lib/agents/serverNames.ts";
import { domainModel } from "@/schemas/applications/domain.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { joinAsPartition } from "./_partition.ts";

// One server's copy of a project (PLAN §8.3, §14): a domain served from it
// alone, a login in front of a domain, and `<project>.<server>.srv.internal`.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.test("servers: a name suggests its DNS label", () => {
  assertEquals(dnsLabelOf("Web Server #2"), "web-server-2");
  assertEquals(dnsLabelOf("  Ünïcode—box "), "unicode-box");
  assertEquals(dnsLabelOf("!!!"), "server");
  assert(dnsLabelOf("x".repeat(80)).length <= 36);
});

Deno.test({
  name: "per server: pinned domains, logins and .srv.internal names",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const config = Env.getAll<Record<string, string>>();
    config.INGRESS_HOSTNAME = "ingress.platform.test";
    const real = { ...resolver };
    resolver.txt = () => Promise.resolve([]);
    resolver.a = () => Promise.resolve([]);

    const session = await testSession("per-server");
    const { call, tenant, tenantId, user } = session;
    const db = mongodb.db();
    const agent = new SimAgent(await createState("per-server-a"), {
      baseUrl: "http://localhost",
      tenant,
      send: (req) => Promise.resolve(handler(req)),
    });
    const poll = async () => {
      await sleep(110);
      return await agent.poll();
    };
    let server = "";
    let project = "";
    let domain = "";

    try {
      await t.step("a project's replicas get their server's name", async () => {
        server = (await joinAsPartition(agent, tenantId, user)).json.server;
        await poll();
        const created = await call("POST", "/projects/api", {
          name: "Prometheus",
          slug: "prometheus",
          source: { type: "image", image: "prom/prometheus:v3.0.0" },
          runtime: { port: 9090, memReserveMb: 64 },
          servers: [server],
        });
        assertEquals(created.status, 200, JSON.stringify(created.json));
        project = created.json._id;
        await call("POST", `/projects/api/${project}/deploy`, {});
        for (let i = 0; i < 4; i++) await poll();
        const doc = await db.collection("servers").findOne({
          _id: new ObjectId(server),
        });
        assert(doc?.dnsName, "named when its spec was made");
        const workload = agent.spec!.workloads.find((w) =>
          w.name === "prometheus"
        )!;
        assertEquals(workload.dnsNames, [
          "prometheus.internal",
          `prometheus.${doc.dnsName}.srv.internal`,
        ]);
        const { json } = await call("GET", `/projects/api/${project}`);
        assertEquals(json.servers[0].dnsName, doc.dnsName);
      });

      await t.step(
        "the name can be changed, never to a taken one",
        async () => {
          await db.collection("servers").insertOne({
            tenant: tenantId,
            name: "other",
            status: "pending",
            dnsName: "taken",
            identity: { fingerprint: `per-server-${new ObjectId()}` },
          });
          const put = (dnsName: string) =>
            call("PUT", `/servers/api/${server}/dnsName`, { dnsName });
          assertEquals((await put("Not A Label")).status, 400);
          assertEquals((await put("taken")).status, 400);
          assertEquals((await put("alpha")).status, 200);
          await poll();
          const workload = agent.spec!.workloads.find((w) =>
            w.name === "prometheus"
          )!;
          assertEquals(workload.dnsNames[1], "prometheus.alpha.srv.internal");
        },
      );

      await t.step("a domain served from one server", async () => {
        const hostname = `prom-${Date.now()}.example.test`;
        const elsewhere = await call("POST", "/domains/api", {
          project,
          hostname,
          server: new ObjectId().toHexString(),
        });
        assertEquals(elsewhere.status, 400, "a server it doesn't run on");
        const created = await call("POST", "/domains/api", {
          project,
          hostname,
          server,
        });
        assertEquals(created.status, 200, JSON.stringify(created.json));
        domain = created.json._id;
        const view = async () =>
          (await call("GET", `/domains/api/${domain}`)).json;
        assertEquals((await view()).server, server);
        const all = await call("PATCH", `/domains/api/${domain}`, {
          server: null,
        });
        assertEquals(all.status, 200);
        assertEquals((await view()).server, undefined);
      });

      await t.step("a login: a generated password, kept as SHA-1", async () => {
        const login = (username: string) =>
          call("PUT", `/domains/api/${domain}/login`, { username });
        assertEquals((await login("bad:name")).status, 400);
        const res = await login("grafana");
        assertEquals(res.status, 200);
        const { password } = res.json;
        assertMatch(password, /^[A-Za-z0-9_-]{32}$/);
        const doc = await domainModel.findOne({ _id: new ObjectId(domain) });
        assertEquals(
          doc?.basicAuth?.sha1,
          encodeBase64(
            await crypto.subtle.digest(
              "SHA-1",
              new TextEncoder().encode(password),
            ),
          ),
        );
        const { json } = await call("GET", `/domains/api/${domain}`);
        assertEquals(json.basicAuth, { username: "grafana" });
        assert(!JSON.stringify(json).includes(doc!.basicAuth!.sha1));
        // A new password replaces the old.
        assert((await login("grafana")).json.password !== password);

        assertEquals(
          (await call("DELETE", `/domains/api/${domain}/login`)).status,
          200,
        );
        assertEquals(
          (await call("GET", `/domains/api/${domain}`)).json.basicAuth,
          undefined,
        );
      });
    } finally {
      Object.assign(resolver, real);
      const serverIds = server ? [new ObjectId(server)] : [];
      await Promise.all([
        ...[
          "projects",
          "releases",
          "deployments",
          "domains",
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
