import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * What a subscription pays for (PLAN §26.6 B): the tenant's workspace plan
 * (one per tenant), or one rented server (one per server).
 */
export const $subscriptionKind = z.enum(["workspace", "server"]);

/**
 * A subscription (PLAN §22.1): what to renew and when. What a tenant may use
 * comes from its current workspace `subscriptionPeriods` entry, else Free.
 */
export const $subscription = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  kind: $subscriptionKind,
  /** `server` subscriptions: the rented server. */
  server: $objectId.meta({ ref: "servers" }).optional(),
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
export type TSubscriptionKind = z.output<typeof $subscriptionKind>;

export const subscriptionModel = mongodb.db().collection<TSubscription>(
  "subscriptions",
);
