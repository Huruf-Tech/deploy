import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * Where a custom domain is (PLAN §14, D43): added → (user clicks Check) →
 * checking ownership and DNS → issuing a certificate → active.
 * `pending` waits for the user; `failed` names what went wrong.
 */
export const $domainStatus = z.enum([
  "pending",
  "checking",
  "issuing",
  "active",
  "failed",
]);

export const $domainChecks = z.object({
  /** `_huruf.<hostname>` TXT holds `huruf-verify=<token>`. */
  ownership: z.boolean(),
  /** The hostname resolves to the platform's ingress. */
  dns: z.boolean(),
  checkedAt: z.date(),
  /** What to fix, when a check failed. */
  detail: z.string().max(500).optional(),
});

export const $domain = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  project: $objectId.meta({ ref: "projects" }),
  hostname: z.string().max(253),
  /** Ownership proof the user puts in DNS; unique per domain record. */
  token: z.string(),
  status: $domainStatus,
  /** Set once ownership and DNS passed: no other tenant can verify it then. */
  verifiedAt: z.date().optional(),
  /** While `checking`: when to look again, and until when. */
  nextCheckAt: z.date().optional(),
  checkUntil: z.date().optional(),
  checks: $domainChecks.optional(),
  error: z.string().max(500).optional(),
  createdBy: $objectId.meta({ ref: "users" }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TDomain = z.output<typeof $domain>;

export const domainModel = mongodb.db().collection<TDomain>("domains");

/** One slot for the domain checker's piggybacked ticks (PLAN §3.4). */
export const domainJobSlotModel = mongodb.db().collection<
  { _id: number; nextRunAt: Date }
>("domainJobSlots");
