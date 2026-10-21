import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

export const walletCurrencySchema = z.string().min(3).toLowerCase();
export const walletBalanceSchema = z.number().int();

export const walletSchema = z.object({
  currency: walletCurrencySchema,
  balance: walletBalanceSchema.default(0),
  overdraftLimit: walletBalanceSchema.default(0),
  previousBalance: walletBalanceSchema.default(0),
  lastRef: z.string().optional(),
  user: $objectId,
  tenant: $objectId,
  negativeAt: z.date().nullish(),
  createdAt: z.date().optional().default(() => new Date()),
  updatedAt: z.date().optional().default(() => new Date()),
});

export const walletModel = mongodb.db().collection<
  z.infer<typeof walletSchema>
>("wallets");
