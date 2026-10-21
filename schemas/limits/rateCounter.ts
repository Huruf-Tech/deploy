import z from "zod";
import { mongodb } from "@/database.ts";

/** Fixed-window rate counters (PLAN §20.3), removed by a TTL index on `expiresAt`. */
export const $rateCounter = z.object({
  _id: z.string(),
  count: z.number().int(),
  expiresAt: z.date(),
});

export type TRateCounter = z.output<typeof $rateCounter>;

export const rateCounterModel = mongodb.db().collection<TRateCounter>(
  "rateCounters",
);
