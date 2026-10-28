import { type ClientSession, ObjectId, type WithId } from "mongodb";
import { isDuplicateKeyError as isDuplicate, mongodb } from "@/database.ts";
import { Response } from "@/core/http/response.ts";
import { Logger } from "@/core/utils/logger.ts";
import { Wallet } from "@/plugins/Huruf-Tech/thunder-core/lib/wallet.ts";
import { walletLedgerModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/walletLedger.ts";
import { platformTenant, platformTenantId } from "@/lib/billing/platform.ts";
import { notifyOwner } from "@/lib/billing/notify.ts";
import type { Entitlements } from "@/lib/billing/entitlements.ts";
import {
  hourlyOf,
  monthlyOf,
  refundFor,
  securityFill,
  shareOf,
} from "@/lib/market/pricing.ts";
import { planModel } from "@/schemas/billing/plan.ts";
import {
  LIVE_RENTAL,
  RUNNING_RENTAL,
  subscriptionModel,
  type TSubscription,
} from "@/schemas/billing/subscription.ts";
import {
  subscriptionPeriodModel,
  type TSubscriptionPeriod,
} from "@/schemas/billing/subscriptionPeriod.ts";
import {
  claimRevertModel,
  disputeModel,
  earningModel,
  type TEarning,
} from "@/schemas/billing/market.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";

const DAY_MS = 86_400_000;
/** Released earnings wait this long after a month ends: downtime and disputes (PLAN §30.7). */
export const HOLD_MS = 14 * DAY_MS;
/** Down longer than this in a month, a machine has left (PLAN §30.6). */
export const LEAVE_MS = 72 * 3_600_000;

const log = (text: string) => Logger.warn(`[earnings] ${text}`);

type TPeriod = WithId<TSubscriptionPeriod>;

/** What the platform pays out of what it holds: its balance never blocks it. */
const fromPlatform = async (opts: {
  to: ObjectId;
  amount: number;
  key: string;
  description: string;
  session: ClientSession;
  user?: ObjectId;
}) =>
  await Wallet.transfer({
    fromTenant: await platformTenant(),
    toTenant: opts.to,
    amount: opts.amount,
    currency: "usd",
    allowOverdraft: true,
    overdraftLimit: Number.MAX_SAFE_INTEGER,
    idempotencyKey: opts.key,
    description: opts.description,
    purpose: "earnings",
    ...(opts.user ? { user: opts.user } : {}),
    databaseSession: opts.session,
  });

const sum = (rows: Pick<TEarning, "amount">[]) =>
  rows.reduce((a, r) => a + r.amount, 0);

/**
 * Machine owners' money (PLAN §30.7). A rental's month is charged into the
 * platform's wallet (escrow); when it ends it matures here: downtime goes
 * back to the customer by the hour, Huruf takes the owner's plan commission,
 * and the owner's share fills the machine's security (half at most, up to
 * its cap) or becomes earnings 14 days later. Earnings are claimed into the
 * wallet (spendable, never cashed out) or, later, paid out.
 */
export class EarningsService {
  constructor(private readonly entitlements: Entitlements) {}

  /** The owner's commission, from their workspace plan (default 20 %). */
  async commissionOf(owner: ObjectId) {
    const { plan } = await this.entitlements.resolve(owner);
    const doc = plan &&
      await planModel.findOne({ _id: plan }, { projection: { commission: 1 } });
    return doc?.commission ?? 20;
  }

  /**
   * What a market rental's period records when charged: who earns it, at
   * what commission. Nothing for the platform's own machines.
   */
  async periodFields(sub: WithId<TSubscription>) {
    const owner = sub.rental?.owner;
    const machine = sub.rental?.host;
    if (!owner || !machine) return {};
    if (owner.equals(await platformTenantId() ?? new ObjectId())) return {};
    return {
      market: { owner, machine, commission: await this.commissionOf(owner) },
    };
  }

  /**
   * A rented server's downtime in a period (PLAN §30.6): what's recorded,
   * plus an outage still going on, up to the period's end.
   */
  async downtimeOf(
    period: Pick<TPeriod, "periodStart" | "periodEnd" | "usage">,
    server?: ObjectId,
    now = new Date(),
  ) {
    let down = period.usage?.downtimeMs ?? 0;
    const lease = server &&
      await serverLeaseModel.findOne({ _id: server }, {
        projection: { aliveUntil: 1 },
      });
    if (lease && lease.aliveUntil < period.periodEnd) {
      const from = Math.max(
        lease.aliveUntil.getTime(),
        period.periodStart.getTime(),
      );
      const to = Math.min(now.getTime(), period.periodEnd.getTime());
      down += Math.max(0, to - from);
    }
    return down;
  }

  /**
   * A machine's security now, and its cap (PLAN §30.7): one month of its
   * whole price, what renters would pay for all of it.
   */
  async securityOf(machine: ObjectId) {
    const [rows, doc, live] = await Promise.all([
      earningModel.find({ machine, bucket: "security" }, {
        projection: { amount: 1 },
      }).toArray(),
      serverModel.findOne({ _id: machine }, { projection: { pool: 1 } }),
      subscriptionModel.find({
        kind: "server",
        "rental.host": machine,
        status: { $in: [...LIVE_RENTAL] },
      }, { projection: { plan: 1 } }).toArray(),
    ]);
    const prices = doc?.pool?.rent?.prices;
    const all = doc?.pool?.allocatable;
    const whole = prices && all
      ? monthlyOf(hourlyOf(
        prices,
        {
          vcpu: all.cpus,
          memMb: all.memMb,
          diskGb: all.diskGb,
        },
        0,
        true,
      ))
      : 0;
    const plans = await planModel.find(
      { _id: { $in: live.map((s) => s.plan) } },
      { projection: { price: 1 } },
    ).toArray();
    // Never below what its rentals pay a month: lowering the price can't free it.
    const rented = live.reduce(
      (a, s) =>
        a + (plans.find((p) => p._id.equals(s.plan))?.price.amount ?? 0),
      0,
    );
    return { security: sum(rows), cap: Math.max(whole, rented) };
  }

  private async frozen(machine: ObjectId) {
    return !!await disputeModel.countDocuments(
      { machine, status: "open" },
      { limit: 1 },
    );
  }

  /**
   * One ended period matures (PLAN §30.6, §30.7), once. Downtime is refunded
   * to the customer; a machine down beyond the limit earns nothing that month
   * and, inside the committed term, forfeits its security to its customers.
   */
  async settle(periodId: ObjectId, now = new Date()) {
    const period = await subscriptionPeriodModel.findOne({
      _id: periodId,
      settled: { $exists: false },
      periodEnd: { $lte: now },
    });
    if (!period || period.kind !== "paid" || !period.resourcesSnapshot) return;
    const sub = await subscriptionModel.findOne({ _id: period.subscription });
    if (!sub?.rental) return;
    const refunded = period.refunded !== undefined;
    // A rental stopped on purpose (an admin's hold) isn't down.
    const running =
      (RUNNING_RENTAL as readonly string[]).includes(sub.status) ||
      !!sub.rental.lostAt;
    const downtimeMs = refunded
      ? 0
      : await this.downtimeOf(period, running ? sub.server : undefined, now);
    const price = period.amount + (period.proratedCredit ?? 0) -
      (period.overage?.amount ?? 0);
    const refund = Math.min(period.amount, refundFor(price, downtimeMs));
    const net = refunded ? 0 : period.amount - refund;
    const left = !refunded &&
      (downtimeMs > LEAVE_MS ||
        (!!sub.rental.lostAt && sub.rental.lostAt <= period.periodEnd));
    const market = period.market;

    // Who earns what: the machine's owner, and after an agreed move the
    // target's owner for its days (the proposer pays any gap, PLAN §30.8).
    const parts: {
      owner: ObjectId;
      machine: ObjectId;
      net: number;
      c: number;
    }[] = [];
    if (market && !left) {
      const target = market.split;
      if (target) {
        parts.push({
          owner: target.owner,
          machine: target.machine,
          net: target.amount,
          c: target.commission,
        });
      }
      parts.push({
        owner: market.owner,
        machine: market.machine,
        net: net - (target ? target.amount : 0),
        c: market.commission,
      });
    }
    const shares = await Promise.all(parts.map(async (p) => {
      const { commission, share } = p.net >= 0
        ? shareOf(p.net, p.c)
        : { commission: 0, share: p.net };
      const { security, cap } = share > 0
        ? await this.securityOf(p.machine)
        : { security: 0, cap: 0 };
      return {
        ...p,
        commission,
        share,
        toSecurity: securityFill(share, security, cap),
      };
    }));
    const commission = market && left
      ? net
      : shares.reduce((a, s) => a + s.commission, 0);

    await mongodb.withSession((client) =>
      client.withTransaction(async (session) => {
        const { modifiedCount } = await subscriptionPeriodModel.updateOne(
          { _id: period._id, settled: { $exists: false } },
          {
            $set: {
              settled: {
                at: now,
                downtimeMs,
                refund,
                commission,
                share: shares.reduce((a, s) => a + s.share, 0),
                toSecurity: shares.reduce((a, s) => a + s.toSecurity, 0),
                ...(left ? { left: true } : {}),
              },
            },
          },
          { session },
        );
        if (!modifiedCount) throw new Settled();
        if (refund > 0) {
          await fromPlatform({
            to: period.tenant,
            amount: refund,
            key: `downtime:${period._id}`,
            description: `Downtime refund (${
              Math.round(downtimeMs / 60_000)
            } min)`,
            session,
          });
        }
        const rows: TEarning[] = [];
        for (const s of shares) {
          const base = {
            owner: s.owner,
            machine: s.machine,
            period: period._id,
            subscription: sub._id,
            createdAt: now,
          };
          if (s.toSecurity > 0) {
            rows.push({
              ...base,
              bucket: "security",
              amount: s.toSecurity,
              availableAt: now,
              type: "month",
              key: `month:${period._id}:${s.machine}:security`,
            });
          }
          if (s.share - s.toSecurity !== 0) {
            rows.push({
              ...base,
              bucket: "earnings",
              amount: s.share - s.toSecurity,
              availableAt: s.share > 0
                ? new Date(period.periodEnd.getTime() + HOLD_MS)
                : now,
              type: "month",
              key: `month:${period._id}:${s.machine}`,
            });
          }
        }
        if (rows.length) await earningModel.insertMany(rows, { session });
      })
    ).catch((error) => {
      if (!(error instanceof Settled)) throw error;
    });

    if (left && market) {
      const term = sub.rental.term?.until;
      if (term && term > period.periodStart) {
        await this.forfeit(market.machine, market.owner, now).catch((e) =>
          log(`forfeit ${market.machine}: ${e}`)
        );
      }
    }
  }

  /** Every ended, unsettled period matching `filter` (a few at a time). */
  async settleDue(filter: object, now = new Date()) {
    const due = await subscriptionPeriodModel.find({
      scope: "server",
      kind: "paid",
      periodEnd: { $lte: now },
      settled: { $exists: false },
      ...filter,
    }, { projection: { _id: 1 }, limit: 50, sort: { periodEnd: 1 } })
      .toArray();
    for (const p of due) {
      await this.settle(p._id, now).catch((e) => log(`settle ${p._id}: ${e}`));
    }
  }

  /**
   * A machine broke its term (PLAN §30.6): its whole security goes to its
   * customers, in proportion to what they pay a month.
   */
  async forfeit(machine: ObjectId, owner: ObjectId, now = new Date()) {
    const { security } = await this.securityOf(machine);
    if (security <= 0) return;
    const subs = await subscriptionModel.find({
      kind: "server",
      "rental.host": machine,
      $or: [
        { status: { $in: [...LIVE_RENTAL] } },
        { "rental.lostAt": { $gte: new Date(now.getTime() - 40 * DAY_MS) } },
      ],
    }, { projection: { tenant: 1, plan: 1 } }).toArray();
    const plans = await planModel.find(
      { _id: { $in: subs.map((s) => s.plan) } },
      { projection: { price: 1 } },
    ).toArray();
    const weights = subs.map((s) =>
      plans.find((p) => p._id.equals(s.plan))?.price.amount ?? 0
    );
    const total = weights.reduce((a, w) => a + w, 0);
    if (!total) return;
    const key = `forfeit:${machine}:${now.toISOString().slice(0, 10)}`;
    await mongodb.withSession((client) =>
      client.withTransaction(async (session) => {
        let given = 0;
        for (const [i, s] of subs.entries()) {
          const amount = i === subs.length - 1
            ? security - given
            : Math.floor(security * weights[i] / total);
          given += amount;
          if (amount <= 0) continue;
          await fromPlatform({
            to: s.tenant,
            amount,
            key: `${key}:${s._id}`,
            description: "Compensation: the machine left before your term",
            session,
          });
        }
        await earningModel.insertOne({
          owner,
          machine,
          bucket: "security",
          amount: -security,
          availableAt: now,
          type: "forfeit",
          key,
          createdAt: now,
        }, { session });
      })
    ).catch((error) => {
      if (!isDuplicate(error)) throw error;
    });
    for (const s of subs) {
      notifyOwner(s.tenant, {
        subject: "{workspace}: compensation for your rented server",
        text:
          "The machine your rented server ran on left before the term you agreed. " +
          "Its owner's security was added to your wallet as compensation.",
      }).catch((e) => log(`forfeit notice: ${e}`));
    }
  }

  /**
   * Security over its cap, or of a machine that left properly (no rental
   * on it, not for rent or removed), becomes earnings (PLAN §30.7); a
   * machine with an open dispute keeps it.
   */
  async releaseSecurity(owner: ObjectId, now = new Date()) {
    const machines = await earningModel.aggregate<
      { _id: ObjectId; amount: number }
    >([
      { $match: { owner, bucket: "security" } },
      { $group: { _id: "$machine", amount: { $sum: "$amount" } } },
      { $match: { amount: { $gt: 0 } } },
    ]).toArray();
    for (const m of machines) {
      if (await this.frozen(m._id)) continue;
      const [doc, live] = await Promise.all([
        serverModel.findOne({ _id: m._id }, { projection: { pool: 1 } }),
        subscriptionModel.countDocuments({
          kind: "server",
          "rental.host": m._id,
          status: { $in: [...LIVE_RENTAL, "requested"] },
        }, { limit: 1 }),
      ]);
      let amount = 0;
      let availableAt = new Date(now.getTime() + HOLD_MS);
      if (!live && !doc?.pool?.rent?.enabled) {
        const last = await subscriptionPeriodModel.findOne(
          { "market.machine": m._id },
          { sort: { periodEnd: -1 }, projection: { periodEnd: 1 } },
        );
        amount = m.amount;
        availableAt = new Date(
          (last?.periodEnd ?? now).getTime() + HOLD_MS,
        );
      } else {
        const { cap } = await this.securityOf(m._id);
        amount = m.amount - cap;
      }
      if (amount <= 0) continue;
      const key = `release:${m._id}:${m.amount}:${
        now.toISOString().slice(0, 10)
      }`;
      await mongodb.withSession((client) =>
        client.withTransaction(async (session) => {
          await earningModel.insertMany([
            {
              owner,
              machine: m._id,
              bucket: "security",
              amount: -amount,
              availableAt: now,
              type: "release",
              key: `${key}:security`,
              createdAt: now,
            },
            {
              owner,
              machine: m._id,
              bucket: "earnings",
              amount,
              availableAt,
              type: "release",
              key,
              createdAt: now,
            },
          ], { session });
        })
      ).catch((error) => {
        if (!isDuplicate(error)) throw error;
      });
    }
  }

  /**
   * The owner's money (PLAN §30.7): what matured settles first. `available`
   * is claimable (machines with an open dispute excluded), `held` waits its
   * 14 days, `pending` is the running months' expected share.
   */
  async summary(owner: ObjectId, now = new Date()) {
    await this.settleDue({
      $or: [{ "market.owner": owner }, { "market.split.owner": owner }],
    }, now);
    await this.releaseSecurity(owner, now);
    const [rows, disputes, running] = await Promise.all([
      earningModel.find({ owner }, {
        projection: {
          bucket: 1,
          amount: 1,
          availableAt: 1,
          machine: 1,
        },
      }).toArray(),
      disputeModel.find({ owner, status: "open" }, {
        projection: { machine: 1 },
      }).toArray(),
      subscriptionPeriodModel.find({
        "market.owner": owner,
        kind: "paid",
        periodEnd: { $gt: now },
        refunded: { $exists: false },
      }, { projection: { amount: 1, "market.commission": 1 }, limit: 1_000 })
        .toArray(),
    ]);
    const frozenIds = new Set(disputes.map((d) => String(d.machine)));
    const isFrozen = (r: { machine?: ObjectId }) =>
      !!r.machine && frozenIds.has(String(r.machine));
    const earnings = rows.filter((r) => r.bucket === "earnings");
    const ready = earnings.filter((r) => r.availableAt <= now);
    const security = new Map<string, number>();
    for (const r of rows.filter((r) => r.bucket === "security")) {
      const k = String(r.machine);
      security.set(k, (security.get(k) ?? 0) + r.amount);
    }
    // Claims and refunds come off the whole; a disputed machine's money
    // can't be claimed meanwhile.
    const total = sum(ready);
    const frozen = sum(ready.filter((r) => isFrozen(r) && r.amount > 0));
    return {
      available: Math.max(0, total - frozen),
      frozen: Math.min(frozen, Math.max(0, total)),
      held: sum(earnings.filter((r) => r.availableAt > now)),
      pending: running.reduce(
        (a, p) => a + shareOf(p.amount, p.market!.commission).share,
        0,
      ),
      security: [...security].filter(([, v]) => v !== 0).map((
        [machine, amount],
      ) => ({
        machine,
        amount,
      })),
    };
  }

  /**
   * Claims earnings into the wallet (PLAN §30.7): spendable on the
   * platform, never cashed out from there.
   */
  async claim(owner: ObjectId, user: ObjectId, amount: number) {
    await this.summary(owner);
    const frozen = await this.frozenMachines(owner);
    const _id = new ObjectId();
    const now = new Date();
    await mongodb.withSession((client) =>
      client.withTransaction(async (session) => {
        // The transfer first: it creates the owner's wallet when it has
        // none, which a transaction can only see before its first read.
        const transfer = await fromPlatform({
          to: owner,
          amount,
          key: `claim:${_id}`,
          description: "Earnings claimed",
          user,
          session,
        });
        // One claim at a time per owner: two at once would both see the
        // same balance (the lock makes the second retry and re-read).
        await this.lock(owner, session);
        const ready = await earningModel.find({
          owner,
          bucket: "earnings",
          availableAt: { $lte: now },
        }, { projection: { amount: 1, machine: 1 }, session }).toArray();
        const held = sum(
          ready.filter((r) =>
            r.amount > 0 && !!r.machine && frozen.has(String(r.machine))
          ),
        );
        const available = Math.max(0, sum(ready) - held);
        if (amount < 1 || amount > available) {
          throw Response.badRequest(
            `You can claim up to ${(available / 100).toFixed(2)} USD`,
          );
        }
        await earningModel.insertOne({
          _id,
          owner,
          bucket: "earnings",
          amount: -amount,
          availableAt: now,
          type: "claim",
          key: `claim:${_id}`,
          walletReference: transfer.reference,
          createdAt: now,
        }, { session });
      })
    );
    return { claim: String(_id) };
  }

  /** Serializes an owner's claims and reverts inside a transaction. */
  private lock(owner: ObjectId, session: ClientSession) {
    return mongodb.db().collection<{ _id: ObjectId; seq: number }>(
      "earningLocks",
    ).updateOne({ _id: owner }, { $inc: { seq: 1 } }, {
      upsert: true,
      session,
    });
  }

  /** The owner's machines with an open dispute: their money waits. */
  private async frozenMachines(owner: ObjectId) {
    const open = await disputeModel.find({ owner, status: "open" }, {
      projection: { machine: 1 },
    }).toArray();
    return new Set(open.map((d) => String(d.machine)));
  }

  /**
   * Takes a claim back into earnings (PLAN §30.7). With no wallet movement
   * since, at once and in full; otherwise an admin decides, up to the claim
   * minus everything charged to the wallet since (top-ups never add to it).
   */
  async revert(owner: ObjectId, user: ObjectId, claimId: ObjectId) {
    const claim = await earningModel.findOne({
      _id: claimId,
      owner,
      type: "claim",
    });
    if (!claim?.walletReference) throw Response.notFound("Claim not found");
    const [reverted, pending] = await Promise.all([
      earningModel.countDocuments({ key: `revert:${claimId}` }, { limit: 1 }),
      claimRevertModel.countDocuments(
        { claim: claimId, status: { $in: ["pending", "approved"] } },
        { limit: 1 },
      ),
    ]);
    if (reverted || pending) {
      throw Response.badRequest(
        "This claim was taken back, or is waiting for it",
      );
    }
    const amount = -claim.amount;
    const sinceClaim = {
      tenant: owner,
      createdAt: { $gt: claim.createdAt },
      reference: { $ne: claim.walletReference },
    };
    try {
      // Checked inside the transaction that moves the money: a payment made
      // meanwhile touches the same wallet, so this retries and sees it.
      await mongodb.withSession((client) =>
        client.withTransaction(async (session) => {
          await this.lock(owner, session);
          if (
            await walletLedgerModel.countDocuments(sinceClaim, {
              limit: 1,
              session,
            })
          ) throw new Moved();
          await this.moveBack(owner, claimId, amount, user, session);
        })
      );
      return { result: "reverted" as const, amount };
    } catch (error) {
      if (!(error instanceof Moved)) throw error;
    }
    const since = await walletLedgerModel.find(sinceClaim, {
      projection: { type: 1, amount: 1 },
      limit: 1_000,
    }).toArray();
    const charged = since.filter((t) => t.type === "debit")
      .reduce((a, t) => a + Math.abs(Number(t.amount)), 0);
    const max = Math.max(0, amount - charged);
    if (!max) {
      throw Response.badRequest("What this claim added has been spent since");
    }
    await claimRevertModel.insertOne({
      owner,
      claim: claimId,
      amount,
      max,
      status: "pending",
      requestedBy: user,
      createdAt: new Date(),
    });
    return { result: "requested" as const, amount: max };
  }

  /** The wallet gives a claim (or part of it) back to earnings. */
  private async moveBack(
    owner: ObjectId,
    claim: ObjectId,
    amount: number,
    user: ObjectId,
    session: ClientSession,
  ) {
    const now = new Date();
    const transfer = await Wallet.transfer({
      fromTenant: owner,
      toTenant: await platformTenant(),
      amount,
      currency: "usd",
      idempotencyKey: `revert:${claim}`,
      description: "Claim taken back to earnings",
      purpose: "earnings",
      user,
      databaseSession: session,
    });
    await earningModel.insertOne({
      owner,
      bucket: "earnings",
      amount,
      availableAt: now,
      type: "revert",
      key: `revert:${claim}`,
      walletReference: transfer.reference,
      createdAt: now,
    }, { session });
  }

  /** An admin decides a revert request, up to its `max`. */
  async decideRevert(
    id: ObjectId,
    admin: ObjectId,
    decision: { amount: number; note?: string },
  ) {
    const request = await claimRevertModel.findOne({
      _id: id,
      status: "pending",
    });
    if (!request) throw Response.notFound("No pending request with this id");
    if (decision.amount > request.max) {
      throw Response.badRequest(
        `At most ${(request.max / 100).toFixed(2)} USD: the rest was spent`,
      );
    }
    const { modifiedCount } = await claimRevertModel.updateOne(
      { _id: id, status: "pending" },
      {
        $set: {
          status: decision.amount > 0 ? "approved" : "rejected",
          decided: { by: admin, at: new Date(), ...decision },
        },
      },
    );
    if (!modifiedCount) throw Response.badRequest("Decided meanwhile");
    if (decision.amount > 0) {
      await mongodb.withSession((client) =>
        client.withTransaction((session) =>
          this.moveBack(
            request.owner,
            request.claim,
            decision.amount,
            admin,
            session,
          )
        )
      );
    }
  }

  /** The money a dispute on a machine can pay from: unreleased earnings and security. */
  async frozenOf(machine: ObjectId, now = new Date()) {
    const rows = await earningModel.find({ machine }, {
      projection: { bucket: 1, amount: 1, availableAt: 1 },
    }).toArray();
    const unreleased = sum(
      rows.filter((r) => r.bucket === "earnings" && r.availableAt > now),
    );
    const security = sum(rows.filter((r) => r.bucket === "security"));
    return {
      unreleased,
      security,
      total: Math.max(0, unreleased) + Math.max(0, security),
    };
  }

  /** Pays a dispute's refund from the machine's money (PLAN §30.9). */
  async payDispute(opts: {
    dispute: ObjectId;
    machine: ObjectId;
    owner: ObjectId;
    customer: ObjectId;
    amount: number;
    admin: ObjectId;
  }) {
    if (opts.amount <= 0) return;
    const { unreleased, security, total } = await this.frozenOf(opts.machine);
    if (opts.amount > total) {
      throw Response.badRequest(
        `At most ${(total / 100).toFixed(2)} USD is held for this machine`,
      );
    }
    const fromEarnings = Math.min(opts.amount, Math.max(0, unreleased));
    const fromSecurity = Math.min(
      opts.amount - fromEarnings,
      Math.max(0, security),
    );
    const now = new Date();
    await mongodb.withSession((client) =>
      client.withTransaction(async (session) => {
        await fromPlatform({
          to: opts.customer,
          amount: opts.amount,
          key: `dispute:${opts.dispute}`,
          description: "Dispute refund",
          user: opts.admin,
          session,
        });
        const base = {
          owner: opts.owner,
          machine: opts.machine,
          availableAt: now,
          type: "dispute" as const,
          createdAt: now,
        };
        const rows: TEarning[] = [];
        if (fromEarnings) {
          rows.push({
            ...base,
            bucket: "earnings",
            amount: -fromEarnings,
            key: `dispute:${opts.dispute}`,
          });
        }
        if (fromSecurity) {
          rows.push({
            ...base,
            bucket: "security",
            amount: -fromSecurity,
            key: `dispute:${opts.dispute}:security`,
          });
        }
        if (rows.length) await earningModel.insertMany(rows, { session });
      })
    );
  }

  /** Rentals whose server is down past the limit now (PLAN §30.6). */
  async downTooLong(
    subs: Pick<TSubscription, "server" | "status">[],
    now = new Date(),
  ) {
    const servers = subs.filter((s) =>
      s.server && (RUNNING_RENTAL as readonly string[]).includes(s.status)
    ).map((s) => s.server!);
    if (!servers.length) return new Set<string>();
    const leases = await serverLeaseModel.find({
      _id: { $in: servers },
      aliveUntil: { $lt: new Date(now.getTime() - LEAVE_MS) },
    }, { projection: { _id: 1 } }).toArray();
    return new Set(leases.map((l) => String(l._id)));
  }
}

class Settled extends Error {}
class Moved extends Error {}
