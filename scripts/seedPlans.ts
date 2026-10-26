import { $plan, planModel, UNLIMITED } from "@/schemas/billing/plan.ts";
import {
  $serverClass,
  serverClassModel,
} from "@/schemas/billing/serverClass.ts";
import { includedTraffic, priceOf } from "@/lib/rentals/rentals.ts";

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
  await seedServerSizes();
};

/** Launch rate cards (PLAN §26.8), cents per month. */
const CLASSES = [
  {
    key: "shared",
    name: "Shared CPU",
    description:
      "CPU shared between servers: best for websites and light apps.",
    family: "t3",
    rates: { vcpu: 800, memGb: 400, diskGb: 12, trafficGb: 10, fixed: 200 },
    includedTrafficPerVcpu: 100,
    cpuOvercommit: 2,
    sizes: [
      ["Nano", 0.5, 1024, 10],
      ["Small", 1, 2048, 25],
      ["Medium", 2, 4096, 50],
      ["Large", 4, 8192, 100],
    ],
  },
  {
    key: "dedicated",
    name: "Dedicated CPU",
    description: "Every vCPU is yours: for steady, CPU-heavy workloads.",
    family: "c7i",
    rates: { vcpu: 2000, memGb: 500, diskGb: 12, trafficGb: 10, fixed: 200 },
    includedTrafficPerVcpu: 200,
    cpuOvercommit: 1,
    sizes: [
      ["Medium", 2, 4096, 50],
      ["Large", 4, 8192, 100],
    ],
  },
] as const;

/**
 * Seeds the launch server classes and their sizes (server plans), priced from
 * the rate card, once: an admin's later edits are never overwritten.
 */
export const seedServerSizes = async () => {
  const overheadMb = 128;
  for (const [i, { key, sizes, ...cls }] of CLASSES.entries()) {
    const doc = $serverClass.parse({ ...cls, sortOrder: i });
    const { _id } = (await serverClassModel.findOneAndUpdate(
      { name: cls.name },
      { $setOnInsert: doc },
      { upsert: true, returnDocument: "after", projection: { _id: 1 } },
    ))!;
    for (const [j, [name, vcpu, memMb, diskGb]] of sizes.entries()) {
      const resources = { vcpu, memMb, diskGb };
      const plan = $plan.parse({
        name,
        slug: `${key}-${name.toLowerCase()}`,
        description: `${cls.name}: ${vcpu} vCPU, ${
          memMb / 1024
        } GB memory, ${diskGb} GB disk`,
        kind: "server",
        class: _id,
        resources: { ...resources, trafficGb: includedTraffic(doc, vcpu) },
        price: {
          amount: priceOf(doc, resources, overheadMb),
          currency: "usd",
          interval: "month",
        },
        sortOrder: i * 10 + j,
      });
      await planModel.updateOne(
        { slug: plan.slug },
        { $setOnInsert: plan },
        { upsert: true },
      );
    }
  }
};

if (import.meta.main) {
  await seedPlans();
  Deno.exit();
}
