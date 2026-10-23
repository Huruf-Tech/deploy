import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, queryAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withAuthSession } from "@/plugins/Huruf-Tech/thunder-core/utils/withAuthSession.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { billing } from "@/lib/services.ts";
import { planModel } from "@/schemas/billing/plan.ts";
import {
  $subscription,
  subscriptionModel,
} from "@/schemas/billing/subscription.ts";

/**
 * Admin billing (PLAN §22.4, §22.6): every tenant's subscription, and
 * complimentary periods. Root only: no member policy grants this router.
 */
export default new Router("/api", function billingAdmin(router) {
  router.get("/subscriptions", function subscriptions() {
    const $query = z.object({
      status: $subscription.shape.status.optional(),
      limit: z.coerce.number().int().min(1).max(200).default(100),
    });
    const $return = z.array(
      $subscription.pick({
        status: true,
        autoRenew: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
        lastError: true,
      }).extend({
        _id: z.string(),
        tenant: z.string(),
        tenantName: z.string().optional(),
        planName: z.string().optional(),
      }),
    );

    return {
      shape: () => ({ query: $query, return: $return }),
      handler: async (req) => {
        const { status, limit } = $query.parse(queryAsJson(req));
        const subs = await subscriptionModel.find(
          status ? { status } : {},
          { sort: { updatedAt: -1 }, limit },
        ).toArray();
        const [tenants, plans] = await Promise.all([
          tenantModel.find({ _id: { $in: subs.map((s) => s.tenant) } }, {
            projection: { name: 1 },
          }).toArray(),
          planModel.find({ _id: { $in: subs.map((s) => s.plan) } }, {
            projection: { name: 1 },
          }).toArray(),
        ]);
        return Response.json(subs.map((s) => ({
          _id: s._id,
          tenant: s.tenant,
          tenantName: tenants.find((t) => t._id.equals(s.tenant))?.name,
          planName: plans.find((p) => p._id.equals(s.plan))?.name,
          status: s.status,
          autoRenew: s.autoRenew,
          cancelAtPeriodEnd: s.cancelAtPeriodEnd,
          currentPeriodEnd: s.currentPeriodEnd,
          lastError: s.lastError,
        })));
      },
    };
  });

  router.post("/grant", function grant() {
    const $body = z.object({
      tenant: $objectId,
      plan: $objectId,
      days: z.number().int().min(1).max(3_650),
      note: z.string().min(1).max(300).describe("Why, e.g. partner or trial"),
    });

    return {
      shape: () => ({ body: $body }),
      handler: async (req) => {
        const body = $body.parse(await bodyAsJson(req));
        const { user } = await withAuthSession(req);
        if (!await tenantModel.countDocuments({ _id: body.tenant })) {
          throw Response.notFound("Tenant not found");
        }
        await billing.grantComplimentary({ ...body, by: user._id });
        return Response.json({ ok: true });
      },
    };
  });
}).group("Admin");
