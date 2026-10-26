import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { walletBalanceSchema, walletCurrencySchema } from "@/schemas/wallet.ts";

export enum TopupStatus {
  /**
   * Written before the gateway was called, so the charge outcome is unknown.
   * A row is never in this state by design — it is the state that makes a
   * charge recoverable if the process dies mid-call, and it is settleable.
   */
  Initiated = "initiated",
  /** The gateway accepted it and will confirm out of band (webhook). */
  Pending = "pending",
  /**
   * The gateway confirmed payment but the wallet has not been credited yet.
   * The customer's money is in; this row MUST eventually reach `completed`.
   * Settling can be retried, by a redelivered webhook or by hand.
   */
  Paid = "paid",
  /** Claimed by a settlement attempt — guards against duplicate webhooks. */
  Processing = "processing",
  /** Funds credited; any parked transfer was replayed. */
  Completed = "completed",
  /** The charge was declined or the fallback refused. Nothing was paid. */
  Failed = "failed",
}

/** States a settlement attempt is allowed to claim. */
export const SETTLEABLE_TOPUP_STATUSES = [
  TopupStatus.Initiated,
  TopupStatus.Pending,
  TopupStatus.Paid,
];

/**
 * How long a `processing` claim is trusted before another attempt may take it
 * over. A process can die between claiming a row and finishing it — a deploy,
 * a crash, a serverless timeout — and without this the row would hold its
 * claim forever in a state nothing can settle.
 *
 * Re-crediting is safe: `Wallet.execute` returns the existing ledger pair when
 * a transfer's idempotency key has already been used.
 */
export const TOPUP_CLAIM_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * The transfer that ran out of balance, stored so an asynchronous top-up can
 * resume it from a webhook long after the original request is gone.
 *
 * `reference` and `idempotencyKey` are persisted deliberately: the resumed
 * transfer reuses them, so a duplicated webhook cannot charge twice.
 */
export const walletTopupTransferSchema = z.object({
  fromTenant: $objectId,
  toTenant: $objectId,
  currency: walletCurrencySchema,
  amount: walletBalanceSchema,
  reference: z.string(),
  idempotencyKey: z.string(),
  user: $objectId.optional(),
  purpose: z.string().optional(),
  description: z.union([z.string(), z.record(z.string(), z.string())])
    .optional(),
  foreignRefType: z.string().optional(),
  foreignRef: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  ).optional(),
  allowOverdraft: z.boolean().optional(),
  overdraftLimit: walletBalanceSchema.optional(),
});

export const walletTopupSchema = z.object({
  status: z.enum(TopupStatus).meta({ canFilter: true, label: "Status" }),

  /** Tenant whose wallet gets credited. */
  tenant: $objectId,
  currency: walletCurrencySchema,

  /** Cents to credit once the gateway confirms. */
  amount: walletBalanceSchema.meta({ canFilter: true, label: "Amount" }),

  /** Free-form gateway name, e.g. "stripe". */
  provider: z.string().optional().meta({ canFilter: true, label: "Provider" }),

  /**
   * The gateway's own id for the charge (a Stripe PaymentIntent id, say).
   * Unique when set — this is what a webhook looks the top-up up by.
   */
  providerRef: z.string().optional().meta({
    canFilter: true,
    label: "Provider Ref",
  }),

  /**
   * Caller-supplied key that makes a repeat attempt reuse this row instead of
   * opening a second gateway charge. Uniquely indexed when set.
   */
  idempotencyKey: z.string().optional(),

  transfer: walletTopupTransferSchema.optional(),

  /** Reference of the credit transfer that funded the wallet. */
  topupReference: z.string().optional(),

  /** Reference of the original transfer, once it has been resumed. */
  resumedReference: z.string().optional(),

  error: z.string().optional(),

  createdAt: z.date().optional().default(() => new Date()).meta({
    canFilter: true,
    label: "Created At",
  }),
  updatedAt: z.date().optional().default(() => new Date()),
});

export const walletTopupModel = mongodb.db().collection<
  z.infer<typeof walletTopupSchema>
>("walletTopups");
