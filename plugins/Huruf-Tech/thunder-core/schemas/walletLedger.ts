import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { walletBalanceSchema, walletCurrencySchema } from "@/schemas/wallet.ts";

export enum TransactionType {
  Credit = "credit",
  Debit = "debit",
}

export const walletLedgerSchema = z.object({
  // 1. Type Filter
  type: z.enum(TransactionType).meta({
    canFilter: true,
    label: "Type",
  }),

  description: z
    .union([z.string(), z.record(z.string(), z.string())])
    .optional(),

  purpose: z.string().optional(),

  foreignRefType: z.string().optional(),
  foreignRef: z.string().optional(),

  // 2. Reference Filter
  reference: z.string().meta({
    canFilter: true,
    label: "Reference",
  }),

  isRefund: z.boolean().optional(),
  refundedReference: z
    .string()
    .optional()
    .describe("Reference to the original transaction if this is a refund"),
  isRefunded: z.boolean().optional(),
  refundReference: z
    .string()
    .optional()
    .describe(
      "Reference to the refund transaction if this transaction has been refunded",
    ),
  idempotencyKey: z.string(),

  currency: walletCurrencySchema,

  // 3. Amount Filter
  amount: walletBalanceSchema.meta({
    canFilter: true,
    label: "Amount",
  }),

  previousBalance: walletBalanceSchema,
  tenant: $objectId,
  wallet: $objectId,
  oppositeTenant: $objectId,
  oppositeWallet: $objectId,
  executorUser: $objectId.optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),

  // 4. Created At Filter
  createdAt: z
    .date()
    .optional()
    .default(() => new Date())
    .meta({
      canFilter: true,
      label: "Created At",
    }),

  // 5. Updated At Filter
  updatedAt: z
    .date()
    .optional()
    .default(() => new Date())
    .meta({
      canFilter: true,
      label: "Updated At",
    }),
});

export const walletLedgerModel = mongodb
  .db()
  .collection<z.infer<typeof walletLedgerSchema>>("walletLedgers");