import type { Collection } from "mongodb";
import type { TRateCounter } from "@/schemas/limits/rateCounter.ts";

/**
 * Fixed-window rate quotas (PLAN §20.3): one upsert per counted action.
 * Never used on agent polls; those use in-memory buckets.
 */
export class RateLimiter {
  constructor(
    private readonly counters: Pick<
      Collection<TRateCounter>,
      "findOneAndUpdate"
    >,
  ) {}

  /** Counts one hit on `key`; resolves false when the window's limit is exceeded. */
  async hit(key: string, limit: number, windowSec: number): Promise<boolean> {
    const windowMs = windowSec * 1000;
    const window = Math.floor(Date.now() / windowMs);

    const counter = await this.counters.findOneAndUpdate(
      { _id: `${key}:${window}` },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date((window + 1) * windowMs) },
      },
      { upsert: true, returnDocument: "after" },
    );

    return (counter?.count ?? 1) <= limit;
  }
}
