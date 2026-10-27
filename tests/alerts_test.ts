import { assert, assertEquals, assertMatch } from "@std/assert";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { shardOf, sweepShard } from "@/lib/agents/sweep.ts";
import { deliverDueAlerts } from "@/lib/monitoring/alerts.ts";
import { Mailer } from "@/plugins/Huruf-Tech/thunder-core/lib/mailer.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { joinAsPartition } from "./_partition.ts";
import { testSession } from "./_session.ts";

// Alerts and autoscaling over the real handler with a simulated server (PLAN §16 Phase 8).

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SLACK = "https://hooks.slack.com/services/T000/B000/secrettoken1234";
const HOOK = "https://hooks.example.com/alerts?token=abcd";

Deno.test({
  name:
    "alerts: rules, agent alerts, offline, deploy failed, outbox, autoscale",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const session = await testSession("alerts");
    const { call, tenant, tenantId, user, email } = session;
    const d = mongodb.db();

    // Outbound channels are captured: email via Mailer's hook, webhooks via fetch.
    const mails: { to: string; subject?: string; text?: string }[] = [];
    const posts: { url: string; body: Record<string, unknown> }[] = [];
    let hookStatus = 200;
    const realFetch = globalThis.fetch;
    const realResolve = Deno.resolveDns;
    Mailer.onSendMail = (mail) => void mails.push(mail);
    globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      if (!url.startsWith("https://hooks.")) return realFetch(input, init);
      posts.push({ url, body: JSON.parse(String(init?.body)) });
      return Promise.resolve(new Response("ok", { status: hookStatus }));
    }) as typeof fetch;
    // deno-lint-ignore no-explicit-any
    (Deno as any).resolveDns = (host: string, type: string) =>
      Promise.resolve(
        type === "A"
          ? [host === "internal.example.com" ? "10.0.0.5" : "203.0.113.7"]
          : [],
      );

    const agent = new SimAgent(await createState("alerts-a"), {
      baseUrl: "http://localhost",
      tenant,
      send: (req) => Promise.resolve(handler(req)),
    });
    let server = "";
    const poll = async () => {
      await sleep(110);
      return await agent.poll();
    };
    // Event ingestion also delivers in the background: wait until nothing is due.
    const deliverAll = async () => {
      for (let i = 0; i < 100; i++) {
        await deliverDueAlerts({ force: true });
        const due = await d.collection("alertEvents").countDocuments({
          tenant: tenantId,
          "delivery.status": "pending",
          "delivery.nextAttemptAt": { $lte: new Date() },
        });
        if (!due) return;
        await sleep(50);
      }
    };
    const events = async () => (await call("GET", "/alertEvents/api")).json;
    let cpuRule = "";
    let offlineRule = "";

    try {
      await t.step("a server joins", async () => {
        const { json } = await joinAsPartition(agent, tenantId, user);
        server = json.server;
        await poll();
      });

      await t.step(
        "rules validate their channels and hide secrets",
        async () => {
          const base = {
            name: "Hot CPU",
            target: { kind: "server" },
            metric: "cpu",
            threshold: 80,
            forSec: 60,
          };
          const stranger = await call("POST", "/alertRules/api", {
            ...base,
            channels: [{ type: "email", target: "someone@else.com" }],
          });
          assertEquals(stranger.status, 400);
          assertMatch(JSON.stringify(stranger.json), /members only/);

          const internal = await call("POST", "/alertRules/api", {
            ...base,
            channels: [{
              type: "webhook",
              target: "https://internal.example.com/x",
            }],
          });
          assertEquals(internal.status, 400, "a private webhook address");

          const wrongMetric = await call("POST", "/alertRules/api", {
            ...base,
            metric: "deployFailed",
            channels: [{ type: "email", target: email }],
          });
          assertEquals(wrongMetric.status, 400);

          const created = await call("POST", "/alertRules/api", {
            ...base,
            channels: [
              { type: "email", target: email.toUpperCase() },
              { type: "slack", target: SLACK },
              { type: "webhook", target: HOOK },
            ],
          });
          assertEquals(created.status, 200, JSON.stringify(created.json));
          cpuRule = created.json._id;

          const { json: rules } = await call("GET", "/alertRules/api");
          const channels = rules[0].channels;
          assertEquals(channels[0].target, email.toLowerCase());
          assertEquals(channels[1].target, "https://hooks.slack.com/…1234");
          const stored = JSON.stringify(
            await d.collection("alertRules").findOne({ tenant: tenantId }),
          );
          assert(
            !stored.includes("secrettoken"),
            "Slack URL stored in plaintext",
          );

          // Saving the masked URL back keeps the real one.
          const kept = await call("PATCH", `/alertRules/api/${cpuRule}`, {
            ...base,
            channels,
          });
          assertEquals(kept.status, 200, JSON.stringify(kept.json));
        },
      );

      await t.step("the agent gets metric rules in its spec", async () => {
        await poll();
        assertEquals(agent.spec!.alerts, [{
          rule: cpuRule,
          metric: "cpu",
          threshold: 80,
          forSec: 60,
        }]);
      });

      await t.step(
        "fired: one notice per channel, repeats deduped; resolved notice",
        async () => {
          const fired = {
            id: `fired-${cpuRule}-1`,
            type: "alert.fired" as const,
            data: { rule: cpuRule, value: 93.5, firedAt: Date.now() },
          };
          await agent.sendEvents([fired]);
          await agent.sendEvents([{ ...fired, id: `fired-${cpuRule}-2` }]);
          await deliverAll();
          assertEquals(mails.length, 1);
          assertEquals(mails[0].to, email.toLowerCase());
          assertMatch(
            mails[0].text!,
            /CPU on alerts-a: 93.5% \(threshold 80%\)/,
          );
          assertEquals(posts.map((p) => p.url).sort(), [HOOK, SLACK].sort());
          assertEquals(
            posts.find((p) => p.url === HOOK)!.body.event,
            "alert.fired",
          );

          const [open] = await events();
          assertEquals([open.open, open.delivery.status], [true, "sent"]);

          await agent.sendEvents([{
            ...fired,
            id: `resolved-${cpuRule}-1`,
            type: "alert.resolved",
          }]);
          await deliverAll();
          assertEquals(mails.length, 2);
          assertMatch(mails[1].text!, /^✅ Resolved: Hot CPU/);
          const [resolved] = await events();
          assertEquals(resolved.open, false);
          assert(resolved.resolvedAt);
        },
      );

      await t.step(
        "a failing channel retries; delivered ones aren't repeated",
        async () => {
          hookStatus = 500;
          await agent.sendEvents([{
            id: `fired-${cpuRule}-3`,
            type: "alert.fired",
            data: { rule: cpuRule, value: 85, firedAt: Date.now() },
          }]);
          const before = { mails: mails.length, posts: posts.length };
          await deliverAll();
          const [event] = await events();
          assertEquals(event.delivery.status, "pending");
          assertEquals(event.delivery.attempts, 1);
          assertMatch(event.delivery.error, /HTTP 500/);
          assertEquals(mails.length, before.mails + 1);

          hookStatus = 200;
          await d.collection("alertEvents").updateOne({
            _id: new ObjectId(event._id),
          }, {
            $set: { "delivery.nextAttemptAt": new Date() },
          });
          await deliverAll();
          assertEquals(
            mails.length,
            before.mails + 1,
            "email isn't sent twice",
          );
          assertEquals((await events())[0].delivery.status, "sent");
          assertEquals(posts.length, before.posts + 4); // two failed, two sent
        },
      );

      await t.step(
        "offline: a blip within the grace never alerts",
        async () => {
          const created = await call("POST", "/alertRules/api", {
            name: "Server down",
            target: { kind: "server", ref: server },
            metric: "agentOffline",
            channels: [{ type: "email", target: email }],
          });
          assertEquals(created.status, 200, JSON.stringify(created.json));
          offlineRule = created.json._id;
          const { json: rules } = await call("GET", "/alertRules/api");
          assertEquals(
            rules.find((r: { _id: string }) => r._id === offlineRule).forSec,
            20,
          );

          const id = new ObjectId(server);
          const expire = () =>
            d.collection("serverLeases").updateOne({ _id: id }, {
              $set: { aliveUntil: new Date(Date.now() - 1_000) },
            });
          await expire();
          await sweepShard(shardOf(id));
          const pending = await d.collection("alertEvents").findOne({
            rule: new ObjectId(offlineRule),
          });
          assert(
            pending && pending.firedAt > new Date(),
            "waits out the grace",
          );
          assertEquals(
            (await events()).filter((e: { metric: string }) =>
              e.metric === "agentOffline"
            ).length,
            0,
          );
          await poll(); // back within the grace
          assertEquals(
            await d.collection("alertEvents").countDocuments({
              rule: new ObjectId(offlineRule),
            }),
            0,
          );

          // Past the grace: fired, then resolved when it polls again.
          await call("PATCH", `/alertRules/api/${offlineRule}`, {
            name: "Server down",
            target: { kind: "server", ref: server },
            metric: "agentOffline",
            forSec: 0,
            channels: [{ type: "email", target: email }],
          });
          const before = mails.length;
          await expire();
          await sweepShard(shardOf(id));
          await deliverAll();
          assertEquals(mails.length, before + 1);
          assertMatch(mails.at(-1)!.text!, /alerts-a stopped reporting/);
          await poll();
          await deliverAll();
          assertEquals(mails.length, before + 2);
          assertMatch(mails.at(-1)!.text!, /^✅ Resolved: Server down/);
        },
      );

      let redis = "";
      await t.step("deploy failed alerts until a deploy succeeds", async () => {
        const { json: templates } = await call("GET", "/templates/api");
        const created = await call("POST", "/projects/api", {
          name: "cache",
          slug: "cache",
          source: { type: "template" },
          template: {
            template: templates.find((x: { slug: string }) =>
              x.slug === "redis"
            )
              ._id,
          },
          servers: [server],
        });
        assertEquals(created.status, 200, JSON.stringify(created.json));
        redis = created.json._id;
        await call("POST", "/alertRules/api", {
          name: "Deploys",
          target: { kind: "project" },
          metric: "deployFailed",
          channels: [{ type: "webhook", target: HOOK }],
        });

        const before = posts.length;
        agent.outcome = () => "failed";
        await call("POST", `/projects/api/${redis}/deploy`, {});
        for (let i = 0; i < 4; i++) await poll();
        await deliverAll();
        assertEquals(posts.length, before + 1);
        assertEquals(posts.at(-1)!.body.event, "alert.fired");
        assertMatch(
          String(posts.at(-1)!.body.text),
          /A deploy of cache failed/,
        );

        agent.outcome = () => "healthy";
        await call("POST", `/projects/api/${redis}/deploy`, {});
        for (let i = 0; i < 4; i++) await poll();
        await deliverAll();
        assertEquals(posts.length, before + 2);
        assertEquals(posts.at(-1)!.body.event, "alert.resolved");

        // A claimed deploy has a deadline at once; cancelling it alerts nobody.
        const { json: started } = await call(
          "POST",
          `/projects/api/${redis}/deploy`,
          {},
        );
        const doc = await d.collection("deployments").findOne({
          _id: new ObjectId(started.deployment),
        });
        assert(doc?.deadlineAt, "claimed with a deadline");
        const cancelled = await call(
          "POST",
          `/projects/api/deployments/${started.deployment}/cancel`,
        );
        assertEquals(cancelled.status, 200, JSON.stringify(cancelled.json));
        await deliverAll();
        assertEquals(posts.length, before + 2, "a cancel isn't a failure");
        assertEquals(
          (await d.collection("deployments").findOne({
            _id: new ObjectId(started.deployment),
          }))?.status,
          "cancelled",
        );
      });

      await t.step(
        "autoscale: bounds in the spec, changes on the project",
        async () => {
          const bad = await call("PATCH", `/projects/api/${redis}`, {
            autoscale: { min: 3, max: 2, cpuPercent: 70 },
          });
          assertEquals(bad.status, 400);
          // The template's volume rules autoscaling out.
          const withVolume = await call("PATCH", `/projects/api/${redis}`, {
            autoscale: { min: 1, max: 3, cpuPercent: 70 },
          });
          assertEquals(withVolume.status, 400);
          assertMatch(JSON.stringify(withVolume.json), /local volumes/);

          const created = await call("POST", "/projects/api", {
            name: "web",
            slug: "web",
            source: { type: "image", image: "nginx:1.27" },
            runtime: { port: 80, memReserveMb: 64, cpuLimit: 0.5 },
            autoscale: { min: 1, max: 4, cpuPercent: 60 },
            servers: [server],
          });
          assertEquals(created.status, 200, JSON.stringify(created.json));
          const web = created.json._id;
          await call("POST", `/projects/api/${web}/deploy`, {});
          for (let i = 0; i < 4; i++) await poll();
          const workload = agent.spec!.workloads.find((w) => w.name === "web")!;
          assertEquals(workload.autoscale, {
            min: 1,
            max: 4,
            cpuPercent: 60,
            cooldownSec: 120,
          });
          assertEquals(workload.base, { cpu: 0.5, memMb: 64 });

          await agent.sendEvents([{
            id: "as-web-1",
            type: "autoscale.changed",
            data: {
              project: web,
              workload: "web",
              from: 1,
              to: 3,
              reason: "CPU 95% (target 60%)",
            },
          }]);
          const { json: project } = await call("GET", `/projects/api/${web}`);
          assertEquals(project.autoscaled.length, 1);
          assertEquals(project.autoscaled[0].replicas, 3);
        },
      );

      await t.step("deleting a rule closes its episodes quietly", async () => {
        await agent.sendEvents([{
          id: `fired-${cpuRule}-9`,
          type: "alert.fired",
          data: { rule: cpuRule, value: 99, firedAt: Date.now() },
        }]);
        assertEquals(
          (await call("DELETE", `/alertRules/api/${cpuRule}`)).status,
          200,
        );
        assertEquals(
          await d.collection("alertEvents").countDocuments({
            rule: new ObjectId(cpuRule),
            open: true,
          }),
          0,
        );
        await poll();
        assertEquals(agent.spec!.alerts, []);
      });
    } finally {
      globalThis.fetch = realFetch;
      // deno-lint-ignore no-explicit-any
      (Deno as any).resolveDns = realResolve;
      Mailer.onSendMail = undefined;
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
          "alertRules",
          "alertEvents",
        ].map((name) => d.collection(name).deleteMany({ tenant: tenantId })),
        d.collection("serverSpecs").deleteMany({ _id: { $in: serverIds } }),
        d.collection("agentEvents").deleteMany({ server: { $in: serverIds } }),
      ]);
      await session.cleanup();
    }
  },
});
