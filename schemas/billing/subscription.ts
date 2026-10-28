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
    /** The machine it was requested on and runs on (PLAN §30.5). */
    host: $objectId.meta({ ref: "servers" }).optional(),
    /** The machine's tenant: who accepts it and earns from it. */
    owner: $objectId.meta({ ref: "tenants" }).optional(),
    /** The whole machine (Dedicated, PLAN §29). */
    whole: z.boolean().optional(),
    /**
     * The term the customer committed to (PLAN §30.5): the owner keeps the
     * machine until `until` (set when accepted); the customer may cancel.
     */
    term: z.object({
      months: z.number().int().min(1).max(12),
      until: z.date().optional(),
    }).optional(),
    /** An EU consumer agreed it starts at once, waiving the withdrawal right. */
    waivedWithdrawalAt: z.date().optional(),
    /**
     * On a community machine (PLAN §30.4): when the renter accepted that its
     * owner can access their data and that they answer for its leak or loss,
     * and which version of that wording.
     */
    communityConsent: z.object({
      at: z.date(),
      version: z.string(),
    }).optional(),
    /** Auto-accept couldn't start it (why), so its owner decides. */
    autoAcceptError: z.string().max(500).optional(),
    /** The owner stops renting it out: it ends at this date (term and period kept). */
    endAt: z.date().optional(),
    /** Its machine left (removed, or down beyond the limit): ended unpaid. */
    lostAt: z.date().optional(),
    /** A move the owner proposed, waiting for the customer (PLAN §30.8). */
    proposal: z.object({
      to: $objectId.meta({ ref: "servers" }),
      at: z.date(),
      expiresAt: z.date(),
      /** The target's monthly price for this size, from the next renewal. */
      price: z.number().int().min(0),
      reason: z.string().max(500).optional(),
    }).optional(),
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
    /** The latest resize sent to its machine, to show while it applies. */
    resize: z.object({
      command: $objectId.meta({ ref: "agentCommands" }),
      at: z.date(),
    }).optional(),
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
      /** Agreed with the customer (PLAN §30.8): the money of the month is split. */
      agreed: z.boolean().optional(),
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
  /** Days an admin fast-forwarded it with the testing tool (`lib/market/fastForward.ts`). */
  fastForwardDays: z.number().optional(),
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
