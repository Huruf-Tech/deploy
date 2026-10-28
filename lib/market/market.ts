import { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { platformTenantId } from "@/lib/billing/platform.ts";
import { notifyOwner } from "@/lib/billing/notify.ts";
import { profilesOf } from "@/lib/agents/profile.ts";
import { readNumberSetting } from "@/lib/core/settings.ts";
import { takenOn } from "@/lib/pool/room.ts";
import { regionsOf } from "@/lib/market/region.ts";
import { HOURS_PER_MONTH } from "@/lib/market/pricing.ts";
import type { EarningsService } from "@/lib/market/earnings.ts";
import { paymentCardModel } from "@/schemas/billing/payment.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import {
  abuseReportModel,
  disputeModel,
  machineRatingModel,
} from "@/schemas/billing/market.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { Logger } from "@/core/utils/logger.ts";

const DAY_MS = 86_400_000;
/** A machine is a new arrival this long after it was added (PLAN §30.4). */
const NEW_FOR_MS = 182 * DAY_MS;

const log = (text: string) => Logger.warn(`[market] ${text}`);

/**
 * What kind of machine it is (PLAN §30.4), from what's measured: memory per
 * vCPU names the family like cloud instance types (memory optimized from 6
 * GB a vCPU, compute optimized up to 2.5 GB, general purpose between), and
 * a host taking 2 % of its CPU or more (steal) makes it burstable: its CPU
 * is there in bursts, not all the time.
 */
export const familyOf = (
  all: { cpus: number; memMb: number },
  steal?: number,
) => {
  const perCpu = all.cpus > 0 ? all.memMb / 1024 / all.cpus : 0;
  return {
    family: perCpu >= 6
      ? "Memory optimized" as const
      : perCpu <= 2.5
      ? "Compute optimized" as const
      : "General purpose" as const,
    burstable: (steal ?? 0) >= 0.02,
  };
};

/** Machines for rent in the market (PLAN §30.4): set up, rentable, taking rentals. */
export const RENTABLE = {
  status: "active",
  "provider.kind": "machine",
  "pool.status": "ready",
  "pool.rent.enabled": true,
  "pool.accepting": { $ne: false },
} as const;

export type TMarketFilters = {
  country?: string;
  source?: "official" | "community";
  dedicated?: boolean;
  newArrivals?: boolean;
  tier?: "Basic" | "Standard" | "Performance";
  disk?: "NVMe" | "SSD" | "HDD";
  minRating?: number;
  maxRttMs?: number;
  minUptime?: number;
  minVcpu?: number;
  minMemMb?: number;
  minDiskGb?: number;
  sort?: "price" | "rating" | "uptime" | "latency";
};

/**
 * The same person on both sides of a rental (PLAN §30.10): one workspace, one
 * creator, or a card saved in both. Renting from yourself would launder a
 * card through earnings.
 */
export async function linked(customer: ObjectId, owner: ObjectId) {
  if (customer.equals(owner)) return true;
  const tenants = await tenantModel.find({ _id: { $in: [customer, owner] } }, {
    projection: { createdBy: 1 },
  }).toArray();
  if (
    tenants.length === 2 && tenants[0].createdBy &&
    String(tenants[0].createdBy) === String(tenants[1].createdBy)
  ) return true;
  const cards = await paymentCardModel.find({
    tenant: { $in: [customer, owner] },
    fingerprint: { $exists: true },
  }, { projection: { tenant: 1, fingerprint: 1 }, limit: 200 }).toArray();
  const mine = new Set(
    cards.filter((c) => c.tenant.equals(customer)).map((c) => c.fingerprint),
  );
  return cards.some((c) => c.tenant.equals(owner) && mine.has(c.fingerprint));
}

/** Renters' ratings per machine: stars weighted by what each paid. */
export async function ratingsOf(machines: ObjectId[]) {
  const rows = await machineRatingModel.aggregate<
    { _id: ObjectId; stars: number; weight: number; count: number }
  >([
    { $match: { machine: { $in: machines } } },
    {
      $group: {
        _id: "$machine",
        stars: { $sum: { $multiply: ["$stars", { $max: ["$weight", 1] }] } },
        weight: { $sum: { $max: ["$weight", 1] } },
        count: { $sum: 1 },
      },
    },
  ]).toArray();
  return new Map(rows.map((r) => [
    String(r._id),
    { stars: Math.round((r.stars / r.weight) * 10) / 10, count: r.count },
  ]));
}

/**
 * The market (PLAN §30.4): machines with room, their measured facts (§29),
 * their region, prices and renters' rating. At most 300 machines are read.
 */
export async function listMachines(viewer: ObjectId, f: TMarketFilters) {
  const now = new Date();
  const machines = await serverModel.find(RENTABLE, {
    projection: {
      tenant: 1,
      name: 1,
      provider: 1,
      pool: 1,
      resources: 1,
      inventory: 1,
      region: 1,
      createdAt: 1,
    },
    limit: 300,
  }).toArray();
  const platform = await platformTenantId();
  const [taken, profiles, ratings, regions, owners, overheadMb, perVcpu] =
    await Promise.all([
      takenOn(machines),
      profilesOf(machines, now),
      ratingsOf(machines.map((m) => m._id)),
      regionsOf(machines),
      tenantModel.find(
        {
          _id: {
            $in: [...new Set(machines.map((m) => String(m.tenant)))].map((id) =>
              new ObjectId(id)
            ),
          },
        },
        { projection: { name: 1 } },
      ).toArray(),
      readNumberSetting("PARTITION_OVERHEAD_MB", 128),
      readNumberSetting("RENTAL_TRAFFIC_PER_VCPU_GB", 100),
    ]);
  const rows = machines.map((m) => {
    const id = String(m._id);
    const all = m.pool!.allocatable ?? { cpus: 0, memMb: 0, diskGb: 0 };
    const used = taken.get(id)!;
    const p = profiles.get(id) ?? {};
    const prices = m.pool!.rent!.prices;
    const monthly = (hourly: number) => Math.round(hourly * HOURS_PER_MONTH);
    return {
      _id: id,
      name: m.name,
      official: !!platform && m.tenant.equals(platform),
      owner: owners.find((o) => o._id.equals(m.tenant))?.name,
      yours: m.tenant.equals(viewer),
      newArrival: now.getTime() - m.createdAt.getTime() < NEW_FOR_MS,
      measuredDays: Math.floor(
        (now.getTime() - m.createdAt.getTime()) / DAY_MS,
      ),
      country: regions.get(id),
      free: {
        cpus: Math.max(0, all.cpus - used.cpus),
        memMb: Math.max(0, all.memMb - used.memMb - overheadMb),
        diskGb: Math.max(0, all.diskGb - used.diskGb),
      },
      total: all,
      prices: {
        hourly: prices,
        // Cents a month, for showing; a rental's charge is computed exactly.
        monthly: {
          vcpu: monthly(prices.vcpu),
          memGb: monthly(prices.memGb),
          diskGb: monthly(prices.diskGb),
          ...(prices.whole ? { whole: monthly(prices.whole) } : {}),
        },
        trafficGb: prices.trafficGb,
      },
      trafficPerVcpuGb: perVcpu,
      overheadMb,
      autoAccept: !!m.pool!.rent!.autoAccept,
      rating: p.rating,
      tier: p.tier,
      disk: p.disk,
      rttMs: p.rttMs,
      uptime30d: p.uptime30d,
      uptime90d: p.uptime90d,
      steal: p.steal,
      virtualization: p.virtualization,
      dedicated: !!p.dedicated,
      ...familyOf(all, p.steal),
      renters: ratings.get(id),
    };
  }).filter((m) =>
    (!f.country || m.country === f.country.toUpperCase()) &&
    (!f.source || (f.source === "official") === m.official) &&
    (!f.dedicated || m.dedicated) &&
    (!f.newArrivals || m.newArrival) &&
    (!f.tier || m.tier === f.tier) &&
    (!f.disk || m.disk === f.disk) &&
    (f.minRating === undefined || (m.rating ?? -1) >= f.minRating) &&
    (f.maxRttMs === undefined ||
      (m.rttMs !== undefined && m.rttMs <= f.maxRttMs)) &&
    (f.minUptime === undefined || (m.uptime30d ?? 0) >= f.minUptime) &&
    (!f.minVcpu || m.free.cpus >= f.minVcpu) &&
    (!f.minMemMb || m.free.memMb >= f.minMemMb) &&
    (!f.minDiskGb || m.free.diskGb >= f.minDiskGb) &&
    (m.free.memMb >= 512 && m.free.cpus >= 0.25 && m.free.diskGb >= 5)
  );
  const by = {
    price: (a: typeof rows[0], b: typeof rows[0]) =>
      a.prices.hourly.vcpu - b.prices.hourly.vcpu,
    rating: (a: typeof rows[0], b: typeof rows[0]) =>
      (b.rating ?? -1) - (a.rating ?? -1),
    uptime: (a: typeof rows[0], b: typeof rows[0]) =>
      (b.uptime30d ?? 0) - (a.uptime30d ?? 0),
    latency: (a: typeof rows[0], b: typeof rows[0]) =>
      (a.rttMs ?? Infinity) - (b.rttMs ?? Infinity),
  }[f.sort ?? "rating"];
  return rows.sort(by);
}

/** What a renter paid for a rental so far, in cents. */
async function paidFor(subscription: ObjectId) {
  const periods = await subscriptionPeriodModel.find(
    { subscription, kind: "paid", settled: { $exists: true } },
    { projection: { amount: 1, "settled.refund": 1 } },
  ).toArray();
  return {
    months: periods.length,
    cents: periods.reduce((a, p) => a + p.amount - (p.settled?.refund ?? 0), 0),
  };
}

/**
 * A renter rates the machine (PLAN §30.10): after a month that matured,
 * never from a linked workspace; once per rental (a new rating replaces it).
 */
export async function rate(
  tenant: ObjectId,
  subscription: ObjectId,
  stars: number,
  comment?: string,
) {
  const sub = await subscriptionModel.findOne({
    _id: subscription,
    tenant,
    kind: "server",
  }, { projection: { rental: 1 } });
  const machine = sub?.rental?.host;
  if (!machine || !sub.rental?.owner) {
    throw Response.notFound("Rental not found");
  }
  const paid = await paidFor(subscription);
  if (!paid.months) {
    throw Response.badRequest("You can rate it once a paid month has ended");
  }
  if (await linked(tenant, sub.rental.owner)) {
    throw Response.forbidden("You can't rate a machine of your own");
  }
  await machineRatingModel.updateOne({ subscription }, {
    $set: {
      machine,
      tenant,
      stars,
      ...(comment ? { comment } : {}),
      weight: paid.cents,
      createdAt: new Date(),
    },
    ...(comment ? {} : { $unset: { comment: "" } }),
  }, { upsert: true });
}

/** Abuse reported on a machine or rental (PLAN §30.10), for admins. */
export async function reportAbuse(opts: {
  tenant: ObjectId;
  by: ObjectId;
  machine?: ObjectId;
  subscription?: ObjectId;
  text: string;
}) {
  await abuseReportModel.insertOne({
    ...opts,
    status: "open",
    createdAt: new Date(),
  });
}

/**
 * Disputes (PLAN §30.9): the customer opens one; the machine's money is
 * frozen meanwhile; an admin decides a refund paid from it.
 */
export class DisputeService {
  constructor(private readonly earnings: EarningsService) {}

  async open(
    tenant: ObjectId,
    user: ObjectId,
    subscription: ObjectId,
    reason: string,
  ) {
    const sub = await subscriptionModel.findOne({
      _id: subscription,
      tenant,
      kind: "server",
    });
    const machine = sub?.rental?.host;
    const owner = sub?.rental?.owner;
    if (!sub || !machine || !owner) throw Response.notFound("Rental not found");
    if (
      await disputeModel.countDocuments(
        { subscription, status: "open" },
        { limit: 1 },
      )
    ) throw Response.badRequest("A dispute on this rental is open already");
    const now = new Date();
    const [profile, period] = await Promise.all([
      serverModel.findOne({ _id: machine }, {
        projection: {
          provider: 1,
          pool: 1,
          resources: 1,
          inventory: 1,
          createdAt: 1,
        },
      }).then((m) => m && profilesOf([m], now)),
      subscriptionPeriodModel.findOne(
        { subscription, periodStart: { $lte: now } },
        { sort: { periodStart: -1 } },
      ),
    ]);
    const evidence = {
      machine: profile?.get(String(machine)) ?? null,
      period: period
        ? {
          start: period.periodStart,
          end: period.periodEnd,
          paid: period.amount,
          downtimeMs: await this.earnings.downtimeOf(period, sub.server, now),
        }
        : null,
      at: now,
    };
    const { insertedId } = await disputeModel.insertOne({
      subscription,
      tenant,
      owner,
      machine,
      reason,
      status: "open",
      evidence: JSON.parse(JSON.stringify(evidence)),
      openedBy: user,
      createdAt: now,
    });
    notifyOwner(owner, {
      subject: "{workspace}: a renter opened a dispute",
      text: `A renter of one of your machines opened a dispute: ${reason}\n\n` +
        "Its earnings are frozen until Huruf decides.",
    }).catch((e) => log(`dispute notice: ${e}`));
    return { dispute: String(insertedId) };
  }

  list(status: "open" | "resolved" = "open") {
    return disputeModel.find({ status }, {
      sort: { createdAt: status === "open" ? 1 : -1 },
      limit: 200,
    }).toArray();
  }

  async resolve(
    id: ObjectId,
    admin: ObjectId,
    decision: { refund: number; note?: string },
  ) {
    const dispute = await disputeModel.findOne({ _id: id, status: "open" });
    if (!dispute) throw Response.notFound("No open dispute with this id");
    await this.earnings.payDispute({
      dispute: id,
      machine: dispute.machine,
      owner: dispute.owner,
      customer: dispute.tenant,
      amount: decision.refund,
      admin,
    });
    await disputeModel.updateOne({ _id: id }, {
      $set: {
        status: "resolved",
        decision: { ...decision, by: admin, at: new Date() },
      },
    });
    const text = decision.refund
      ? `Huruf decided the dispute: ${
        (decision.refund / 100).toFixed(2)
      } USD back to the renter's wallet.`
      : "Huruf decided the dispute: nothing is refunded.";
    for (const tenant of [dispute.tenant, dispute.owner]) {
      notifyOwner(tenant, {
        subject: "{workspace}: a dispute was decided",
        text: `${text}${decision.note ? `\n\n${decision.note}` : ""}`,
      }).catch((e) => log(`dispute decided notice: ${e}`));
    }
  }
}
