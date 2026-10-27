import { type ClientSession, ObjectId, type WithId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { Logger } from "@/core/utils/logger.ts";
import { isDuplicateKeyError, mongodb } from "@/database.ts";
import {
  InsufficientBalanceError,
  TopupPendingError,
  Wallet,
} from "@/plugins/Huruf-Tech/thunder-core/lib/wallet.ts";
import type { PaymentService } from "@/lib/payments/payments.ts";
import { readNumberSetting, readTextSetting } from "@/lib/core/settings.ts";
import { notifyOwner } from "@/lib/billing/notify.ts";
import type {
  Entitlements,
  TEntitlements,
} from "@/lib/billing/entitlements.ts";
import { planModel, type TPlan } from "@/schemas/billing/plan.ts";
import {
  subscriptionModel,
  type TSubscription,
} from "@/schemas/billing/subscription.ts";
import {
  subscriptionPeriodModel,
  type TSubscriptionPeriod,
} from "@/schemas/billing/subscriptionPeriod.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";

const RETRY_MS = 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

const log = (text: string) => Logger.warn(`[billing] ${text}`);

/** Calendar months or years, in UTC. */
export const addInterval = (start: Date, interval: "month" | "year") => {
  const end = new Date(start);
  if (interval === "month") end.setUTCMonth(end.getUTCMonth() + 1);
  else end.setUTCFullYear(end.getUTCFullYear() + 1);
  return end;
};

/** Price per month, to tell an upgrade from a downgrade. */
const monthly = (plan: Pick<TPlan, "price">) =>
  plan.price.interval === "year" ? plan.price.amount / 12 : plan.price.amount;

const isInsufficient = (error: unknown) =>
  error instanceof InsufficientBalanceError;

/**
 * What a subscription pays for (PLAN §26.6 B): the tenant's workspace plan,
 * or one rental, known by its subscription (its server comes later).
 */
export type TSubject =
  | { kind: "workspace" }
  | { kind: "server"; subscription: ObjectId };

export const WORKSPACE: TSubject = { kind: "workspace" };

/**
 * What rentals add to a server subscription's renewal (PLAN §26.9),
 * implemented by `RentalService` so billing knows nothing of partitions.
 */
export type TRentalHooks = {
  /** The ended period's traffic beyond its allowance, charged with the renewal. */
  overage(
    sub: WithId<TSubscription>,
  ): Promise<{ gb: number; amount: number } | null>;
  /** After a paid renewal: resume a suspended partition, apply a scheduled size. */
  renewed(sub: WithId<TSubscription>, plan: WithId<TPlan>): Promise<void>;
  /** A renewal that couldn't be paid: suspend or release when due. */
  unpaid(sub: WithId<TSubscription>, now: Date): Promise<void>;
  /** Canceled at the period end: the partition goes. */
  ended(sub: WithId<TSubscription>): Promise<void>;
};

/**
 * The subscription document of a subject. Workspace subscriptions written
 * before PLAN §26 have no `kind` until `syncDeployIndexes` migrates them.
 */
const subjectFilter = (tenant: ObjectId, subject: TSubject) =>
  subject.kind === "workspace"
    ? { tenant, kind: { $ne: "server" as const } }
    : { _id: subject.subscription, tenant, kind: "server" as const };

/**
 * The unused part of a paid period, in cents (PLAN §26.6 B): what it cost
 * (before any credit it got itself) times the share of it still ahead.
 */
export const prorate = (
  period: Pick<
    TSubscriptionPeriod,
    "kind" | "amount" | "proratedCredit" | "periodStart" | "periodEnd"
  >,
  now: Date,
) => {
  if (period.kind !== "paid") return 0;
  const total = period.periodEnd.getTime() - period.periodStart.getTime();
  const left = period.periodEnd.getTime() - now.getTime();
  if (total <= 0 || left <= 0) return 0;
  const value = period.amount + (period.proratedCredit ?? 0);
  return Math.round(value * Math.min(1, left / total));
};

/** Emails the workspace owner that the plan couldn't renew (PLAN §22.3). */
const notifyPastDue = (tenant: ObjectId, plan: WithId<TPlan>) =>
  notifyOwner(tenant, {
    subject: `{workspace}: your ${plan.name} plan couldn't renew`,
    text:
      `We couldn't renew the ${plan.name} plan of {workspace}: the wallet doesn't have enough ${plan.price.currency.toUpperCase()}.\n\n` +
      `The tenant is on Free until it renews; nothing is deleted and your apps keep running. ` +
      `We try again every hour. On the Billing page you can add funds, check your card, ` +
      `or confirm the payment if your bank asked for it.`,
  });

/**
 * Every charge goes through here (PLAN §22.3): a wallet transfer and its
 * `subscriptionPeriods` entry are written in one transaction, and the
 * idempotency key makes a retried or concurrent charge happen once. Works per
 * subscription, so a workspace plan and rented servers (PLAN §26) share it.
 */
export class BillingService {
  constructor(
    private readonly entitlements: Entitlements,
    /** Tops up from the saved card before a charge (PLAN §25.5). */
    private readonly funds?: Pick<PaymentService, "fundNow" | "fundRenewal">,
    /** Rentals' part of a server renewal (PLAN §26.9); set once at startup. */
    public rentals?: TRentalHooks,
  ) {}

  /** Active public plans of a kind, plus private ones offered to this tenant. */
  available(tenant: ObjectId, kind: TSubject["kind"] = "workspace") {
    return planModel.find({
      ...this.planKind(kind),
      active: true,
      $or: [{ visibility: "public" }, { allowedTenants: tenant }],
    }, { sort: { sortOrder: 1, "price.amount": 1 }, limit: 50 }).toArray();
  }

  /** Plans written before PLAN §26 have no `kind`: they're workspace plans. */
  private planKind(kind: TSubject["kind"]) {
    return kind === "server"
      ? { kind: "server" as const }
      : { kind: { $ne: "server" as const } };
  }

  private async availablePlan(
    tenant: ObjectId,
    id: ObjectId,
    kind: TSubject["kind"],
  ) {
    const plan = await planModel.findOne({
      _id: id,
      ...this.planKind(kind),
      active: true,
      $or: [{ visibility: "public" }, { allowedTenants: tenant }],
    });
    if (!plan) throw Response.notFound("Plan not found");
    return plan;
  }

  /** The workspace period covering `now`: the plan the tenant is on. */
  currentPeriod(tenant: ObjectId, now = new Date()) {
    return subscriptionPeriodModel.findOne(
      {
        tenant,
        scope: { $ne: "server" },
        periodStart: { $lte: now },
        periodEnd: { $gt: now },
      },
      { sort: { periodEnd: -1 } },
    );
  }

  /** The period covering `now` for a subject. */
  private periodOf(
    tenant: ObjectId,
    subject: TSubject,
    sub: WithId<TSubscription> | null,
    now: Date,
  ) {
    if (subject.kind === "workspace") return this.currentPeriod(tenant, now);
    if (!sub) return Promise.resolve(null);
    return subscriptionPeriodModel.findOne(
      {
        subscription: sub._id,
        periodStart: { $lte: now },
        periodEnd: { $gt: now },
      },
      { sort: { periodEnd: -1 } },
    );
  }

  private async platformTenant() {
    const id = await readTextSetting("PLATFORM_TENANT", "");
    if (!id || !ObjectId.isValid(id)) {
      throw Response.badRequest("Payments aren't set up yet");
    }
    return new ObjectId(id);
  }

  /**
   * One paid period: the wallet charge and its log entry, in the caller's
   * transaction. `credit` (unused time of the replaced period) is taken off
   * the price; whatever it exceeds the price by goes back to the wallet.
   */
  private async chargePeriod(opts: {
    tenant: ObjectId;
    subscription: ObjectId;
    scope: TSubject["kind"];
    plan: WithId<TPlan>;
    start: Date;
    idempotencyKey: string;
    credit?: number;
    /** A rental's traffic overage, charged with this period (PLAN §26.9). */
    overage?: { gb: number; amount: number } | null;
    user?: ObjectId;
    session: ClientSession;
  }) {
    const { plan } = opts;
    const _id = new ObjectId();
    const end = addInterval(opts.start, plan.price.interval);
    const credit = Math.min(opts.credit ?? 0, plan.price.amount);
    const due = plan.price.amount - credit + (opts.overage?.amount ?? 0);
    const refund = (opts.credit ?? 0) - credit;
    const common = {
      currency: plan.price.currency,
      foreignRefType: "subscriptionPeriod",
      foreignRef: _id.toHexString(),
      purpose: "subscription",
      ...(opts.user ? { user: opts.user } : {}),
      databaseSession: opts.session,
    };
    const transfer = due > 0
      ? await Wallet.transfer({
        ...common,
        fromTenant: opts.tenant,
        toTenant: await this.platformTenant(),
        amount: due,
        idempotencyKey: opts.idempotencyKey,
        description: credit
          ? `${plan.name} plan (unused time credited)`
          : opts.overage
          ? `${plan.name} plan + ${opts.overage.gb} GB extra traffic`
          : `${plan.name} plan`,
      })
      : undefined;
    if (refund > 0) {
      await Wallet.transfer({
        ...common,
        fromTenant: await this.platformTenant(),
        toTenant: opts.tenant,
        amount: refund,
        // The customer paid this already; the platform's balance never blocks it.
        allowOverdraft: true,
        overdraftLimit: Number.MAX_SAFE_INTEGER,
        idempotencyKey: `${opts.idempotencyKey}:refund`,
        description: "Unused time of your previous plan",
      });
    }
    await subscriptionPeriodModel.insertOne({
      _id,
      tenant: opts.tenant,
      subscription: opts.subscription,
      scope: opts.scope,
      plan: plan._id,
      periodStart: opts.start,
      periodEnd: end,
      amount: due,
      currency: plan.price.currency,
      ...(credit ? { proratedCredit: credit } : {}),
      ...(transfer ? { ledgerReference: transfer.reference } : {}),
      limitsSnapshot: plan.limits,
      featuresSnapshot: plan.features,
      ...(plan.resources
        ? { resourcesSnapshot: plan.resources, usage: { trafficBytes: 0 } }
        : {}),
      ...(opts.overage ? { overage: opts.overage } : {}),
      kind: "paid",
      paidAt: opts.start,
      createdAt: new Date(),
    }, { session: opts.session });
    return end;
  }

  /**
   * What a change would cost now (PLAN §26.6 B): the new plan's price, the
   * credit for the current period's unused time, what's due and what goes back
   * to the wallet. `change: "now"` means it starts at once and is charged;
   * `scheduled` waits for the period end (downgrades) and costs nothing now.
   */
  async quote(
    tenant: ObjectId,
    planId: ObjectId,
    subject: TSubject = WORKSPACE,
    now = new Date(),
  ) {
    const plan = await this.availablePlan(tenant, planId, subject.kind);
    const sub = await subscriptionModel.findOne(subjectFilter(tenant, subject));
    const current = await this.periodOf(tenant, subject, sub, now);
    const currentPlan = current &&
      await planModel.findOne({ _id: current.plan }, {
        projection: { price: 1 },
      });
    const scheduled = plan.isFree ||
      !!(sub && current?.kind === "paid" && currentPlan &&
        monthly(plan) < monthly(currentPlan));
    const credit = scheduled || !current ? 0 : prorate(current, now);
    const price = plan.price.amount;
    return {
      plan,
      sub,
      current,
      change: scheduled ? "scheduled" as const : "now" as const,
      price,
      currency: plan.price.currency,
      credit: Math.min(credit, price),
      due: scheduled ? 0 : Math.max(0, price - credit),
      refund: Math.max(0, credit - price),
    };
  }

  /**
   * Subscribe or change plans (owner only, checked by the route). Upgrades and
   * new subscriptions start now with a full period, the unused time of the
   * period they replace credited (PLAN §26.6 B); downgrades and Free wait for
   * the period end.
   */
  async subscribe(
    tenant: ObjectId,
    user: ObjectId,
    planId: ObjectId,
    subject: TSubject = WORKSPACE,
  ) {
    const now = new Date();
    const { plan, sub, current, change, credit, due, refund } = await this
      .quote(tenant, planId, subject, now);

    if (current?.plan.equals(plan._id)) {
      if (sub?.cancelAtPeriodEnd || sub?.nextPlan) {
        await subscriptionModel.updateOne({ _id: sub._id }, {
          $set: {
            cancelAtPeriodEnd: false,
            autoRenew: true,
            updatedAt: new Date(),
          },
          $unset: { nextPlan: "" },
        });
        return { result: "resumed" as const };
      }
      throw Response.badRequest("You're on this plan already");
    }
    if (plan.isFree) {
      if (!current) throw Response.badRequest("You're on Free already");
      await this.cancel(tenant, subject);
      return { result: "scheduled" as const, at: current.periodEnd };
    }
    if (change === "scheduled" && sub && current) {
      await subscriptionModel.updateOne({ _id: sub._id }, {
        $set: {
          nextPlan: plan._id,
          cancelAtPeriodEnd: false,
          autoRenew: true,
          updatedAt: new Date(),
        },
      });
      return { result: "scheduled" as const, at: current.periodEnd };
    }

    const subscription = sub?._id ??
      (subject.kind === "server" ? subject.subscription : new ObjectId());
    // A double click (or a retry) on the same change charges once.
    const key = `sub:${subscription}:to:${plan._id}:from:${
      current?._id ?? "none"
    }`;
    // The card covers what the wallet is short of, outside the transaction.
    if (this.funds && due > 0) {
      const funded = await this.funds.fundNow({
        tenant,
        amount: due,
        currency: plan.price.currency,
        key: `fund:${key}`,
      });
      // The bank wants the owner: the browser confirms, then subscribes again.
      if (funded.status === "pending") {
        return {
          result: "pending" as const,
          topup: funded.topup,
          clientSecret: funded.clientSecret,
        };
      }
    }
    try {
      await mongodb.withSession((client) =>
        client.withTransaction(async (session) => {
          const end = await this.chargePeriod({
            tenant,
            subscription,
            scope: subject.kind,
            plan,
            start: now,
            idempotencyKey: key,
            credit: credit + refund,
            user,
            session,
          });
          // The period being replaced ends now, so the new one applies at once.
          if (current) {
            await subscriptionPeriodModel.updateOne({ _id: current._id }, {
              $set: { periodEnd: now },
            }, { session });
          }
          await subscriptionModel.updateOne({ _id: subscription }, {
            $set: {
              plan: plan._id,
              status: "active",
              autoRenew: true,
              cancelAtPeriodEnd: false,
              currentPeriodEnd: end,
              updatedAt: now,
            },
            $unset: { nextPlan: "", nextRenewalAttemptAt: "", lastError: "" },
            $setOnInsert: {
              tenant,
              kind: subject.kind,
              startedAt: now,
              createdBy: user,
            },
          }, { upsert: true, session });
        })
      );
    } catch (error) {
      if (isInsufficient(error)) {
        throw Response.badRequest(
          `Your wallet doesn't have enough ${plan.price.currency.toUpperCase()} for this plan`,
        );
      }
      if (isDuplicateKeyError(error)) {
        throw Response.badRequest("This change was already paid for");
      }
      throw error;
    }
    this.entitlements.invalidate(tenant);
    return { result: "active" as const };
  }

  /**
   * A requested rental approved (PLAN §26.9): its first month is charged now,
   * with the customer away. They funded the wallet when requesting; if it was
   * spent since, the saved card covers it (autoPay), else approval waits.
   */
  async activate(subscription: ObjectId, user: ObjectId) {
    const sub = await subscriptionModel.findOne({
      _id: subscription,
      kind: "server",
      status: "requested",
    });
    if (!sub) throw Response.badRequest("No requested rental with this id");
    const plan = await planModel.findOne({ _id: sub.plan });
    if (!plan) throw Response.notFound("Plan not found");
    const key = `sub:${sub._id}:first`;
    if (this.funds && plan.price.amount > 0) {
      const funded = await this.funds.fundRenewal({
        tenant: sub.tenant,
        amount: plan.price.amount,
        currency: plan.price.currency,
        key: `fund:${key}:${Math.floor(Date.now() / RETRY_MS)}`,
      });
      if (funded !== "funded") {
        throw Response.badRequest(
          "The customer's wallet is short and their card couldn't cover it: ask them to add funds",
        );
      }
    }
    const now = new Date();
    try {
      await mongodb.withSession((client) =>
        client.withTransaction(async (session) => {
          const end = await this.chargePeriod({
            tenant: sub.tenant,
            subscription: sub._id,
            scope: "server",
            plan,
            start: now,
            idempotencyKey: key,
            user,
            session,
          });
          await subscriptionModel.updateOne(
            { _id: sub._id, status: "requested" },
            {
              $set: {
                status: "active",
                currentPeriodEnd: end,
                startedAt: now,
                updatedAt: now,
              },
            },
            { session },
          );
        })
      );
    } catch (error) {
      if (isInsufficient(error)) {
        throw Response.badRequest(
          "The customer's wallet is short: ask them to add funds",
        );
      }
      throw error;
    }
  }

  /** Cancel at the period end; a workspace then falls back to Free. */
  async cancel(tenant: ObjectId, subject: TSubject = WORKSPACE) {
    const { matchedCount } = await subscriptionModel.updateOne(
      { ...subjectFilter(tenant, subject), status: { $ne: "canceled" } },
      {
        $set: {
          cancelAtPeriodEnd: true,
          autoRenew: false,
          updatedAt: new Date(),
        },
        $unset: { nextPlan: "" },
      },
    );
    if (!matchedCount) throw Response.badRequest("No active subscription");
  }

  /**
   * Lazy renewal (PLAN §22.3), on entitlement resolution: one indexed read
   * unless a period has ended, then each due subscription of the tenant (its
   * workspace plan and any rented servers) renews on its own.
   */
  async renewIfDue(tenant: ObjectId) {
    const now = new Date();
    const due = await subscriptionModel.find({
      tenant,
      // A suspended rental keeps trying, so paying resumes it (PLAN §26.9).
      status: { $in: ["active", "pastDue", "suspended"] },
      currentPeriodEnd: { $lte: now },
      // An admin's suspension waits for the admin, not a payment.
      "rental.held": { $exists: false },
      $or: [
        { nextRenewalAttemptAt: { $exists: false } },
        { nextRenewalAttemptAt: { $lte: now } },
      ],
    }, { limit: 20 }).toArray();
    for (const sub of due) await this.renew(sub, now);
  }

  /**
   * One subscription's renewal. The key is the ended period, so concurrent
   * attempts charge once; an empty wallet means `pastDue` (a workspace falls
   * back to Free), retried hourly.
   */
  private async renew(sub: WithId<TSubscription>, now: Date) {
    const { tenant } = sub;
    if (!sub.currentPeriodEnd) return;
    const ended = sub.currentPeriodEnd;
    const guard = { _id: sub._id, currentPeriodEnd: ended };

    const plan = !sub.cancelAtPeriodEnd && sub.autoRenew &&
      await planModel.findOne({ _id: sub.nextPlan ?? sub.plan, active: true });
    if (!plan || plan.isFree) {
      const { modifiedCount } = await subscriptionModel.updateOne(guard, {
        $set: { status: "canceled", updatedAt: now },
      });
      if (modifiedCount && sub.kind === "server") {
        await this.rentals?.ended(sub).catch((e) => log(`rental end: ${e}`));
      }
      this.entitlements.invalidate(tenant);
      return;
    }
    const overage = sub.kind === "server"
      ? await this.rentals?.overage(sub) ?? null
      : null;
    const amount = plan.price.amount + (overage?.amount ?? 0);

    try {
      // The card covers what the wallet is short of, before the transaction.
      // One key per hourly attempt: a declined card is retried next hour.
      if (this.funds && amount > 0) {
        const attempt = Math.floor(
          (now.getTime() - ended.getTime()) / RETRY_MS,
        );
        const funded = await this.funds.fundRenewal({
          tenant,
          amount,
          currency: plan.price.currency,
          key: `renew:${sub._id}:${ended.toISOString()}:${attempt}`,
        });
        // The bank is processing, or wants the owner: past due until it lands.
        if (funded === "pending") {
          throw new TopupPendingError(
            sub._id,
            "Waiting for the payment to be confirmed",
          );
        }
      }
      await mongodb.withSession((client) =>
        client.withTransaction(async (session) => {
          const end = await this.chargePeriod({
            tenant,
            subscription: sub._id,
            scope: sub.kind ?? "workspace",
            plan,
            start: now,
            idempotencyKey: `sub:${sub._id}:renew:${ended.toISOString()}`,
            overage,
            session,
          });
          const { modifiedCount } = await subscriptionModel.updateOne(guard, {
            $set: {
              plan: plan._id,
              status: "active",
              currentPeriodEnd: end,
              updatedAt: now,
            },
            $unset: {
              nextPlan: "",
              nextRenewalAttemptAt: "",
              lastError: "",
              pastDueSince: "",
            },
          }, { session });
          if (!modifiedCount) throw new Error("Renewed meanwhile");
        })
      );
      if (sub.kind === "server") {
        await this.rentals?.renewed(sub, plan).catch((e) =>
          log(`rental renewal: ${e}`)
        );
      }
    } catch (error) {
      if (
        isInsufficient(error) || error instanceof TopupPendingError ||
        (error as Error).message?.includes("Payments")
      ) {
        const retry = {
          nextRenewalAttemptAt: new Date(now.getTime() + RETRY_MS),
          lastError: String((error as Error).message).slice(0, 300),
          updatedAt: now,
        };
        // Only the attempt that turns it past due tells the owner; retries
        // stay quiet and keep the status (a suspended rental stays suspended).
        const { modifiedCount } = await subscriptionModel.updateOne(
          { ...guard, status: "active" },
          { $set: { ...retry, status: "pastDue", pastDueSince: now } },
        );
        if (modifiedCount) {
          notifyPastDue(tenant, plan).catch((e) => log(`notice: ${e}`));
        } else await subscriptionModel.updateOne(guard, { $set: retry });
        if (sub.kind === "server") {
          await this.rentals?.unpaid(
            { ...sub, pastDueSince: sub.pastDueSince ?? now },
            now,
          ).catch((e) => log(`rental unpaid: ${e}`));
        }
      } else if (
        !isDuplicateKeyError(error) &&
        (error as Error).message !== "Renewed meanwhile"
      ) {
        log(`renewal of ${sub._id} (${tenant}) failed: ${error}`);
      }
    }
    this.entitlements.invalidate(tenant);
  }

  /** Admin: a plan for free, for partners, trials or support cases (PLAN §22.4). */
  async grantComplimentary(opts: {
    tenant: ObjectId;
    plan: ObjectId;
    days: number;
    note: string;
    by: ObjectId;
  }) {
    const plan = await planModel.findOne({
      _id: opts.plan,
      ...this.planKind("workspace"),
    });
    if (!plan) throw Response.notFound("Plan not found");
    const now = new Date();
    const sub = await subscriptionModel.findOneAndUpdate(
      subjectFilter(opts.tenant, WORKSPACE),
      {
        $setOnInsert: {
          tenant: opts.tenant,
          kind: "workspace",
          plan: plan._id,
          status: "canceled",
          autoRenew: false,
          cancelAtPeriodEnd: false,
          startedAt: now,
          createdBy: opts.by,
          updatedAt: now,
        },
      },
      { upsert: true, returnDocument: "after", projection: { _id: 1 } },
    );
    await subscriptionPeriodModel.insertOne({
      tenant: opts.tenant,
      subscription: sub!._id,
      scope: "workspace",
      plan: plan._id,
      periodStart: now,
      periodEnd: new Date(now.getTime() + opts.days * DAY_MS),
      amount: 0,
      currency: plan.price.currency,
      limitsSnapshot: plan.limits,
      featuresSnapshot: plan.features,
      kind: "complimentary",
      note: opts.note,
      createdAt: now,
    });
    this.entitlements.invalidate(opts.tenant);
  }

  /**
   * Over-limit enforcement (PLAN §22.5): nothing is deleted; after the grace,
   * servers beyond the quota (newest first) poll slowly and get no deploys.
   * Rented servers don't count: admins approve each one (PLAN §26.6 D).
   * Runs with entitlement resolution, so at most once a minute per instance.
   */
  async enforceLimits(tenant: ObjectId, entitlements: TEntitlements) {
    const servers = await serverModel.find({
      tenant,
      status: "active",
      "provider.kind": { $ne: "rented" },
    }, {
      projection: { _id: 1 },
      sort: { _id: 1 },
      limit: 1_000,
    }).toArray();
    const allowed = entitlements.limits.servers;
    const usage = await tenantUsageModel.findOne({ tenant }, {
      projection: { overLimitSince: 1 },
    });

    if (servers.length <= allowed) {
      if (usage?.overLimitSince) {
        await tenantUsageModel.updateOne({ tenant }, {
          $unset: { overLimitSince: "" },
        });
      }
      await serverLeaseModel.updateMany({ tenant, throttled: true }, {
        $unset: { throttled: "" },
      });
      return;
    }
    const since = usage?.overLimitSince ?? new Date();
    if (!usage?.overLimitSince) {
      await tenantUsageModel.updateOne({ tenant }, {
        $set: { overLimitSince: since },
      }, { upsert: true });
    }
    const graceMs = await readNumberSetting("PLAN_OVERLIMIT_GRACE_DAYS", 3) *
      DAY_MS;
    if (Date.now() - since.getTime() < graceMs) return;
    const beyond = servers.slice(allowed).map((s) => s._id);
    await serverLeaseModel.updateMany({
      _id: { $in: beyond },
      throttled: { $ne: true },
    }, {
      $set: { throttled: true },
    });
    await serverLeaseModel.updateMany(
      { tenant, throttled: true, _id: { $nin: beyond } },
      { $unset: { throttled: "" } },
    );
  }
}
