import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * A time a server was down (PLAN §29): its lease ran out at `from` and its
 * agent polled again at `to`. Written once, when it's back, so polls stay a
 * single write; a server still down is its lease's `aliveUntil` until now.
 * Kept 120 days (TTL), for uptime over the last 30 or 90.
 */
export const $serverOutage = z.object({
  server: $objectId.meta({ ref: "servers" }),
  tenant: $objectId.meta({ ref: "tenants" }),
  from: z.date(),
  to: z.date(),
  expiresAt: z.date(),
});

export type TServerOutage = z.output<typeof $serverOutage>;

export const serverOutageModel = mongodb.db().collection<TServerOutage>(
  "serverOutages",
);
