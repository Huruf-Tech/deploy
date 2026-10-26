import z from "zod";
import type { ObjectId } from "mongodb";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { readNumberSetting, readTextSetting } from "@/lib/core/settings.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { tenantOwner } from "@/lib/billing/owner.ts";
import { tenantMemberModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenantMember.ts";
import { walletModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/wallet.ts";
import { billing as billingService, entitlements } from "@/lib/services.ts";
import {
  $plan,
  $planFeatures,
  $planLimits,
  planModel,
} from "@/schemas/billing/plan.ts";
import {
  $subscription,
  subscriptionModel,
} from "@/schemas/billing/subscription.ts";
import {
  $subscriptionPeriod,
  subscriptionPeriodModel,
} from "@/schemas/billing/subscriptionPeriod.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";
import { projectModel } from "@/schemas/applications/project.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { templateModel } from "@/schemas/build/template.ts";
import { alertRuleModel } from "@/schemas/monitoring/alert.ts";
import { gitIntegrationModel } from "@/schemas/build/gitIntegration.ts";
import { registryModel } from "@/schemas/infrastructure/serverSpec.ts";
import { domainModel } from "@/schemas/applications/domain.ts";

/** What counts against the plan's quotas, for the usage bars (PLAN §20.3). */
async function usageOf(tenant: ObjectId) {
  const count = (
    model: { countDocuments(f: object): Promise<number> },
    extra = {},
  ) => model.countDocuments({ tenant, ...extra });
  const [
    servers,
    projects,
    members,
    templates,
    alertRules,
    gitIntegrations,
    registries,
    domains,
  ] = await Promise.all([
    count(serverModel, { status: "active" }),
    count(projectModel),
    count(tenantMemberModel),
    count(templateModel),
    count(alertRuleModel),
    count(gitIntegrationModel),
    count(registryModel),
    count(domainModel),
  ]);
  return {
    servers,
    projects,
    members,
    templates,
    alertRules,
    gitIntegrations,
    registries,
    domains,
  };
}

/**
 * Plan & usage (PLAN §22): everyone in the workspace can look; only the
 * owner subscribes, changes plans or cancels.
 */
export default new Router("/api", function billing(router) {
  const $view = $plan.omit({ allowedTenants: true, createdAt: true }).extend({
    _id: z.string(),
  });

  const ownerOnly = (req: Request) => tenantOwner(req, "change its plan");

  router.get("/", function get() {
    const $return = z.object({
      plan: z.object({ _id: z.string().optional(), name: z.string() }),
      source: z.enum(["period", "free"]),
      limits: $planLimits,
      features: $planFeatures,
      period: $subscriptionPeriod.pick({
        periodStart: true,
        periodEnd: true,
        kind: true,
      }).optional(),
      subscription: $subscription.pick({
        status: true,
        autoRenew: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
        nextRenewalAttemptAt: true,
        lastError: true,
      }).extend({ nextPlan: z.string().optional() }).optional(),
      usage: z.record(z.string(), z.number()),
      overLimitSince: z.date().optional(),
      graceDays: z.number(),
      wallets: z.array(z.object({ currency: z.string(), balance: z.number() })),
      isOwner: z.boolean(),
      paymentsReady: z.boolean(),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant, user, owner } = await withTenant(req);
        const resolved = await entitlements.resolve(tenant._id);
        const [plan, period, sub, usage, counters, wallets, free] =
          await Promise
            .all([
              resolved.plan &&
              planModel.findOne({ _id: resolved.plan }, {
                projection: { name: 1 },
              }),
              billingService.currentPeriod(tenant._id),
              subscriptionModel.findOne({ tenant: tenant._id }),
              usageOf(tenant._id),
              tenantUsageModel.findOne({ tenant: tenant._id }, {
                projection: { overLimitSince: 1 },
              }),
              walletModel.find({ tenant: tenant._id }, {
                projection: { currency: 1, balance: 1 },
                limit: 10,
              }).toArray(),
              planModel.findOne({ isFree: true }, { projection: { name: 1 } }),
            ]);
        return Response.json({
          plan: plan
            ? { _id: plan._id, name: plan.name }
            : { name: free?.name ?? "Free" },
          source: resolved.source,
          // Periods paid before a limit existed: show its default.
          limits: { ...$planLimits.parse({}), ...resolved.limits },
          features: resolved.features,
          ...(period
            ? {
              period: {
                periodStart: period.periodStart,
                periodEnd: period.periodEnd,
                kind: period.kind,
              },
            }
            : {}),
          ...(sub
            ? {
              subscription: {
                status: sub.status,
                autoRenew: sub.autoRenew,
                cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                currentPeriodEnd: sub.currentPeriodEnd,
                nextRenewalAttemptAt: sub.nextRenewalAttemptAt,
                lastError: sub.lastError,
                nextPlan: sub.nextPlan,
              },
            }
            : {}),
          usage,
          overLimitSince: counters?.overLimitSince,
          graceDays: await readNumberSetting("PLAN_OVERLIMIT_GRACE_DAYS", 3),
          wallets: wallets.map((w) => ({
            currency: w.currency,
            balance: w.balance,
          })),
          isOwner: user._id.equals(owner._id),
          paymentsReady: !!await readTextSetting("PLATFORM_TENANT", ""),
        });
      },
    };
  });

  router.get("/plans", function plans() {
    return {
      shape: () => ({ return: z.array($view) }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        const list = await billingService.available(tenant._id);
        return Response.json(list.map(({ allowedTenants: _, ...p }) => p));
      },
    };
  });

  router.get("/periods", function periods() {
    const $return = z.array(
      $subscriptionPeriod.pick({
        periodStart: true,
        periodEnd: true,
        amount: true,
        currency: true,
        kind: true,
        note: true,
        ledgerReference: true,
      }).extend({ _id: z.string(), planName: z.string().optional() }),
    );

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        const periods = await subscriptionPeriodModel.find(
          { tenant: tenant._id },
          {
            sort: { periodStart: -1 },
            limit: 50,
            projection: { limitsSnapshot: 0, featuresSnapshot: 0 },
          },
        ).toArray();
        const plans = await planModel.find(
          { _id: { $in: periods.map((p) => p.plan) } },
          { projection: { name: 1 } },
        ).toArray();
        return Response.json(periods.map((p) => ({
          ...p,
          planName: plans.find((x) => x._id.equals(p.plan))?.name,
        })));
      },
    };
  });

  router.post("/subscribe", function subscribe() {
    const $body = z.object({ plan: $objectId });
    const $return = z.object({
      result: z.enum(["active", "scheduled", "resumed"]),
      at: z.date().optional().describe("When a scheduled change applies"),
    });

    return {
      shape: () => ({ body: $body, return: $return }),
      handler: async (req) => {
        const { plan } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await ownerOnly(req);
        return Response.json(
          await billingService.subscribe(tenant._id, user._id, plan),
        );
      },
    };
  });

  router.post("/cancel", function cancel() {
    return {
      shape: () => ({}),
      handler: async (req) => {
        const { tenant } = await ownerOnly(req);
        await billingService.cancel(tenant._id);
        return Response.json({ ok: true });
      },
    };
  });
}).group("Billing");
