import { cache } from "@/core/utils/cache.ts";
import { Env } from "@/core/utils/env.ts";
import { importMasterKey, Keyring } from "@/lib/core/keyring.ts";
import { QuotaGuard } from "@/lib/core/quotaGuard.ts";
import { RateLimiter } from "@/lib/core/rateLimiter.ts";
import { Entitlements } from "@/lib/billing/entitlements.ts";
import { BillingService } from "@/lib/billing/billing.ts";
import { GitHubApi } from "@/lib/github/githubApi.ts";
import { keyringModel } from "@/schemas/crypto/keyring.ts";
import {
  $planFeatures,
  $planLimits,
  planModel,
} from "@/schemas/billing/plan.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { rateCounterModel } from "@/schemas/limits/rateCounter.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";

/** Composition root (PLAN §23.1): every service is built once, here, at module load. */

// getSync on purpose: the master key must come from the process env, never
// from the DB-backed `envs` fallback that `Env.get` would consult.
export const keyring = new Keyring(
  keyringModel,
  () => importMasterKey(Env.getSync("DEPLOY_MASTER_KEY")),
);

export const quotaGuard = new QuotaGuard(tenantUsageModel);

export const rateLimiter = new RateLimiter(rateCounterModel);

export const githubApi = new GitHubApi();

const freePlan = cache(async () => {
  const plan = await planModel.findOne(
    { isFree: true },
    { projection: { limits: 1, features: 1 } },
  );

  // An unseeded database still gets the Free defaults from the schema.
  return {
    plan: plan?._id,
    limits: $planLimits.parse(plan?.limits ?? {}),
    features: $planFeatures.parse(plan?.features ?? {}),
  };
}, 60_000);

export const entitlements: Entitlements = new Entitlements({
  currentPeriod: (tenant, now) =>
    subscriptionPeriodModel.findOne(
      { tenant, periodStart: { $lte: now }, periodEnd: { $gt: now } },
      {
        sort: { periodEnd: -1 },
        projection: { plan: 1, limitsSnapshot: 1, featuresSnapshot: 1 },
      },
    ),
  freePlan,
  renew: (tenant): Promise<void> => billing.renewIfDue(tenant),
  enforce: (tenant, resolved): Promise<void> =>
    billing.enforceLimits(tenant, resolved),
});

export const billing: BillingService = new BillingService(entitlements);
