import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import {
  $planFeatures,
  $planLimits,
  $planResources,
} from "@/schemas/billing/plan.ts";
import { $subscriptionKind } from "@/schemas/billing/subscription.ts";

/**
 * The payment log (PLAN §22.1). The workspace entry covering `now` is the
 * tenant's effective plan; server entries pay for rented servers (PLAN §26).
 */
export const $subscriptionPeriod = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  subscription: $objectId.meta({ ref: "subscriptions" }),
  /** The subscription's kind; absent on periods written before PLAN §26. */
  scope: $subscriptionKind.optional(),
  plan: $objectId.meta({ ref: "plans" }),
  periodStart: z.date(),
  periodEnd: z.date(),
  /** What was charged: the price minus `proratedCredit`, plus `overage`. */
  amount: z.number().int().min(0),
  currency: z.string(),
  /** Unused time of the replaced period, credited against this one (PLAN §26.6 B). */
  proratedCredit: z.number().int().min(0).optional(),
  ledgerReference: z.string().optional(),
  limitsSnapshot: $planLimits,
  featuresSnapshot: $planFeatures,
  /** Server periods: the size paid for. */
  resourcesSnapshot: $planResources.optional(),
  /** Server periods: the partition's traffic during the period (in + out). */
  usage: z.object({
    trafficBytes: z.number().min(0).optional(),
    /** A rented server's time offline in this period (PLAN §26.11). */
    downtimeMs: z.number().min(0).optional(),
  }).optional(),
  /** Charged with this period: the previous period's traffic beyond its allowance. */
  overage: z.object({ gb: z.number(), amount: z.number().int() }).optional(),
  /** Given back to the wallet by an admin; the period ended then (PLAN §26.9). */
  refunded: z.number().int().min(0).optional(),
  kind: z.enum(["paid", "complimentary"]),
  paidAt: z.date().optional(),
  /** Why a complimentary period was granted. */
  note: z.string().max(300).optional(),
  createdAt: z.date().default(() => new Date()),
});

export type TSubscriptionPeriod = z.output<typeof $subscriptionPeriod>;

export const subscriptionPeriodModel = mongodb.db().collection<
  TSubscriptionPeriod
>("subscriptionPeriods");
