import { assert, assertEquals, assertRejects } from "@std/assert";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import {
  breaches,
  evaluateControlPlane,
  forgetControlPlaneRules,
} from "@/lib/monitoring/controlPlaneAlerts.ts";
import { createRule } from "@/lib/monitoring/rules.ts";
import {
  alertEventModel,
  alertRuleModel,
  PLATFORM_OWNER,
} from "@/schemas/monitoring/alert.ts";
import handler from "@/serve.base.ts";
import {
  controlPlaneOverview,
  flush,
  INSTANCE,
  percentile,
} from "@/lib/monitoring/controlPlane.ts";
import { controlPlaneSampleModel } from "@/schemas/monitoring/controlPlane.ts";
import { testSession } from "./_session.ts";

// Control plane metrics (PLAN §20.2 "our own observability").

Deno.test("percentiles come from the merged histogram", () => {
  assertEquals(percentile([0, 0, 0], 0.95), null);
  // 90 fast (≤5 ms), 10 at ≤100 ms: p95 is in the 100 ms bucket.
  const hist = [90, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0];
  assertEquals(percentile(hist, 0.5), 5);
  assertEquals(percentile(hist, 0.95), 100);
});

Deno.test({
  name: "control plane: requests and queries are counted, admins read them",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const session = await testSession("control-plane");
    try {
      await flush(); // start from an empty window
      for (let i = 0; i < 3; i++) {
        await handler(new Request("http://localhost/home/api/"));
      }
      const health = await handler(
        new Request("http://localhost/home/api/health"),
      );
      assertEquals(health.status, 200);
      assertEquals((await health.json()).ok, true);
      await flush();

      const sample = await controlPlaneSampleModel.findOne(
        { instance: INSTANCE },
        { sort: { at: -1 } },
      );
      assert(sample);
      assertEquals(
        sample.routes.find((r) => r.route === "home.status")?.count,
        3,
      );
      assert(sample.requests >= 4);
      assert(sample.db.ops >= 1, "the health ping is a database operation");
      assert(sample.process.rssMb > 0);
      assert(sample.expiresAt > new Date());

      const overview = await controlPlaneOverview("1h");
      assert(overview.instances.some((i) => i.instance === INSTANCE));
      assert(overview.routes.some((r) => r.route === "home.status"));
      assert(overview.series.length >= 1);
      assertEquals(typeof overview.cluster.onlineAgents, "number");

      // Root only: a workspace owner can't read it.
      const denied = await session.call("GET", "/controlPlane/api/overview");
      assertEquals(denied.status, 403);
    } finally {
      await controlPlaneSampleModel.deleteMany({ instance: INSTANCE });
      await session.cleanup();
    }
  },
});

Deno.test("a rule breaches only when its whole window does", () => {
  assert(breaches([90, 95, 91], 80, 3));
  assert(!breaches([90, 70, 91], 80, 3), "one sample under");
  assert(!breaches([90, 95], 80, 3), "not enough samples yet");
  assert(!breaches([90, undefined, 95], 80, 2), "a gap");
  assert(breaches([30, 40], 50, 2, true), "below fires (polls missing)");
});

Deno.test({
  name: "control plane rules: fire on samples, resolve, platform only",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const session = await testSession("control-plane-rules");
    const instance = `test-${Date.now().toString(36)}`;
    const label = `test-host (${instance})`;
    const admin = new ObjectId();
    const email = `cp-admin-${instance}@example.com`;
    const channels = [{ type: "email" as const, target: email }];
    const sample = (minutesAgo: number, cpuPct: number) => ({
      instance,
      host: "test-host",
      at: new Date(Date.now() - minutesAgo * 60_000),
      windowS: 60,
      requests: 0,
      errors: 0,
      latency: [],
      polls: 0,
      pollLatency: [],
      routes: [],
      db: {
        ops: 0,
        failed: 0,
        totalMs: 0,
        latency: [],
        poolCheckouts: 0,
        poolWaitMaxMs: 0,
        poolSize: 0,
        slow: [],
      },
      process: { rssMb: 1, heapUsedMb: 1, heapTotalMb: 1, cpuPct, uptimeS: 1 },
      expiresAt: new Date(Date.now() + 60_000),
    });
    let rule: ObjectId | undefined;
    try {
      await mongodb.db().collection("users").insertOne({
        _id: admin,
        email,
        role: "admin",
      });
      // Workspaces can't watch the control plane, and the platform watches nothing else.
      await assertRejects(() =>
        createRule(session.tenantId, session.user, {
          name: "x",
          target: { kind: "controlPlane" },
          metric: "cpCpu",
          channels,
          enabled: true,
        })
      );
      await assertRejects(() =>
        createRule(PLATFORM_OWNER, admin, {
          name: "x",
          target: { kind: "server" },
          metric: "cpu",
          channels,
          enabled: true,
        })
      );
      // Alerts go to platform admins only.
      await assertRejects(() =>
        createRule(PLATFORM_OWNER, admin, {
          name: "x",
          target: { kind: "controlPlane" },
          metric: "cpCpu",
          channels: [{ type: "email", target: "stranger@example.com" }],
          enabled: true,
        })
      );

      rule = (await createRule(PLATFORM_OWNER, admin, {
        name: "CPU high",
        target: { kind: "controlPlane" },
        metric: "cpCpu",
        threshold: 80,
        forSec: 120,
        channels,
        enabled: true,
      }))._id;
      forgetControlPlaneRules();

      await controlPlaneSampleModel.insertMany([
        sample(1.5, 95),
        sample(0.5, 50),
      ]);
      await evaluateControlPlane(instance, label);
      assertEquals(
        await alertEventModel.countDocuments({ rule, open: true }),
        0,
        "one sample under the threshold: no alert",
      );

      await controlPlaneSampleModel.deleteMany({ instance });
      await controlPlaneSampleModel.insertMany([
        sample(1.5, 95),
        sample(0.5, 97),
      ]);
      await evaluateControlPlane(instance, label);
      const fired = await alertEventModel.findOne({ rule, open: true });
      assertEquals(fired?.instance, label);
      assertEquals(fired?.tenant.equals(PLATFORM_OWNER), true);

      await controlPlaneSampleModel.insertOne(sample(0, 20));
      await evaluateControlPlane(instance, label);
      assertEquals(
        await alertEventModel.countDocuments({ rule, open: true }),
        0,
      );
      assertEquals(
        (await alertEventModel.findOne({ rule }))?.delivery.notice,
        "resolved",
      );
    } finally {
      await Promise.all([
        controlPlaneSampleModel.deleteMany({ instance }),
        mongodb.db().collection("users").deleteOne({ _id: admin }),
        rule && alertRuleModel.deleteOne({ _id: rule }),
        rule && alertEventModel.deleteMany({ rule }),
      ]);
      forgetControlPlaneRules();
      await session.cleanup();
    }
  },
});
