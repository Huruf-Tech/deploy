import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * A tenant's subscription (PLAN §22.1): what to renew and when. What a tenant
 * may use comes from its current `subscriptionPeriods` entry, else Free.
 */
export const $subscription = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  plan: $objectId.meta({ ref: "plans" }),
  status: z.enum(["active", "pastDue", "canceled"]),
  autoRenew: z.boolean(),
  cancelAtPeriodEnd: z.boolean(),
  /** A downgrade waiting for the period end. */
  nextPlan: $objectId.meta({ ref: "plans" }).optional(),
  currentPeriodEnd: z.date().optional(),
  nextRenewalAttemptAt: z.date().optional(),
  lastError: z.string().max(300).optional(),
  startedAt: z.date(),
  createdBy: $objectId.meta({ ref: "users" }),
  updatedAt: z.date(),
});

export type TSubscription = z.output<typeof $subscription>;

export const subscriptionModel = mongodb.db().collection<TSubscription>(
  "subscriptions",
);
