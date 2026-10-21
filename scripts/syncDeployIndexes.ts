import { planModel } from "@/schemas/billing/plan.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { keyringModel } from "@/schemas/crypto/keyring.ts";
import { rateCounterModel } from "@/schemas/limits/rateCounter.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";

/** Every Huruf Deploy index lives here (PLAN §6). Run by setup, never at startup. */
export const syncDeployIndexes = async () => {
  await Promise.all([
    keyringModel.createIndex(
      { "owner.kind": 1, "owner.ref": 1 },
      { name: "uniqueOwner", unique: true },
    ),
    planModel.createIndex({ slug: 1 }, { name: "uniqueSlug", unique: true }),
    planModel.createIndex(
      { isFree: 1 },
      {
        name: "singleFreePlan",
        unique: true,
        partialFilterExpression: { isFree: true },
      },
    ),
    subscriptionPeriodModel.createIndex(
      { subscription: 1, periodStart: 1 },
      { name: "uniquePeriod", unique: true },
    ),
    subscriptionPeriodModel.createIndex(
      { tenant: 1, periodEnd: -1 },
      { name: "tenantPeriods" },
    ),
    // QuotaGuard relies on this being unique.
    tenantUsageModel.createIndex(
      { tenant: 1 },
      { name: "uniqueTenant", unique: true },
    ),
    rateCounterModel.createIndex(
      { expiresAt: 1 },
      { name: "ttl", expireAfterSeconds: 0 },
    ),
  ]);
};

if (import.meta.main) {
  await syncDeployIndexes();
  Deno.exit();
}
