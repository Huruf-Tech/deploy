import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * What a subscription pays for (PLAN §26.6 B): the tenant's workspace plan
 * (one per tenant), or one rented server (one per server).
 */
export const $subscriptionKind = z.enum(["workspace", "server"]);

/**
 * A subscription (PLAN §22.1): what to renew and when. What a tenant may use
 * comes from its current workspace `subscriptionPeriods` entry, else Free.
 */
export const $subscription = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  kind: $subscriptionKind,
  /** `server` subscriptions: the rented server. */
  server: $objectId.meta({ ref: "servers" }).optional(),
  plan: $objectId.meta({ ref: "plans" }),
  /**
   * `requested`, `rejected`, `suspended` and `released` are rentals only
   * (PLAN §26.9): waiting for an admin, refused, stopped for non-payment,
   * deleted after the retention.
   */
  status: z.enum([
    "requested",
    "rejected",
    "active",
    "pastDue",
    "suspended",
    "released",
    "canceled",
  ]),
  autoRenew: z.boolean(),
  cancelAtPeriodEnd: z.boolean(),
  /** A downgrade waiting for the period end. */
  nextPlan: $objectId.meta({ ref: "plans" }).optional(),
  currentPeriodEnd: z.date().optional(),
  nextRenewalAttemptAt: z.date().optional(),
  lastError: z.string().max(300).optional(),
  /** When a renewal first failed; drives suspension and release (PLAN §26.9). */
  pastDueSince: z.date().optional(),
  /** `server` subscriptions: the rental (PLAN §26). */
  rental: z.object({
    class: $objectId.meta({ ref: "serverClasses" }),
    /** The machine and partition, once approved. */
    host: $objectId.meta({ ref: "servers" }).optional(),
    partition: z.string().optional(),
    /** The partition's size: the plan's resources plus the overhead. */
    size: z.object({
      cpus: z.number(),
      memMb: z.number().int(),
      diskGb: z.number().int(),
    }),
    /** Snapshot at approval: traffic beyond the period's allowance, per GB. */
    trafficRatePerGb: z.number().int().min(0),
    /** The partition's traffic counters when last read (a smaller value is a reset). */
    counters: z.object({ rx: z.number(), tx: z.number() }).optional(),
    /** A resize waiting for an admin. */
    pendingChange: z.object({
      plan: $objectId.meta({ ref: "plans" }),
      requestedAt: z.date(),
    }).optional(),
    rejectedReason: z.string().max(500).optional(),
    suspendedAt: z.date().optional(),
    /** Suspended by an admin: not renewed until resumed (the status it goes back to). */
    held: z.object({
      by: $objectId.meta({ ref: "users" }),
      at: z.date(),
      status: z.enum(["active", "pastDue"]),
      reason: z.string().max(500).optional(),
    }).optional(),
    /** Release warnings sent (days before release). */
    warned: z.array(z.number().int()).optional(),
    /** A move to another machine under way (PLAN §26.10). */
    move: z.object({
      to: $objectId.meta({ ref: "servers" }),
      /** The target's `partition.receive`: its result ends the move. */
      command: $objectId,
      startedAt: z.date(),
      by: $objectId.meta({ ref: "users" }),
    }).optional(),
    /** Using more disk than its size (what escapes its quota, PLAN §28). */
    overDisk: z.object({ since: z.date(), bytes: z.number() }).optional(),
    /** How the last move ended, for the admin. */
    lastMove: z.object({
      from: $objectId.meta({ ref: "servers" }),
      to: $objectId.meta({ ref: "servers" }),
      at: z.date(),
      error: z.string().max(1_000).optional(),
    }).optional(),
  }).optional(),
  startedAt: z.date(),
  createdBy: $objectId.meta({ ref: "users" }),
  updatedAt: z.date(),
});

export type TSubscription = z.output<typeof $subscription>;

/**
 * A workspace subscription, plan or period (PLAN §26): anything but `server`,
 * since those written before rentals have no kind.
 */
export const WORKSPACE_KIND = { $ne: "server" as const };

/** Rentals whose partition exists and is paid for (PLAN §26.9). */
export const LIVE_RENTAL = ["active", "pastDue", "suspended"] as const;
/** Rentals that run: a suspended one is stopped on purpose. */
export const RUNNING_RENTAL = ["active", "pastDue"] as const;
export type TSubscriptionKind = z.output<typeof $subscriptionKind>;

export const subscriptionModel = mongodb.db().collection<TSubscription>(
  "subscriptions",
);
