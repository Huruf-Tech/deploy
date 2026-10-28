import { $plan, planModel, UNLIMITED } from "@/schemas/billing/plan.ts";

/**
 * Seeds the built-in plans once. Never overwrites an admin's later edits.
 *
 * - Free: every tenant's default plan.
 * - Unlimited: private with no tenants, so only admins see it; they grant it
 *   by adding tenants to it. Quotas are UNLIMITED; kept releases stay bounded
 *   (disk), and managed servers stay off until that feature exists (D42).
 */
export const seedPlans = async () => {
  const { isFree: _, ...free } = $plan.parse({
    name: "Free",
    slug: "free",
    description: "Every tenant's default plan.",
    price: { amount: 0, currency: "usd", interval: "month" },
    isFree: true,
  });

  await planModel.updateOne(
    { isFree: true },
    { $setOnInsert: free },
    { upsert: true },
  );

  const limits = $plan.shape.limits.parse(undefined);
  const unlimited = $plan.parse({
    name: "Unlimited",
    slug: "unlimited",
    description: "No quotas. Private: admins grant it to tenants.",
    visibility: "private",
    allowedTenants: [],
    price: { amount: 0, currency: "usd", interval: "month" },
    limits: {
      ...Object.fromEntries(Object.keys(limits).map((k) => [k, UNLIMITED])),
      releasesKept: 20,
    },
    features: {
      blueGreen: true,
      autoscale: true,
      privateNetwork: true,
      backups: true,
      aiAssistant: true,
    },
    sortOrder: 1000,
  });

  await planModel.updateOne(
    { slug: "unlimited" },
    { $setOnInsert: unlimited },
    { upsert: true },
  );
};

if (import.meta.main) {
  await seedPlans();
  Deno.exit();
}
