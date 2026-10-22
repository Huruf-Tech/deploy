import type { ObjectId } from "mongodb";
import type { TPlanFeatures, TPlanLimits } from "@/schemas/billing/plan.ts";
import { BoundedCache } from "@/lib/core/boundedCache.ts";

export type TEntitlements = {
  source: "period" | "free";
  plan?: ObjectId;
  limits: TPlanLimits;
  features: TPlanFeatures;
};

export type TEntitlementSources = {
  /** The subscription period covering `now`, if any. */
  currentPeriod(tenant: ObjectId, now: Date): Promise<
    {
      plan: ObjectId;
      limitsSnapshot: TPlanLimits;
      featuresSnapshot: TPlanFeatures;
    } | null
  >;
  freePlan(): Promise<
    { plan?: ObjectId; limits: TPlanLimits; features: TPlanFeatures }
  >;
  /** Lazy renewal, before the current period is read (PLAN §22.3). */
  renew?(tenant: ObjectId): Promise<void>;
  /** Over-limit enforcement with the resolved plan (PLAN §22.5). */
  enforce?(tenant: ObjectId, entitlements: TEntitlements): Promise<void>;
};

/**
 * Effective plan (PLAN §22.2): the current subscription period's snapshot,
 * otherwise Free. Resolved on mutations and dashboard loads only, never on polls.
 */
export class Entitlements {
  private readonly cache = new BoundedCache<string, TEntitlements>({
    maxEntries: 5_000,
    ttlMs: 60_000,
  });

  constructor(private readonly sources: TEntitlementSources) {}

  async resolve(tenant: ObjectId): Promise<TEntitlements> {
    const cached = this.cache.get(tenant.toString());
    if (cached) return cached;

    // Billing upkeep rides on resolution; a failure there never blocks the request.
    await this.sources.renew?.(tenant).catch(this.onError);
    const period = await this.sources.currentPeriod(tenant, new Date());
    const entitlements: TEntitlements = period
      ? {
        source: "period",
        plan: period.plan,
        limits: period.limitsSnapshot,
        features: period.featuresSnapshot,
      }
      : { source: "free", ...(await this.sources.freePlan()) };

    await this.sources.enforce?.(tenant, entitlements).catch(this.onError);
    this.cache.set(tenant.toString(), entitlements);
    return entitlements;
  }

  private onError = (error: unknown) =>
    console.warn("[billing] upkeep failed:", error);

  /** Call after a subscription change so this instance sees it immediately. */
  invalidate(tenant: ObjectId) {
    this.cache.delete(tenant.toString());
  }
}
