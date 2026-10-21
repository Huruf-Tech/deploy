import { assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import { QuotaGuard } from "@/lib/core/quotaGuard.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";

// Needs a real MongoDB with the setup indexes (deno task setup:dev).
Deno.test({
  name: "QuotaGuard enforces the limit atomically under concurrency",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const guard = new QuotaGuard(tenantUsageModel);
    const tenant = new ObjectId();

    try {
      const results = await Promise.all(
        Array.from({ length: 10 }, () => guard.acquire(tenant, "servers", 3)),
      );
      assertEquals(results.filter(Boolean).length, 3);
      assertEquals(await guard.acquire(tenant, "projects", 0), false);

      await guard.release(tenant, "servers");
      assertEquals(await guard.acquire(tenant, "servers", 3), true);
      assertEquals(await guard.acquire(tenant, "servers", 3), false);
    } finally {
      await tenantUsageModel.deleteOne({ tenant });
      await mongodb.close();
    }
  },
});
