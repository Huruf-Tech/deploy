import { assertEquals } from "@std/assert";
import { mongodb } from "@/database.ts";
import { testSession } from "./_session.ts";

// Platform safety limits enforced by hooks/userLimits.ts (PLAN §20.3).

Deno.test({
  name: "limits: a user owns at most SAFETY_TENANTS_OWNED_PER_USER workspaces",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const session = await testSession("limits"); // owns one already
    try {
      const statuses = [];
      for (let i = 0; i < 3; i++) {
        statuses.push(
          (await session.call("POST", "/tenants/api", {
            name: `extra-${i}`,
          })).status,
        );
      }
      // The default cap is 3: two more succeed, the third is refused.
      assertEquals(statuses, [200, 200, 403]);
    } finally {
      await mongodb.db().collection("tenants").deleteMany({
        createdBy: session.user,
      });
      await mongodb.db().collection("tenantMembers").deleteMany({
        user: session.user,
      });
      await session.cleanup();
    }
  },
});
