import { $plan, planModel } from "@/schemas/billing/plan.ts";

/** Seeds the Free plan once. Never overwrites an admin's later edits. */
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
};

if (import.meta.main) {
  await seedPlans();
  Deno.exit();
}
