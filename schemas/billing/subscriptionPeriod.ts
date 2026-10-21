import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { $planFeatures, $planLimits } from "@/schemas/billing/plan.ts";

/** The payment log (PLAN §22.1). The entry covering `now` is the tenant's effective plan. */
export const $subscriptionPeriod = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  subscription: $objectId.meta({ ref: "subscriptions" }),
  plan: $objectId.meta({ ref: "plans" }),
  periodStart: z.date(),
  periodEnd: z.date(),
  amount: z.number().int().min(0),
  currency: z.string(),
  ledgerReference: z.string().optional(),
  limitsSnapshot: $planLimits,
  featuresSnapshot: $planFeatures,
  kind: z.enum(["paid", "complimentary"]),
  paidAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
});

export type TSubscriptionPeriod = z.output<typeof $subscriptionPeriod>;

export const subscriptionPeriodModel = mongodb.db().collection<
  TSubscriptionPeriod
>("subscriptionPeriods");
