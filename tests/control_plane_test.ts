import { assert, assertEquals } from "@std/assert";
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
