import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * A machine owner's money (PLAN §30.7), as an append-only ledger of signed
 * cents. `earnings` is claimable once `availableAt` has passed; `security`
 * stays per machine until it leaves properly. Balances are sums; `key` makes
 * every write happen once.
 */
export const $earning = z.object({
  owner: $objectId.meta({ ref: "tenants" }),
  machine: $objectId.meta({ ref: "servers" }).optional(),
  bucket: z.enum(["earnings", "security"]),
  amount: z.number().int(),
  availableAt: z.date(),
  type: z.enum([
    "month", // a matured month's share
    "release", // security paid out (left properly, or above the cap)
    "forfeit", // security to customers (a broken term)
    "claim", // into the wallet
    "revert", // a claim back from the wallet
    "dispute", // paid to a customer
  ]),
  key: z.string(),
  period: $objectId.meta({ ref: "subscriptionPeriods" }).optional(),
  subscription: $objectId.optional(),
  /** Claims and reverts: the wallet transfer. */
  walletReference: z.string().optional(),
  note: z.string().max(300).optional(),
  createdAt: z.date(),
});
export type TEarning = z.output<typeof $earning>;
export const earningModel = mongodb.db().collection<TEarning>("earnings");

/**
 * Taking a claim back out of the wallet (PLAN §30.7) when the wallet moved
 * since: an admin decides, up to `max` (the claim minus what was charged since).
 */
export const $claimRevert = z.object({
  owner: $objectId.meta({ ref: "tenants" }),
  claim: $objectId.meta({ ref: "earnings" }),
  amount: z.number().int().min(1),
  max: z.number().int().min(0),
  status: z.enum(["pending", "approved", "rejected"]),
  requestedBy: $objectId.meta({ ref: "users" }),
  decided: z.object({
    by: $objectId.meta({ ref: "users" }),
    at: z.date(),
    amount: z.number().int().min(0),
    note: z.string().max(500).optional(),
  }).optional(),
  createdAt: z.date(),
});
export type TClaimRevert = z.output<typeof $claimRevert>;
export const claimRevertModel = mongodb.db().collection<TClaimRevert>(
  "claimReverts",
);

/**
 * A customer's dispute on a rental (PLAN §30.9): the machine's unreleased
 * money is frozen while it's open; measured evidence is kept with it.
 */
export const $dispute = z.object({
  subscription: $objectId,
  tenant: $objectId.meta({ ref: "tenants" }),
  owner: $objectId.meta({ ref: "tenants" }),
  machine: $objectId.meta({ ref: "servers" }),
  reason: z.string().min(1).max(2_000),
  status: z.enum(["open", "resolved"]),
  evidence: z.record(z.string(), z.unknown()),
  openedBy: $objectId.meta({ ref: "users" }),
  decision: z.object({
    refund: z.number().int().min(0),
    note: z.string().max(1_000).optional(),
    by: $objectId.meta({ ref: "users" }),
    at: z.date(),
  }).optional(),
  createdAt: z.date(),
});
export type TDispute = z.output<typeof $dispute>;
export const disputeModel = mongodb.db().collection<TDispute>("disputes");

/** A renter's rating of a machine (PLAN §30.10), one per rental, weighted by money paid. */
export const $machineRating = z.object({
  machine: $objectId.meta({ ref: "servers" }),
  subscription: $objectId,
  tenant: $objectId.meta({ ref: "tenants" }),
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  /** Cents the renter paid for it when rating. */
  weight: z.number().int().min(0),
  createdAt: z.date(),
});
export type TMachineRating = z.output<typeof $machineRating>;
export const machineRatingModel = mongodb.db().collection<TMachineRating>(
  "machineRatings",
);

/** Abuse reported on a machine or rental (PLAN §30.10), for admins. */
export const $abuseReport = z.object({
  machine: $objectId.meta({ ref: "servers" }).optional(),
  subscription: $objectId.optional(),
  tenant: $objectId.meta({ ref: "tenants" }),
  by: $objectId.meta({ ref: "users" }),
  text: z.string().min(1).max(2_000),
  status: z.enum(["open", "closed"]),
  createdAt: z.date(),
});
export type TAbuseReport = z.output<typeof $abuseReport>;
export const abuseReportModel = mongodb.db().collection<TAbuseReport>(
  "abuseReports",
);
