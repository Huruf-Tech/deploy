import { isDuplicateKeyError } from "@/database.ts";
import type {
  ClientSession,
  Collection,
  Filter,
  ObjectId,
  UpdateFilter,
} from "mongodb";
import type {
  TCountQuota,
  TTenantUsage,
} from "@/schemas/limits/tenantUsage.ts";

/**
 * Count quotas via one atomic conditional increment (PLAN §20.3): no
 * countDocuments scans, no races. `acquire` before creating, `release` after deleting.
 */
export class QuotaGuard {
  constructor(
    private readonly usage: Pick<Collection<TTenantUsage>, "updateOne">,
  ) {}

  async acquire(
    tenant: ObjectId,
    quota: TCountQuota,
    limit: number,
    session?: ClientSession,
  ): Promise<boolean> {
    if (limit <= 0) return false;

    const filter = {
      tenant,
      $or: [{ [quota]: { $lt: limit } }, { [quota]: { $exists: false } }],
    } as Filter<TTenantUsage>;
    const update = { $inc: { [quota]: 1 } } as UpdateFilter<TTenantUsage>;

    // A duplicate key means the usage doc exists but is at the limit, or a
    // concurrent first insert won; one retry tells those apart.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await this.usage.updateOne(filter, update, {
          upsert: true,
          session,
        });
        return result.modifiedCount + result.upsertedCount === 1;
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
      }
    }

    return false;
  }

  async release(tenant: ObjectId, quota: TCountQuota, session?: ClientSession) {
    await this.usage.updateOne(
      { tenant, [quota]: { $gt: 0 } } as Filter<TTenantUsage>,
      { $inc: { [quota]: -1 } } as UpdateFilter<TTenantUsage>,
      { session },
    );
  }
}
