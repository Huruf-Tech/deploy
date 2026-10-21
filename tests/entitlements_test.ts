import { assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import { Entitlements } from "@/lib/billing/entitlements.ts";

// Plain objects stand in for the schema-derived limits; only identity matters here.
const free = { limits: { servers: 5 }, features: { autoscale: true } };
const paid = { limits: { servers: 50 }, features: { autoscale: true } };

const build = (hasPeriod: () => boolean) => {
  let periodReads = 0;
  const entitlements = new Entitlements({
    currentPeriod: () => {
      periodReads++;
      return Promise.resolve(
        hasPeriod()
          ? {
            plan: new ObjectId(),
            limitsSnapshot: paid.limits,
            featuresSnapshot: paid.features,
          } as never
          : null,
      );
    },
    freePlan: () => Promise.resolve(free as never),
  });
  return { entitlements, reads: () => periodReads };
};

Deno.test("Entitlements falls back to Free without a current period", async () => {
  const { entitlements } = build(() => false);
  const result = await entitlements.resolve(new ObjectId());
  assertEquals(result.source, "free");
  assertEquals(result.limits, free.limits);
});

Deno.test("Entitlements uses the current period's snapshot and caches it", async () => {
  let active = true;
  const { entitlements, reads } = build(() => active);
  const tenant = new ObjectId();

  assertEquals((await entitlements.resolve(tenant)).limits, paid.limits);
  await entitlements.resolve(tenant);
  assertEquals(reads(), 1);

  active = false;
  entitlements.invalidate(tenant);
  assertEquals((await entitlements.resolve(tenant)).source, "free");
});
