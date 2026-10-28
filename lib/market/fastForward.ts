import type { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { Logger } from "@/core/utils/logger.ts";
import { readFlagSetting } from "@/lib/core/settings.ts";
import { billing, earnings } from "@/lib/services.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { earningModel } from "@/schemas/billing/market.ts";

const DAY_MS = 86_400_000;

/** The setting that turns the tool on; off unless set (test environments). */
export const FAST_FORWARD_SETTING = "ADMIN_FAST_FORWARD";

export const fastForwardEnabled = () => readFlagSetting(FAST_FORWARD_SETTING);

/**
 * A testing tool for admins: a subscription as if `days` had passed. Its
 * dates (periods, renewal, term, a waiting proposal or resize, its earnings'
 * holds) move into the past, then what runs when it's looked at runs: the
 * renewal when due, ended months maturing, held earnings released. Real
 * money moves as it would. Off unless `ADMIN_FAST_FORWARD` is set; each use
 * is counted on the subscription (`fastForwardDays`).
 */
export async function fastForward(id: ObjectId, days: number) {
  if (!await fastForwardEnabled()) {
    throw Response.forbidden(
      `Fast-forward is off: set ${FAST_FORWARD_SETTING} in the environment settings (test environments only)`,
    );
  }
  const sub = await subscriptionModel.findOne({ _id: id });
  if (!sub) throw Response.notFound("Subscription not found");
  const ms = days * DAY_MS;
  const back = (d?: Date) => d && new Date(d.getTime() - ms);
  const r = sub.rental;
  const set: Record<string, Date> = {};
  const shift = (field: string, d?: Date) => {
    if (d) set[field] = back(d)!;
  };
  shift("startedAt", sub.startedAt);
  shift("currentPeriodEnd", sub.currentPeriodEnd);
  shift("pastDueSince", sub.pastDueSince);
  if (r) {
    shift("rental.term.until", r.term?.until);
    shift("rental.endAt", r.endAt);
    shift("rental.suspendedAt", r.suspendedAt);
    shift("rental.pendingChange.requestedAt", r.pendingChange?.requestedAt);
    shift("rental.proposal.at", r.proposal?.at);
    shift("rental.proposal.expiresAt", r.proposal?.expiresAt);
  }
  await subscriptionModel.updateOne({ _id: id }, {
    $set: set,
    // A retry waiting an hour would hold the renewal back.
    $unset: { nextRenewalAttemptAt: "" },
    $inc: { fastForwardDays: days },
  });
  const minus = (field: string) => ({ $subtract: [`$${field}`, ms] });
  await subscriptionPeriodModel.updateMany({ subscription: id }, [
    {
      $set: {
        periodStart: minus("periodStart"),
        periodEnd: minus("periodEnd"),
      },
    },
  ]);
  await earningModel.updateMany({ subscription: id }, [
    {
      $set: {
        availableAt: minus("availableAt"),
        createdAt: minus("createdAt"),
      },
    },
  ]);
  Logger.warn(`[fast-forward] ${id} by ${days} days`);

  // What would run when it's next looked at, now.
  const moved = (await subscriptionModel.findOne({ _id: id }))!;
  if (moved.currentPeriodEnd && moved.currentPeriodEnd <= new Date()) {
    await billing.renewOne(moved);
  }
  await earnings.settleDue({ subscription: id });
  const owner = moved.rental?.owner;
  if (owner) await earnings.summary(owner);
  const after = (await subscriptionModel.findOne({ _id: id }))!;
  return {
    status: after.status,
    currentPeriodEnd: after.currentPeriodEnd,
    fastForwardDays: after.fastForwardDays ?? days,
  };
}
