import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/** Payment gateways the Billing page can use (PLAN §25.3). */
export const $gatewayId = z.enum(["stripe"]);
export type TGatewayId = z.output<typeof $gatewayId>;

/**
 * A tenant's account at a payment gateway (PLAN §25.4): the gateway's
 * customer and whether short payments may charge the saved card.
 */
export const $billingAccount = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  gateway: $gatewayId,
  /** The gateway's customer id (a Stripe `cus_…`). */
  customerRef: z.string(),
  /** Charge the default card when a renewal or payment is short. */
  autoPay: z.boolean(),
  /** An off-session charge the bank wants the owner to confirm. */
  actionRequired: z.object({
    topup: $objectId,
    message: z.string().max(300),
    at: z.date(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TBillingAccount = z.output<typeof $billingAccount>;

export const billingAccountModel = mongodb.db().collection<TBillingAccount>(
  "billingAccounts",
);

/**
 * A saved card (PLAN §25.4). Only what the gateway tells us to show: never
 * the number or the CVC, which stay inside the gateway's own form.
 */
export const $paymentCard = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  gateway: $gatewayId,
  /** The gateway's payment method id (a Stripe `pm_…`). */
  providerRef: z.string(),
  brand: z.string(),
  last4: z.string().length(4),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int(),
  /** Identifies the physical card, so it is saved once per tenant. */
  fingerprint: z.string().optional(),
  isDefault: z.boolean(),
  createdAt: z.date(),
});

export type TPaymentCard = z.output<typeof $paymentCard>;

export const paymentCardModel = mongodb.db().collection<TPaymentCard>(
  "paymentCards",
);

/**
 * Gateway webhook events we have handled (PLAN §25.4): the unique `eventId`
 * makes a redelivered event a no-op. Refunds and disputes are kept for the
 * admin; everything else expires after 90 days.
 */
export const $paymentEvent = z.object({
  gateway: $gatewayId,
  eventId: z.string(),
  type: z.string(),
  tenant: $objectId.meta({ ref: "tenants" }).optional(),
  topup: $objectId.optional(),
  providerRef: z.string().optional(),
  /** Cents, for refunds and disputes. */
  amount: z.number().int().optional(),
  currency: z.string().optional(),
  processedAt: z.date(),
  expiresAt: z.date().optional(),
});

export type TPaymentEvent = z.output<typeof $paymentEvent>;

export const paymentEventModel = mongodb.db().collection<TPaymentEvent>(
  "paymentEvents",
);
