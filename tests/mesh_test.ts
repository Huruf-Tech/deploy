import { assert, assertEquals, assertMatch } from "@std/assert";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { acceptServer } from "@/lib/agents/servers.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { testSession } from "./_session.ts";

// The private network over the real handler with three simulated servers (PLAN §16 Phase 7).

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.test({
  name: "mesh: peers, subnets, reachability, built-in registry, warnings",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const session = await testSession("mesh");
    const { call, tenant, tenantId, user } = session;
    const agents: SimAgent[] = [];
    const ids: string[] = [];
    const poll = async (agent: SimAgent) => {
      await sleep(110);
      return await agent.poll();
    };
    const pollAll = async () => {
      for (const a of agents) await poll(a);
    };
    const pair = (
      reachability: { from: string; to: string; reachable: boolean | null }[],
      a: number,
      b: number,
    ) =>
      reachability.find((r) => r.from === ids[a] && r.to === ids[b])?.reachable;

    try {
      await t.step(
        "servers get a mesh address and their own container subnet",
        async () => {
          for (const name of ["mesh-a", "mesh-b", "mesh-c"]) {
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
            agents.push(agent);
            ids.push(json.server);
          }
          const ensure = await mongodb.db().collection("agentCommands")
            .find({ tenant: tenantId, type: "docker.ensure" }).toArray();
          assertEquals(ensure.map((c) => c.payload.subnet).sort(), [
            "10.210.1.0/24",
            "10.210.2.0/24",
            "10.210.3.0/24",
          ]);
          assert(ensure.every((c) => c.payload.meshCidr === "10.209.0.0/16"));

          // An agent added again keeps its old cursor: it's told to start over.
          await sleep(110);
          const stale = await agents[0].poll({ cursor: 999 });
          assertEquals(stale.json.resetCommands, true);
          await sleep(110);
          assertEquals((await agents[0].poll()).json.resetCommands, undefined);
          await pollAll();
        },
      );

      await t.step(
        "once keys are reported, every server has the others as peers",
        async () => {
          for (const [i, agent] of agents.entries()) {
            const patched = await call(
              "PATCH",
              `/networks/api/servers/${ids[i]}`,
              {
                endpoint: `198.51.100.${i + 1}:51820`,
              },
            );
            assertEquals(patched.status, 200, JSON.stringify(patched.json));
            await agent.reportMesh();
          }
          await pollAll();
          const mesh = agents[0].spec!.mesh!;
          assertEquals(mesh.address, "10.209.0.1/16");
          assertEquals(mesh.subnet, "10.210.1.0/24");
          const expected = [
            [
              "10.209.0.2",
              "10.210.2.0/24",
              "198.51.100.2:51820",
              agents[1].meshKey,
            ],
            [
              "10.209.0.3",
              "10.210.3.0/24",
              "198.51.100.3:51820",
              agents[2].meshKey,
            ],
          ];
          assertEquals(
            mesh.peers.map((p) => [p.meshIp, p.subnet, p.endpoint, p.publicKey])
              .sort((a, b) => a[0]!.localeCompare(b[0]!)),
            expected,
          );
        },
      );

      await t.step(
        "reachability: a and b are public; c is behind NAT and only reaches a",
        async () => {
          await agents[0].reportMesh({ [ids[1]]: true, [ids[2]]: true });
          await agents[1].reportMesh({ [ids[0]]: true, [ids[2]]: false });
          await agents[2].reportMesh({ [ids[0]]: true, [ids[1]]: false });
          const { json } = await call("GET", "/networks/api");
          const r = json.reachability;
          assertEquals([
            pair(r, 0, 1),
            pair(r, 0, 2),
            pair(r, 1, 2),
            pair(r, 2, 1),
          ], [true, true, false, false]);
          assert(json.servers.every((s: { joined: boolean }) => s.joined));
        },
      );

      await t.step(
        "the primary server runs the built-in registry",
        async () => {
          assertEquals(
            (await call("POST", "/networks/api/primary", { server: ids[0] }))
              .status,
            200,
          );
          await pollAll();
          const registry = agents[0].spec!.registry!;
          assertEquals(registry.listen, "10.209.0.1:5000");
          assertEquals(registry.username, "huruf");
          assert(registry.password.length >= 24);
          assertEquals(agents[1].spec!.registry, undefined);
          const network = JSON.stringify(
            await mongodb.db().collection("networks").findOne({
              tenant: tenantId,
            }),
          );
          assert(
            !network.includes(registry.password),
            "registry password stored in plaintext",
          );
        },
      );

      let shop = "";
      let repo = "";
      await t.step(
        "a deploy to servers that reach the primary builds once and pushes there",
        async () => {
          const { json: templates } = await call("GET", "/templates/api");
          const created = await call("POST", "/projects/api", {
            name: "Shop",
            slug: "shop",
            source: {
              type: "git",
              url: "https://git.example.com/acme/shop.git",
              branch: "main",
            },
            template: {
              template: templates.find((x: { slug: string }) =>
                x.slug === "thunder"
              )._id,
            },
            servers: [ids[1], ids[2]],
          });
          assertEquals(created.status, 200, JSON.stringify(created.json));
          shop = created.json._id;
          repo = `shop-${shop.slice(-6)}`;
          const before = agents.map((a) => a.builds.length);
          await call("POST", `/projects/api/${shop}/deploy`, {});
          await pollAll();
          const built = agents.map((a, i) => a.builds.length - before[i]);
          assertEquals(
            built.reduce((a, b) => a + b, 0),
            1,
            `builds per server: ${built}`,
          );
          const payload = agents.flatMap((a) => a.builds).at(-1)!;
          assertEquals(payload.push?.image, `10.209.0.1:5000/${repo}:1`);
          assertEquals(payload.push?.registry, "10.209.0.1:5000");
          await pollAll();
          await pollAll();
          // The target that didn't build pulls from the registry over the mesh.
          const other = built[1] ? agents[2] : agents[1];
          const release = other.spec!.workloads.find((w) =>
            w.name === "shop"
          )!.releases[0];
          assertEquals(release.image, `10.209.0.1:5000/${repo}:1`);
          assertEquals(release.pull?.registry, "10.209.0.1:5000");
        },
      );

      await t.step(
        "pruned releases leave the built-in registry; kept ones stay",
        async () => {
          // Free keeps 5 releases: five more deploys prune release 1.
          for (let i = 0; i < 5; i++) {
            await call("POST", `/projects/api/${shop}/deploy`, {});
            for (let r = 0; r < 4; r++) await pollAll();
          }
          const commands = await mongodb.db().collection("agentCommands")
            .find({ tenant: tenantId, type: "registry.delete" }).toArray();
          assertEquals(
            commands.map((c) => [String(c.server), c.payload.tags]),
            [[ids[0], [`${repo}:1`]]],
          );
          const keep = agents[1].spec!.keepImages;
          assert(keep.includes(`10.209.0.1:5000/${repo}:6`), keep.join(", "));
          assert(
            !keep.includes(`10.209.0.1:5000/${repo}:1`),
            "pruned image kept",
          );
        },
      );

      await t.step(
        "a project that can't reach what it uses gets a warning",
        async () => {
          const { json: templates } = await call("GET", "/templates/api");
          const db = await call("POST", "/projects/api", {
            name: "db",
            slug: "db",
            source: { type: "template" },
            template: {
              template: templates.find((x: { slug: string }) =>
                x.slug === "redis"
              )._id,
            },
            servers: [ids[2]],
          });
          assertEquals(db.status, 200, JSON.stringify(db.json));
          await call("POST", "/variables/api", {
            scope: "project",
            project: shop,
            key: "REDIS_URL",
            value: "redis://db.internal:6379",
          });
          const { json } = await call("GET", `/projects/api/${shop}`);
          // shop runs on b and c; db runs on c, which b can't reach.
          assertEquals(
            json.networkWarnings.length,
            1,
            JSON.stringify(json.networkWarnings),
          );
          assertMatch(
            json.networkWarnings[0],
            /^mesh-b can't reach any server running db/,
          );
        },
      );

      await t.step(
        "remove server: the cleanup command and its outcome",
        async () => {
          const issued = await call(
            "POST",
            `/servers/api/${ids[2]}/cleanup`,
            { dryRun: true, purgeData: false },
          );
          assertEquals(issued.status, 200, JSON.stringify(issued.json));
          const path = `/servers/api/${ids[2]}/commands/${issued.json.command}`;
          assertEquals((await call("GET", path)).json.status, "pending");
          await poll(agents[2]);
          await poll(agents[2]); // the result arrives with the next poll
          const outcome = await call("GET", path);
          assertEquals(outcome.json.status, "done");
          assert(outcome.json.result);
          // Another server's id doesn't reveal it.
          const other = await call(
            "GET",
            `/servers/api/${ids[1]}/commands/${issued.json.command}`,
          );
          assertEquals(other.status, 404);
        },
      );
    } finally {
      const d = mongodb.db();
      const serverIds = ids.map((s) => new ObjectId(s));
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
