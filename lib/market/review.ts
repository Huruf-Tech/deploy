import type { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { userModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/user.ts";
import { profilesOf } from "@/lib/agents/profile.ts";
import { earnings, rentals } from "@/lib/services.ts";
import { linked, ratingsOf } from "@/lib/market/market.ts";
import { rentalPlanModel } from "@/schemas/billing/plan.ts";
import {
  LIVE_RENTAL,
  subscriptionModel,
} from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { abuseReportModel, disputeModel } from "@/schemas/billing/market.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { serverOutageModel } from "@/schemas/infrastructure/serverOutage.ts";

/**
 * What an admin needs to decide fairly (PLAN §30.9, §30.10): both parties
 * and their records, the rental, every period's money and downtime, the
 * outages of the rented server and its machine, and the machine's measured
 * facts. Read-only; one call per page view.
 */

/** A workspace, its owner, and its record in the market. */
async function party(tenant: ObjectId, as: "customer" | "owner") {
  const doc = await tenantModel.findOne({ _id: tenant }, {
    projection: { name: 1, createdBy: 1, createdAt: 1 },
  });
  const user = doc?.createdBy &&
    await userModel.findOne({ _id: doc.createdBy }, {
      projection: { name: 1, email: 1, createdAt: 1 },
    });
  const disputes = as === "customer" ? { tenant } : { owner: tenant };
  const [rented, machines, all, refunded, reportsBy, reportsValid] =
    await Promise.all([
      subscriptionModel.countDocuments({
        kind: "server",
        ...(as === "customer" ? { tenant } : { "rental.owner": tenant }),
      }),
      as === "owner"
        ? serverModel.countDocuments({ tenant, "pool.rent.enabled": true })
        : Promise.resolve(undefined),
      disputeModel.countDocuments(disputes),
      disputeModel.aggregate<{ cents: number; count: number }>([
        { $match: { ...disputes, "decision.refund": { $gt: 0 } } },
        {
          $group: {
            _id: null,
            cents: { $sum: "$decision.refund" },
            count: { $sum: 1 },
          },
        },
      ]).toArray(),
      abuseReportModel.countDocuments({ tenant }),
      abuseReportModel.countDocuments({ tenant, "resolution.valid": true }),
    ]);
  return {
    _id: String(tenant),
    name: doc?.name,
    createdAt: (doc as { createdAt?: Date } | null)?.createdAt,
    ownerName: user?.name,
    ownerEmail: user?.email,
    rentals: rented,
    ...(machines !== undefined ? { machinesForRent: machines } : {}),
    disputes: all,
    disputesRefunded: refunded[0]?.count ?? 0,
    refundedCents: refunded[0]?.cents ?? 0,
    reportsMade: reportsBy,
    reportsValid,
  };
}

/** A machine's measured facts, its renters' rating and its dispute record. */
async function machineFacts(id: ObjectId) {
  const doc = await serverModel.findOne({ _id: id }, {
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
  });
  if (!doc) return null;
  const [profiles, ratings, live, disputes, reports] = await Promise.all([
    profilesOf([doc]),
    ratingsOf([id]),
    subscriptionModel.countDocuments({
      kind: "server",
      "rental.host": id,
      status: { $in: [...LIVE_RENTAL] },
    }),
    disputeModel.countDocuments({ machine: id }),
    abuseReportModel.countDocuments({ machine: id }),
  ]);
  return {
    _id: String(id),
    name: doc.name,
    owner: String(doc.tenant),
    country: doc.region?.country,
    publicIp: doc.inventory?.publicIp,
    addedAt: doc.createdAt,
    allocatable: doc.pool?.allocatable,
    forRent: !!doc.pool?.rent?.enabled,
    profile: profiles.get(String(id)) ?? {},
    renters: ratings.get(String(id)),
    liveRentals: live,
    disputes,
    reports,
  };
}

/** Outages of the rented server and its machine since `from` (newest first). */
async function outagesOf(
  servers: { id: ObjectId; role: string }[],
  from: Date,
) {
  const now = new Date();
  const [past, leases] = await Promise.all([
    serverOutageModel.find({
      server: { $in: servers.map((s) => s.id) },
      to: { $gte: from },
    }, { sort: { from: -1 }, limit: 200 }).toArray(),
    serverLeaseModel.find({
      _id: { $in: servers.map((s) => s.id) },
      aliveUntil: { $lt: now },
    }, { projection: { aliveUntil: 1 } }).toArray(),
  ]);
  const role = (id: ObjectId) =>
    servers.find((s) => s.id.equals(id))?.role ?? "server";
  return [
    // Down right now: from its lease's end, still going.
    ...leases.map((l) => ({
      server: role(l._id),
      from: l.aliveUntil,
      ongoing: true,
      minutes: Math.round((now.getTime() - l.aliveUntil.getTime()) / 60_000),
    })),
    ...past.map((o) => ({
      server: role(o.server),
      from: o.from,
      to: o.to,
      minutes: Math.round((o.to.getTime() - o.from.getTime()) / 60_000),
    })),
  ];
}

export async function disputeDetail(id: ObjectId) {
  const dispute = await disputeModel.findOne({ _id: id });
  if (!dispute) throw Response.notFound("Dispute not found");
  const sub = await subscriptionModel.findOne({ _id: dispute.subscription });
  const [periods, plan, machine, customer, owner, held, isLinked] =
    await Promise.all([
      subscriptionPeriodModel.find({ subscription: dispute.subscription }, {
        sort: { periodStart: -1 },
        limit: 24,
      }).toArray(),
      sub && rentalPlanModel.findOne({ _id: sub.plan }, {
        projection: { name: 1, price: 1, resources: 1 },
      }),
      machineFacts(dispute.machine),
      party(dispute.tenant, "customer"),
      party(dispute.owner, "owner"),
      earnings.frozenOf(dispute.machine),
      linked(dispute.tenant, dispute.owner),
    ]);
  const started = sub?.startedAt ?? dispute.createdAt;
  const servers = [
    { id: dispute.machine, role: "machine" },
    ...(sub?.server ? [{ id: sub.server, role: "rented server" }] : []),
  ];
  const [outages, uptime] = await Promise.all([
    outagesOf(servers, started),
    sub ? rentals.uptimes([sub]) : Promise.resolve(new Map<string, number>()),
  ]);
  const r = sub?.rental;
  return {
    dispute: {
      _id: String(dispute._id),
      reason: dispute.reason,
      status: dispute.status,
      createdAt: dispute.createdAt,
      evidence: dispute.evidence,
      ...(dispute.decision
        ? {
          decision: {
            refund: dispute.decision.refund,
            note: dispute.decision.note,
            at: dispute.decision.at,
          },
        }
        : {}),
    },
    held,
    rental: sub && r
      ? {
        _id: String(sub._id),
        status: sub.status,
        plan: plan?.name,
        price: plan?.price.amount ?? 0,
        resources: plan?.resources,
        size: r.size,
        whole: !!r.whole,
        term: r.term,
        startedAt: sub.startedAt,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        endAt: r.endAt,
        lostAt: r.lostAt,
        heldByAdmin: !!r.held,
        partition: r.partition,
        server: sub.server && String(sub.server),
        uptimeThisPeriod: uptime.get(String(sub._id)),
        lastMove: r.lastMove && {
          at: r.lastMove.at,
          error: r.lastMove.error,
        },
      }
      : undefined,
    periods: periods.map((p) => ({
      _id: String(p._id),
      start: p.periodStart,
      end: p.periodEnd,
      paid: p.amount,
      overage: p.overage?.amount,
      downtimeMs: p.settled?.downtimeMs ?? p.usage?.downtimeMs ?? 0,
      refund: p.settled?.refund ?? p.refunded,
      commission: p.settled?.commission,
      ownerShare: p.settled?.share,
      toSecurity: p.settled?.toSecurity,
      left: !!p.settled?.left,
      settled: !!p.settled,
    })),
    outages,
    machine,
    customer,
    owner,
    linked: isLinked,
  };
}

export async function reportDetail(id: ObjectId) {
  const report = await abuseReportModel.findOne({ _id: id });
  if (!report) throw Response.notFound("Report not found");
  const sub = report.subscription
    ? await subscriptionModel.findOne({ _id: report.subscription })
    : null;
  const machineId = report.machine ?? sub?.rental?.host;
  const [reporter, machine, plan] = await Promise.all([
    party(report.tenant, "customer"),
    machineId ? machineFacts(machineId) : Promise.resolve(null),
    sub &&
    rentalPlanModel.findOne({ _id: sub.plan }, { projection: { name: 1 } }),
  ]);
  const ownerId = machine && machine.owner;
  const [owner, rentsIt, earlier] = await Promise.all([
    ownerId
      ? party(
        (await serverModel.findOne({ _id: machineId }, {
          projection: { tenant: 1 },
        }))!.tenant,
        "owner",
      )
      : Promise.resolve(null),
    machineId
      ? subscriptionModel.countDocuments({
        kind: "server",
        tenant: report.tenant,
        "rental.host": machineId,
      })
      : Promise.resolve(0),
    abuseReportModel.find({
      _id: { $ne: report._id },
      $or: [
        ...(machineId ? [{ machine: machineId }] : []),
        ...(report.subscription ? [{ subscription: report.subscription }] : []),
      ],
    }, { sort: { createdAt: -1 }, limit: 20 }).toArray(),
  ]);
  // How the reporter relates to what they report.
  const relation = ownerId === String(report.tenant)
    ? "owner"
    : sub?.tenant.equals(report.tenant)
    ? "renter"
    : rentsIt
    ? "renter"
    : "none";
  return {
    report: {
      _id: String(report._id),
      text: report.text,
      status: report.status,
      createdAt: report.createdAt,
      resolution: report.resolution && {
        valid: report.resolution.valid,
        note: report.resolution.note,
        at: report.resolution.at,
      },
    },
    reporter,
    relation,
    rental: sub
      ? {
        _id: String(sub._id),
        status: sub.status,
        plan: plan?.name,
        customer: String(sub.tenant),
        size: sub.rental?.size,
        startedAt: sub.startedAt,
      }
      : undefined,
    machine,
    owner,
    earlier: earlier.map((e) => ({
      _id: String(e._id),
      text: e.text,
      status: e.status,
      valid: e.resolution?.valid,
      createdAt: e.createdAt,
    })),
  };
}
