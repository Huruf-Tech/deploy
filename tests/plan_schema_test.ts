import { assertEquals } from "@std/assert";
import { $planUpdate } from "@/schemas/billing/plan.ts";

// A partial update must not fill defaults: renaming a plan kept resetting its
// limits, features and visibility, and made the Free plan uneditable.
Deno.test("plan updates carry only the fields sent", () => {
  assertEquals($planUpdate.parse({ name: "Pro" }), { name: "Pro" });
  assertEquals($planUpdate.parse({ active: false }), { active: false });
});
