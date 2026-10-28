import z from "zod";
import type { ObjectId } from "mongodb";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { earnings, rentals } from "@/lib/services.ts";
import { rentalPlanModel } from "@/schemas/billing/plan.ts";
import { $rentPrices, serverModel } from "@/schemas/infrastructure/server.ts";

const $size = z.object({
  cpus: z.number(),
  memMb: z.number(),
  diskGb: z.number(),
});

/** A machine for rent as its owner (or an admin) sees it (PLAN §30). */
export const $machineView = z.object({
  rent: z.object({
    enabled: z.boolean(),
    autoAccept: z.boolean(),
    prices: $rentPrices,
  }).optional(),
  accepting: z.boolean(),
  monthlyCost: z.number().optional(),
  security: z.object({
    amount: z.number().describe("Cents held for this machine"),
    cap: z.number().describe("Its whole monthly price, minus commission"),
  }),
  commission: z.number().describe("Percent, from the workspace plan"),
  rentals: z.array(z.object({
    _id: z.string(),
    partition: z.string().optional(),
    tenantName: z.string().optional(),
    plan: z.string().optional(),
    price: z.number().describe("Cents per month"),
    size: $size,
    whole: z.boolean().optional(),
    status: z.string(),
    /** Unpaid: since when and why (the owner can try again). */
    pastDueSince: z.date().optional(),
    lastError: z.string().optional(),
    held: z.boolean().optional(),
    uptime: z.number().optional(),
    overDisk: z.number().optional(),
    resizing: z.boolean().optional(),
    resizeError: z.string().optional(),
    term: z.object({
      months: z.number(),
      until: z.date().optional(),
    }).optional(),
    endAt: z.date().optional(),
    nextSize: z.object({
      plan: z.string(),
      price: z.number(),
      at: z.date(),
    }).optional().describe("What starts at the renewal: a smaller size"),
    currentPeriodEnd: z.date().optional(),
    moving: z.object({
      to: z.string(),
      toName: z.string().optional(),
      startedAt: z.date(),
    }).optional(),
    proposal: z.object({
      to: z.string(),
      toName: z.string().optional(),
      expiresAt: z.date(),
    }).optional(),
    lastMove: z.object({
      from: z.string(),
      to: z.string(),
      at: z.date(),
      error: z.string().optional(),
    }).optional(),
  })),
  revenue: z.number().describe("Cents per month from live rentals"),
});

/**
 * A machine's rent settings, security and the rentals on it with their
 * state; `doc` is the machine (its owner's commission applies).
 */
export async function machineView(
  doc: {
    _id: ObjectId;
    tenant: ObjectId;
    pool?: { rent?: unknown; accepting?: boolean; monthlyCost?: number };
  },
) {
  const id = doc._id;
  const subs = await rentals.onMachine(id);
  const commission = await earnings.commissionOf(doc.tenant);
  const [tenants, plans, uptimes, machines, security, resizes] = await Promise
    .all([
      tenantModel.find({ _id: { $in: subs.map((s) => s.tenant) } }, {
        projection: { name: 1 },
      }).toArray(),
      rentalPlanModel.find({
        _id: {
          $in: subs.flatMap((
            s,
          ) => [s.plan, ...(s.nextPlan ? [s.nextPlan] : [])]),
        },
      }, {
        projection: { name: 1, price: 1 },
      }).toArray(),
      rentals.uptimes(subs),
      serverModel.find({
        _id: {
          $in: subs.flatMap((s) =>
            [s.rental?.move?.to, s.rental?.proposal?.to].filter((x) => !!x)
          ),
        },
      }, { projection: { name: 1 } }).toArray(),
      earnings.securityOf(id),
      rentals.resizeStates(subs),
    ]);
  const nameOf = (x?: ObjectId) =>
    x && machines.find((m) => m._id.equals(x))?.name;
  const rows = subs.map((s) => {
    const r = s.rental!;
    const plan = plans.find((p) => p._id.equals(s.plan));
    return {
      _id: s._id,
      partition: r.partition,
      tenantName: tenants.find((t) => t._id.equals(s.tenant))?.name,
      plan: plan?.name,
      price: plan?.price.amount ?? 0,
      size: r.size,
      ...(r.whole ? { whole: true } : {}),
      status: s.status,
      ...(s.status === "pastDue" || (s.status === "suspended" && !r.held)
        ? { pastDueSince: s.pastDueSince, lastError: s.lastError }
        : {}),
      ...(r.held ? { held: true } : {}),
      uptime: uptimes.get(String(s._id)),
      ...(r.overDisk ? { overDisk: r.overDisk.bytes } : {}),
      ...resizes.get(String(s._id)),
      term: r.term,
      endAt: r.endAt,
      ...(() => {
        const next = s.nextPlan && plans.find((p) => p._id.equals(s.nextPlan!));
        return next && s.currentPeriodEnd
          ? {
            nextSize: {
              plan: next.name,
              price: next.price.amount,
              at: s.currentPeriodEnd,
            },
          }
          : {};
      })(),
      currentPeriodEnd: s.currentPeriodEnd,
      ...(r.move
        ? {
          moving: {
            to: String(r.move.to),
            toName: nameOf(r.move.to),
            startedAt: r.move.startedAt,
          },
        }
        : {}),
      ...(r.proposal && r.proposal.expiresAt > new Date()
        ? {
          proposal: {
            to: String(r.proposal.to),
            toName: nameOf(r.proposal.to),
            expiresAt: r.proposal.expiresAt,
          },
        }
        : {}),
      ...(r.lastMove ? { lastMove: r.lastMove } : {}),
    };
  });
  return {
    rent: doc.pool?.rent as z.output<typeof $machineView>["rent"],
    accepting: doc.pool?.accepting !== false,
    monthlyCost: doc.pool?.monthlyCost,
    security: { amount: security.security, cap: security.cap },
    commission,
    rentals: rows,
    revenue: rows.filter((r) => r.status !== "suspended")
      .reduce((sum, r) => sum + r.price, 0),
  };
}
