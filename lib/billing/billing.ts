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
import { Mailer } from "@/plugins/Huruf-Tech/thunder-core/lib/mailer.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { userModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/user.ts";
import { readNumberSetting, readTextSetting } from "@/lib/core/settings.ts";
import type {
  Entitlements,
  TEntitlements,
} from "@/lib/billing/entitlements.ts";
import { planModel, type TPlan } from "@/schemas/billing/plan.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
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

/** Emails the workspace owner that the plan couldn't renew (PLAN §22.3). */
async function notifyPastDue(tenant: ObjectId, plan: WithId<TPlan>) {
  const doc = await tenantModel.findOne({ _id: tenant }, {
    projection: { name: 1, createdBy: 1 },
  });
  const owner = doc &&
    await userModel.findOne({ _id: doc.createdBy }, {
      projection: { email: 1 },
    });
  if (!owner?.email) return;
  await Mailer.send({
    to: owner.email,
    subject: `${doc!.name}: your ${plan.name} plan couldn't renew`,
    text:
      `We couldn't renew the ${plan.name} plan of ${
        doc!.name
      }: the wallet doesn't have enough ${plan.price.currency.toUpperCase()}.\n\n` +
      `The tenant is on Free until it renews; nothing is deleted and your apps keep running. ` +
      `We try again every hour. On the Billing page you can add funds, check your card, ` +
      `or confirm the payment if your bank asked for it.`,
  });
}

/**
 * Every charge goes through here (PLAN §22.3): a wallet transfer and its
 * `subscriptionPeriods` entry are written in one transaction, and the
 * idempotency key makes a retried or concurrent charge happen once.
 * ponytail: plan periods only; usage meters (§24) get their own charge method here.
 */
export class BillingService {
  constructor(
    private readonly entitlements: Entitlements,
    /** Tops up from the saved card before a charge (PLAN §25.5). */
    private readonly funds?: Pick<PaymentService, "fundNow" | "fundRenewal">,
  ) {}

  /** Active public plans, plus private ones offered to this tenant. */
  available(tenant: ObjectId) {
    return planModel.find({
      active: true,
      $or: [{ visibility: "public" }, { allowedTenants: tenant }],
    }, { sort: { sortOrder: 1, "price.amount": 1 }, limit: 50 }).toArray();
  }

  private async availablePlan(tenant: ObjectId, id: ObjectId) {
    const plan = await planModel.findOne({
      _id: id,
      active: true,
      $or: [{ visibility: "public" }, { allowedTenants: tenant }],
    });
    if (!plan) throw Response.notFound("Plan not found");
    return plan;
  }

  /** The period covering `now`: what the tenant is on. */
  currentPeriod(tenant: ObjectId, now = new Date()) {
    return subscriptionPeriodModel.findOne(
      { tenant, periodStart: { $lte: now }, periodEnd: { $gt: now } },
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

  /** One paid period: the wallet charge and its log entry, in the caller's transaction. */
  private async chargePeriod(opts: {
    tenant: ObjectId;
    subscription: ObjectId;
    plan: WithId<TPlan>;
    start: Date;
    idempotencyKey: string;
    user?: ObjectId;
    session: ClientSession;
  }) {
    const { plan } = opts;
    const _id = new ObjectId();
    const end = addInterval(opts.start, plan.price.interval);
    const transfer = plan.price.amount > 0
      ? await Wallet.transfer({
        fromTenant: opts.tenant,
        toTenant: await this.platformTenant(),
        amount: plan.price.amount,
        currency: plan.price.currency,
        idempotencyKey: opts.idempotencyKey,
        foreignRefType: "subscriptionPeriod",
        foreignRef: _id.toHexString(),
        purpose: "subscription",
        description: `${plan.name} plan`,
        ...(opts.user ? { user: opts.user } : {}),
        databaseSession: opts.session,
      })
      : undefined;
    await subscriptionPeriodModel.insertOne({
      _id,
      tenant: opts.tenant,
      subscription: opts.subscription,
      plan: plan._id,
      periodStart: opts.start,
      periodEnd: end,
      amount: plan.price.amount,
      currency: plan.price.currency,
      ...(transfer ? { ledgerReference: transfer.reference } : {}),
      limitsSnapshot: plan.limits,
      featuresSnapshot: plan.features,
      kind: "paid",
      paidAt: opts.start,
      createdAt: new Date(),
    }, { session: opts.session });
    return end;
  }

  /**
   * Subscribe or change plans (owner only, checked by the route). Upgrades and
   * new subscriptions start now with a full period (no proration); downgrades
   * and Free wait for the period end.
   */
  async subscribe(tenant: ObjectId, user: ObjectId, planId: ObjectId) {
    const plan = await this.availablePlan(tenant, planId);
    const [sub, current] = await Promise.all([
      subscriptionModel.findOne({ tenant }),
      this.currentPeriod(tenant),
    ]);

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
      await this.cancel(tenant);
      return { result: "scheduled" as const, at: current.periodEnd };
    }
    const currentPlan = current &&
      await planModel.findOne({ _id: current.plan }, {
        projection: { price: 1 },
      });
    if (
      sub && current?.kind === "paid" && currentPlan &&
      monthly(plan) < monthly(currentPlan)
    ) {
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

    const now = new Date();
    const subscription = sub?._id ?? new ObjectId();
    // A double click (or a retry) on the same change charges once.
    const key = `sub:${subscription}:to:${plan._id}:from:${
      current?._id ?? "none"
    }`;
    // The card covers what the wallet is short of, outside the transaction.
    if (this.funds && plan.price.amount > 0) {
      const funded = await this.funds.fundNow({
        tenant,
        amount: plan.price.amount,
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
            plan,
            start: now,
            idempotencyKey: key,
            user,
            session,
          });
          // The period being replaced ends now, so the new one applies at once.
          if (current) {
            await subscriptionPeriodModel.updateOne({ _id: current._id }, {
              $set: { periodEnd: now },
            }, { session });
          }
          await subscriptionModel.updateOne({ tenant }, {
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
              _id: subscription,
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

  /** Cancel at the period end; the tenant then falls back to Free. */
  async cancel(tenant: ObjectId) {
    const { matchedCount } = await subscriptionModel.updateOne(
      { tenant, status: { $ne: "canceled" } },
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
   * unless a period has ended. The key is the ended period, so concurrent
   * attempts charge once; an empty wallet means `pastDue` and Free, retried hourly.
   */
  async renewIfDue(tenant: ObjectId) {
    const now = new Date();
    const sub = await subscriptionModel.findOne({
      tenant,
      status: { $in: ["active", "pastDue"] },
      currentPeriodEnd: { $lte: now },
      $or: [
        { nextRenewalAttemptAt: { $exists: false } },
        { nextRenewalAttemptAt: { $lte: now } },
      ],
    });
    if (!sub?.currentPeriodEnd) return;
    const ended = sub.currentPeriodEnd;
    const guard = { _id: sub._id, currentPeriodEnd: ended };

    const plan = !sub.cancelAtPeriodEnd && sub.autoRenew &&
      await planModel.findOne({ _id: sub.nextPlan ?? sub.plan, active: true });
    if (!plan || plan.isFree) {
      await subscriptionModel.updateOne(guard, {
        $set: { status: "canceled", updatedAt: now },
      });
      this.entitlements.invalidate(tenant);
      return;
    }

    try {
      // The card covers what the wallet is short of, before the transaction.
      // One key per hourly attempt: a declined card is retried next hour.
      if (this.funds && plan.price.amount > 0) {
        const attempt = Math.floor(
          (now.getTime() - ended.getTime()) / RETRY_MS,
        );
        const funded = await this.funds.fundRenewal({
          tenant,
          amount: plan.price.amount,
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
            plan,
            start: now,
            idempotencyKey: `sub:${sub._id}:renew:${ended.toISOString()}`,
            session,
          });
          const { modifiedCount } = await subscriptionModel.updateOne(guard, {
            $set: {
              plan: plan._id,
              status: "active",
              currentPeriodEnd: end,
              updatedAt: now,
            },
            $unset: { nextPlan: "", nextRenewalAttemptAt: "", lastError: "" },
          }, { session });
          if (!modifiedCount) throw new Error("Renewed meanwhile");
        })
      );
    } catch (error) {
      if (
        isInsufficient(error) || error instanceof TopupPendingError ||
        (error as Error).message?.includes("Payments")
      ) {
        const pastDue = {
          status: "pastDue" as const,
          nextRenewalAttemptAt: new Date(now.getTime() + RETRY_MS),
          lastError: String((error as Error).message).slice(0, 300),
          updatedAt: now,
        };
        // Only the attempt that turns it past due tells the owner; retries stay quiet.
        const { modifiedCount } = await subscriptionModel.updateOne(
          { ...guard, status: "active" },
          { $set: pastDue },
        );
        if (modifiedCount) {
          notifyPastDue(tenant, plan).catch((e) => log(`notice: ${e}`));
        } else await subscriptionModel.updateOne(guard, { $set: pastDue });
      } else if (
        !isDuplicateKeyError(error) &&
        (error as Error).message !== "Renewed meanwhile"
      ) {
        log(`renewal of ${tenant} failed: ${error}`);
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
    const plan = await planModel.findOne({ _id: opts.plan });
    if (!plan) throw Response.notFound("Plan not found");
    const now = new Date();
    const sub = await subscriptionModel.findOneAndUpdate(
      { tenant: opts.tenant },
      {
        $setOnInsert: {
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
   * Runs with entitlement resolution, so at most once a minute per instance.
   */
  async enforceLimits(tenant: ObjectId, entitlements: TEntitlements) {
    const servers = await serverModel.find({ tenant, status: "active" }, {
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
