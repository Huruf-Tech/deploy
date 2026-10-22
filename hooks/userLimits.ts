import type { THook } from "@/core/http/hooks.ts";
import { Response } from "@/core/http/response.ts";
import { withAuthSession } from "@/plugins/Huruf-Tech/thunder-core/utils/withAuthSession.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { BoundedCache } from "@/lib/core/boundedCache.ts";
import { safetyLimit } from "@/lib/limits/safety.ts";

/** Requests per user in the current minute, per instance (PLAN §20.4 bounded). */
const requests = new BoundedCache<string, { minute: number; count: number }>({
  maxEntries: 50_000,
  ttlMs: 2 * 60_000,
});

/**
 * Platform safety limits per user (PLAN §20.3) that no route enforces itself:
 * API requests per minute, and how many workspaces a user may own (tenants
 * are created by thunder-core's route, so the check sits here).
 * ponytail: the request limit counts per instance, so serverless scale-out
 * multiplies it; move it to rateCounters if abuse gets past that.
 */
export default {
  // After the guard hook (100000), which has already resolved the session.
  priority: 1_000,
  pre: async ({ req, scope, name }) => {
    if (scope === "agents" || scope === "githubHooks") return;
    const session = await withAuthSession(req, true).catch(() => undefined);
    if (!session) return;
    const user = session.user._id;

    const minute = Math.floor(Date.now() / 60_000);
    const key = user.toHexString();
    const entry = requests.get(key);
    const count = entry?.minute === minute ? entry.count + 1 : 1;
    requests.set(key, { minute, count });
    if (count > await safetyLimit("SAFETY_API_REQUESTS_PER_USER_PER_MIN")) {
      return Response.json(
        { message: "Too many requests; slow down for a minute" },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    if (scope === "tenants" && name === "create") {
      const allowed = await safetyLimit("SAFETY_TENANTS_OWNED_PER_USER");
      if (await tenantModel.countDocuments({ createdBy: user }) >= allowed) {
        return Response.forbidden(
          `You can own up to ${allowed} workspaces`,
        );
      }
    }
  },
} satisfies THook;
