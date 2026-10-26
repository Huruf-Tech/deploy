import { Response } from "@/core/http/response.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";

/**
 * The active tenant, for its owner only (PLAN §22.6, §25.6): plans, cards and
 * Add funds are the owner's to change; members only read.
 */
export async function tenantOwner(req: Request, action: string) {
  const ctx = await withTenant(req);
  if (!ctx.user._id.equals(ctx.owner._id)) {
    throw Response.forbidden(`Only the tenant owner can ${action}`);
  }
  return ctx;
}
