import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * Hot per-server document (PLAN §3.4): every poll does exactly one
 * findOneAndUpdate on it. Exists only for accepted servers.
 */
export const $serverLease = z.object({
  _id: $objectId.meta({ ref: "servers" }),
  tenant: $objectId.meta({ ref: "tenants" }),
  shard: z.number().int().min(0),
  status: z.enum(["active"]),
  aliveUntil: z.date(),
  /** Sweep-visible flag; `offlineSince` keeps the timestamp. */
  offline: z.boolean(),
  offlineSince: z.date().optional(),
  desiredVersion: z.number().int(),
  commandSeq: z.number().int(),
  deliveredSeq: z.number().int(),
  fastPollUntil: z.date().optional(),
  terminalUntil: z.date().optional(),
  /** Beyond the plan's server quota after the grace (PLAN §22.5): slow polls, no deploys. */
  throttled: z.boolean().optional(),
});

export type TServerLease = z.output<typeof $serverLease>;

export const serverLeaseModel = mongodb.db().collection<TServerLease>(
  "serverLeases",
);
