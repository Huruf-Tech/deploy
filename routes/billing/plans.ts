import { Router } from "@/core/http/router.ts";
import { Response } from "@/core/http/response.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import { $plan, planModel } from "@/schemas/billing/plan.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";

const FREE_IS_SEEDED = "There is one Free plan, created by setup";

/**
 * Plans (PLAN §22.1), root only. Paid periods keep a snapshot of limits and
 * price, so edits apply to tenants from their next period. The Free plan is
 * seeded; `isFree` can't be set here.
 */
export default new Router("/api", function plans(router) {
  createCRUD({
    router,
    schema: $plan,
    updateSchema: $plan.omit({ createdAt: true }).partial(),
    model: planModel,
  }, {
    hooks: {
      beforeCreate: ({ data }) => {
        if (data.isFree) throw Response.badRequest(FREE_IS_SEEDED);
      },
      beforeUpdate: async ({ _id, data, session }) => {
        if (data.isFree === undefined) return;
        const plan = await planModel.findOne({ _id }, {
          projection: { isFree: 1 },
          session,
        });
        if (!!plan?.isFree !== data.isFree) {
          throw Response.badRequest(FREE_IS_SEEDED);
        }
      },
      beforeDel: async ({ _id, session }) => {
        const plan = await planModel.findOne({ _id }, {
          projection: { isFree: 1 },
          session,
        });
        if (plan?.isFree) throw Response.badRequest("Free can't be deleted");
        const used = await subscriptionModel.countDocuments(
          {
            $or: [{ plan: _id }, { nextPlan: _id }],
            status: { $ne: "canceled" },
          },
          { limit: 1, session },
        );
        if (used) {
          throw Response.badRequest(
            "Workspaces are subscribed to this plan: deactivate it instead",
          );
        }
      },
    },
  });
}).group("Admin");
