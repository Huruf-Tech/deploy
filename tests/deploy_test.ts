import { assert, assertEquals, assertMatch } from "@std/assert";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { acceptServer } from "@/lib/agents/servers.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { testSession } from "./_session.ts";

// End-to-end over the real handler with two simulated servers (PLAN §16 Phase 6).

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.test({
  name:
    "deploy: build per server, rollouts, auto-revert, rollback, one-click services",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const session = await testSession("deploy");
    const { call, tenant, tenantId, user } = session;
    const agents: SimAgent[] = [];
    const servers: string[] = [];
    let project = "";
    let db = "";

    // Agents never poll faster than the minimum interval.
    const poll = async (agent: SimAgent) => {
      await sleep(110);
      return await agent.poll();
    };
    const pollAll = async (rounds = 1) => {
      for (let i = 0; i < rounds; i++) for (const a of agents) await poll(a);
    };
    const deployment = async (id: string) =>
      (await call("GET", `/projects/api/deployments/${id}`)).json;

    try {
      await t.step("two servers join", async () => {
        for (const name of ["deploy-a", "deploy-b"]) {
          const agent = new SimAgent(await createState(name), {
            baseUrl: "http://localhost",
            tenant,
            send: (req) => Promise.resolve(handler(req)),
          });
          const { json } = await agent.hello();
          await acceptServer({
            server: new ObjectId(json.server),
            tenant: tenantId,
            user: { _id: user, emailVerified: true },
            pairingCode: json.pairingCode!,
          });
          await poll(agent); // docker.ensure
          agents.push(agent);
          servers.push(json.server);
        }
      });

      await t.step(
        "create from the Thunder template; reservations must fit",
        async () => {
          const { json: templates } = await call("GET", "/templates/api");
          const thunder = templates.find((x: { slug: string }) =>
            x.slug === "thunder"
          )._id;
          const body = {
            name: "Shop",
            slug: "shop",
            source: {
              type: "git",
              url: "https://git.example.com/acme/shop.git",
              branch: "main",
            },
            template: { template: thunder },
            servers,
            replicasPerServer: 2,
            publicPort: 8080,
            deployStrategy: "rolling",
          };

          const tooBig = await call("POST", "/projects/api", {
            ...body,
            slug: "huge",
            runtime: { cpuReserve: 3 },
          });
          assertEquals(tooBig.status, 400);
          assertMatch(String(tooBig.json), /free to allocate/);

          const created = await call("POST", "/projects/api", body);
          assertEquals(created.status, 200, JSON.stringify(created.json));
          project = created.json._id;

          // Variables: runtime ones become env, build ones go to the build only.
          await call("POST", "/variables/api", {
            scope: "tenant",
            key: "DATABASE_URL",
            value: "mongodb://db",
          });
          await call("POST", "/variables/api", {
            scope: "project",
            project,
            key: "BUILD_TOKEN",
            value: "build-only",
            stage: "build",
          });
        },
      );

      let first = "";
      await t.step(
        "rolling: builds on both servers, then one server at a time",
        async () => {
          const { json } = await call(
            "POST",
            `/projects/api/${project}/deploy`,
            {},
          );
          first = json.deployment;

          await pollAll(); // both get build.run, report success; server A starts
          for (const agent of agents) {
            const build = agent.builds.at(-1)!;
            assertEquals(
              build.repo.url,
              "https://git.example.com/acme/shop.git",
            );
            assertEquals(build.buildEnv, { BUILD_TOKEN: "build-only" });
            assertMatch(build.dockerfile!, /--port=8000/);
            assertMatch(build.image, /^huruf\/shop:1$/);
          }

          let d = await deployment(first);
          assertEquals(d.status, "deploying");
          assertEquals(d.servers.map((s: { rollout: string }) => s.rollout), [
            "applying",
            "pending",
          ]);

          await poll(agents[0]); // A gets its spec and reports healthy → B starts
          const spec = agents[0].spec!;
          const [workload] = spec.workloads;
          assertEquals(workload.name, "shop");
          assertEquals(workload.publicPort, 8080);
          assertEquals(workload.releases.length, 1);
          const release = workload.releases[0];
          assertEquals([release.release, release.routed, release.replicas], [
            1,
            true,
            2,
          ]);
          assertEquals(release.env.DATABASE_URL, "mongodb://db");
          assertEquals(release.env.PORT, "8000");
          assertEquals(release.env.BUILD_TOKEN, undefined);

          d = await deployment(first);
          assertEquals(d.servers.map((s: { rollout: string }) => s.rollout), [
            "healthy",
            "applying",
          ]);
          await poll(agents[1]);
          d = await deployment(first);
          assertEquals(d.status, "healthy");
          assertEquals(d.commit.sha.length, 40);

          const { json: p } = await call("GET", `/projects/api/${project}`);
          assertEquals(p.status, "running");
          assertEquals(p.release.number, 1);
          assertEquals(p.placedOn, servers);
          assertEquals(p.containers.length, 4);
        },
      );

      await t.step(
        "all at once: every server prepares unrouted, then all switch",
        async () => {
          await call("PATCH", `/projects/api/${project}`, {
            deployStrategy: "allAtOnce",
          });
          const { json } = await call(
            "POST",
            `/projects/api/${project}/deploy`,
            {},
          );

          await pollAll(); // builds
          await pollAll(); // prepare specs: old routed + new unrouted
          for (const agent of agents) {
            const releases = agent.spec!.workloads[0].releases;
            // Either still preparing, or already switched once the last server reported.
            assert(
              releases.length === 2 ||
                (releases.length === 1 && releases[0].release === 2),
              JSON.stringify(releases),
            );
          }
          await pollAll(); // switch specs
          for (const agent of agents) {
            assertEquals(
              agent.spec!.workloads[0].releases.map((
                r,
              ) => [r.release, r.routed]),
              [[2, true]],
            );
          }
          assertEquals((await deployment(json.deployment)).status, "healthy");
        },
      );

      await t.step(
        "a release that fails on a server is reverted everywhere",
        async () => {
          await call("PATCH", `/projects/api/${project}`, {
            deployStrategy: "rolling",
          });
          agents[1].outcome = (_, release) =>
            release === 3 ? "failed" : "healthy";
          const { json } = await call(
            "POST",
            `/projects/api/${project}/deploy`,
            {},
          );

          await pollAll(); // builds
          await poll(agents[0]); // A switches to 3
          assertEquals(agents[0].spec!.workloads[0].releases[0].release, 3);
          await poll(agents[1]); // B fails 3
          const d = await deployment(json.deployment);
          assertEquals(d.status, "failed");
          assertMatch(d.errorSummary, /simulated health check failure/);

          await poll(agents[0]); // A gets release 2 back
          assertEquals(
            agents[0].spec!.workloads[0].releases.map((r) => r.release),
            [2],
          );
          const { json: p } = await call("GET", `/projects/api/${project}`);
          assertEquals(p.release.number, 2);
          agents[1].outcome = () => "healthy";
        },
      );

      await t.step(
        "rollback runs a kept release without building",
        async () => {
          const { json: releases } = await call(
            "GET",
            `/projects/api/${project}/releases`,
          );
          assertEquals(releases.map((r: { number: number }) => r.number), [
            2,
            1,
          ]);
          const builds = agents[0].builds.length;

          const { json } = await call(
            "POST",
            `/projects/api/${project}/rollback`,
            {
              release: releases[1]._id,
            },
          );
          await pollAll(2);
          assertEquals(agents[0].builds.length, builds, "rollback rebuilt");
          assertEquals((await deployment(json.deployment)).status, "healthy");
          const { json: p } = await call("GET", `/projects/api/${project}`);
          assertEquals(p.release.number, 1);
        },
      );

      await t.step(
        "clear build cache: a new cache id and no layer cache next time",
        async () => {
          await call("POST", `/projects/api/${project}/clearCache`, {});
          await call("POST", `/projects/api/${project}/deploy`, {});
          await pollAll();
          const build = agents[0].builds.at(-1)!;
          assertEquals(build.noCache, true);
          assertMatch(build.dockerfile!, /FROM denoland\/deno/);
          await pollAll(2);
        },
      );

      await t.step(
        "one-click Postgres: no build, generated secret, volume, stop-first",
        async () => {
          const { json: templates } = await call("GET", "/templates/api");
          const postgres = templates.find((x: { slug: string }) =>
            x.slug === "postgres"
          )._id;
          const created = await call("POST", "/projects/api", {
            name: "Database",
            slug: "db",
            source: { type: "template" },
            template: { template: postgres },
            servers: [servers[0]],
          });
          assertEquals(created.status, 200, JSON.stringify(created.json));
          db = created.json._id;

          const { json: vars } = await call(
            "GET",
            `/variables/api?scope=project&project=${db}`,
          );
          assertEquals(
            vars.map((
              v: { key: string; isSecret: boolean },
            ) => [v.key, v.isSecret]),
            [["PASSWORD", true]],
          );

          const builds = agents[0].builds.length;
          const { json } = await call("POST", `/projects/api/${db}/deploy`, {});
          await poll(agents[0]);
          assertEquals(agents[0].builds.length, builds);
          const workload = agents[0].spec!.workloads.find((w) =>
            w.name === "db"
          )!;
          assertEquals(workload.strategy, "stopFirst");
          assertEquals(workload.dnsNames, ["db.internal"]);
          const [release] = workload.releases;
          assertEquals(release.image, "postgres:17-alpine");
          assertMatch(release.env.POSTGRES_PASSWORD, /^[\w-]{32}$/);
          assertEquals(release.volumes, [{
            name: `huruf-${db}-data`,
            mountPath: "/var/lib/postgresql/data",
          }]);
          assertMatch(release.healthcheck.command!, /^pg_isready/);
          assertEquals((await deployment(json.deployment)).status, "healthy");
        },
      );

      await t.step(
        "deleting a project removes it from the servers",
        async () => {
          assertEquals(
            (await call("DELETE", `/projects/api/${db}`)).status,
            200,
          );
          await poll(agents[0]);
          assertEquals(agents[0].spec!.workloads.map((w) => w.name), ["shop"]);
        },
      );
    } finally {
      const d = mongodb.db();
      const serverIds = servers.map((s) => new ObjectId(s));
      await Promise.all([
        d.collection("projects").deleteMany({ tenant: tenantId }),
        d.collection("releases").deleteMany({ tenant: tenantId }),
        d.collection("deployments").deleteMany({ tenant: tenantId }),
        d.collection("variables").deleteMany({ tenant: tenantId }),
        d.collection("servers").deleteMany({ tenant: tenantId }),
        d.collection("serverLeases").deleteMany({ tenant: tenantId }),
        d.collection("serverSpecs").deleteMany({ _id: { $in: serverIds } }),
        d.collection("agentCommands").deleteMany({ tenant: tenantId }),
        d.collection("agentEvents").deleteMany({ server: { $in: serverIds } }),
        d.collection("rateCounters").deleteMany({
          _id: new RegExp(`^deploys:${tenant}`),
        }),
      ]);
      await session.cleanup();
    }
  },
});
