import { ObjectId, type WithId } from "mongodb";
import type z from "zod";
import { Response } from "@/core/http/response.ts";
import { Logger } from "@/core/utils/logger.ts";
import { readNumberSetting, readTextSetting } from "@/lib/core/settings.ts";
import type { BillingService, TRentalHooks } from "@/lib/billing/billing.ts";
import type { PaymentService } from "@/lib/payments/payments.ts";
import { notifyOwner } from "@/lib/billing/notify.ts";
import { releaseServer } from "@/lib/agents/servers.ts";
import {
  createPartition,
  partitionName,
  removePartition,
  resizePartition,
  startPartition,
  stopPartition,
} from "@/lib/pool/pool.ts";
import { $plan, planModel, type TPlan } from "@/schemas/billing/plan.ts";
import {
  serverClassModel,
  type TServerClass,
} from "@/schemas/billing/serverClass.ts";
import {
  subscriptionModel,
  type TSubscription,
} from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import type { $partitionUsage } from "@/schemas/protocol/agent.ts";

const DAY_MS = 24 * 60 * 60_000;
const GB = 1e9;

const log = (text: string) => Logger.warn(`[rentals] ${text}`);

export type TResources = { vcpu: number; memMb: number; diskGb: number };

/**
 * The monthly price from a class's rate card (PLAN §26.8), the partition
 * overhead included at the memory rate (the customer pays it, owner's
 * decision), rounded up to whole dollars.
 */
export const priceOf = (
  cls: Pick<TServerClass, "rates">,
  r: TResources,
  overheadMb: number,
) => {
  const cents = cls.rates.fixed + r.vcpu * cls.rates.vcpu +
    ((r.memMb + overheadMb) / 1024) * cls.rates.memGb +
    r.diskGb * cls.rates.diskGb;
  return Math.ceil(cents / 100) * 100;
};

export const includedTraffic = (
  cls: Pick<TServerClass, "includedTrafficPerVcpu">,
  vcpu: number,
) => Math.round(vcpu * cls.includedTrafficPerVcpu);

/** The partition's size: what the apps get plus what its own Docker and agent use. */
const partitionSize = (r: TResources, overheadMb: number) => ({
  cpus: r.vcpu,
  memMb: r.memMb + overheadMb,
  diskGb: r.diskGb,
});

/** A rental's traffic beyond its allowance (PLAN §26.9), whole GB rounded up. */
export const overageOf = (
  trafficBytes: number,
  allowanceGb: number,
  ratePerGb: number,
) => {
  const gb = Math.max(0, Math.ceil(trafficBytes / GB - allowanceGb));
  return gb ? { gb, amount: gb * ratePerGb } : null;
};

/**
 * Counter delta: the agent's counters restart at 0 after a reboot or
 * re-applied rules (PLAN §26.5), so a smaller value counts from 0.
 */
export const counterDelta = (previous: number | undefined, now: number) =>
  previous === undefined ? 0 : now >= previous ? now - previous : now;

type TRental = NonNullable<TSubscription["rental"]>;
type TSub = WithId<TSubscription> & { rental: TRental };

/**
 * Rentals (PLAN §26): a customer rents a partition of one of Huruf's pool
 * machines. Built on the existing pieces: a size is a server plan, a rental
 * is a server subscription, the partition joins the customer's tenant as an
 * ordinary (rented) server. This service adds requests and approval,
 * placement, traffic, and what happens to the partition when a rental isn't
 * paid, through `BillingService`'s rental hooks.
 */
export class RentalService implements TRentalHooks {
  constructor(
    private readonly billing: BillingService,
    private readonly payments: Pick<PaymentService, "fundNow">,
  ) {}

  private overheadMb() {
    return readNumberSetting("PARTITION_OVERHEAD_MB", 128);
  }

  private async platformTenant() {
    const id = await readTextSetting("PLATFORM_TENANT", "");
    if (!ObjectId.isValid(id)) {
      throw Response.badRequest("Payments aren't set up yet");
    }
    return new ObjectId(id);
  }

  /** Active classes, and the sizes this tenant may rent in them. */
  async catalog(tenant: ObjectId) {
    const [classes, sizes] = await Promise.all([
      serverClassModel.find({ active: true }, { sort: { sortOrder: 1 } })
        .toArray(),
      this.billing.available(tenant, "server"),
    ]);
    return {
      classes,
      sizes: sizes.filter((p) => p.class && p.resources && !p.custom),
      overheadMb: await this.overheadMb(),
    };
  }

  private async activeClass(id: ObjectId) {
    const cls = await serverClassModel.findOne({ _id: id, active: true });
    if (!cls) throw Response.notFound("Server class not found");
    return cls;
  }

  /** A custom size's price (PLAN §26.8), within the class's maximum and steps. */
  async quote(classId: ObjectId, r: TResources) {
    const cls = await this.activeClass(classId);
    const max = cls.maxPerRental;
    if (
      r.vcpu <= 0 || r.vcpu > max.vcpu || r.vcpu * 2 % 1 !== 0 ||
      r.memMb < 512 || r.memMb > max.memMb || r.memMb % 512 !== 0 ||
      r.diskGb < 5 || r.diskGb > max.diskGb || r.diskGb % 5 !== 0
    ) {
      throw Response.badRequest(
        `Up to ${max.vcpu} vCPU (steps of 0.5), ${
          max.memMb / 1024
        } GB memory (0.5 GB) and ${max.diskGb} GB disk (5 GB)`,
      );
    }
    const overheadMb = await this.overheadMb();
    return {
      cls,
      price: priceOf(cls, r, overheadMb),
      trafficGb: includedTraffic(cls, r.vcpu),
      overheadMb,
    };
  }

  /** A private server plan for one tenant's custom request (PLAN §26.6 A). */
  private async customPlan(tenant: ObjectId, classId: ObjectId, r: TResources) {
    const { cls, price, trafficGb } = await this.quote(classId, r);
    const _id = new ObjectId();
    const plan = $plan.parse({
      name: `Custom ${r.vcpu} vCPU · ${r.memMb / 1024} GB`,
      slug: `custom-${_id}`,
      description: `${cls.name}: ${r.vcpu} vCPU, ${
        r.memMb / 1024
      } GB memory, ${r.diskGb} GB disk`,
      kind: "server",
      custom: true,
      class: cls._id,
      resources: { ...r, trafficGb },
      visibility: "private",
      allowedTenants: [tenant],
      price: { amount: price, currency: "usd", interval: "month" },
    });
    await planModel.insertOne({ _id, ...plan });
    return { _id, ...plan } as WithId<TPlan>;
  }

  /** The plan a request or resize names: a size the tenant may rent, or a custom one. */
  private async planFor(
    tenant: ObjectId,
    choice: { plan?: ObjectId; custom?: TResources & { class: ObjectId } },
  ) {
    if (choice.custom) {
      return await this.customPlan(tenant, choice.custom.class, choice.custom);
    }
    const plan = choice.plan &&
      (await this.billing.available(tenant, "server"))
        .find((p) => p._id.equals(choice.plan!));
    if (!plan?.class || !plan.resources) {
      throw Response.notFound("Server size not found");
    }
    await this.activeClass(plan.class);
    return plan;
  }

  /**
   * "Rent a server" (PLAN §26.9): a `requested` server subscription. The first
   * month is put in the customer's wallet now, with them present (3-D Secure
   * in the browser); it's charged when an admin approves.
   */
  async request(
    tenant: ObjectId,
    user: ObjectId,
    choice: { plan?: ObjectId; custom?: TResources & { class: ObjectId } },
  ) {
    const plan = await this.planFor(tenant, choice);
    const cls = await this.activeClass(plan.class!);
    const now = new Date();
    const _id = new ObjectId();
    await subscriptionModel.insertOne({
      _id,
      tenant,
      kind: "server",
      plan: plan._id,
      status: "requested",
      autoRenew: true,
      cancelAtPeriodEnd: false,
      startedAt: now,
      createdBy: user,
      updatedAt: now,
      rental: {
        class: cls._id,
        size: partitionSize(plan.resources!, await this.overheadMb()),
        trafficRatePerGb: cls.rates.trafficGb,
      },
    });
    try {
      const funded = await this.payments.fundNow({
        tenant,
        amount: plan.price.amount,
        currency: plan.price.currency,
        key: `fund:rental:${_id}`,
      });
      if (funded.status === "pending") {
        return { result: "pending" as const, rental: String(_id), ...funded };
      }
    } catch (error) {
      // Declined: no request is left behind.
      await subscriptionModel.deleteOne({ _id });
      if (choice.custom) await planModel.deleteOne({ _id: plan._id });
      throw error;
    }
    return { result: "requested" as const, rental: String(_id) };
  }

  private async rentalOf(id: ObjectId, filter: object = {}): Promise<TSub> {
    const sub = await subscriptionModel.findOne({
      _id: id,
      kind: "server",
      ...filter,
    });
    if (!sub?.rental) throw Response.notFound("Rental not found");
    return sub as TSub;
  }

  /** The customer withdraws a request; the money stays in their wallet. */
  async withdraw(tenant: ObjectId, id: ObjectId) {
    const { modifiedCount } = await subscriptionModel.updateOne(
      { _id: id, tenant, kind: "server", status: "requested" },
      { $set: { status: "canceled", updatedAt: new Date() } },
    );
    if (!modifiedCount) throw Response.badRequest("No request to withdraw");
  }

  /** What's rented on each pool machine (sizes of live rentals). */
  private async usedOn(hosts: ObjectId[]) {
    const subs = await subscriptionModel.find({
      kind: "server",
      "rental.host": { $in: hosts },
      status: { $in: ["active", "pastDue", "suspended"] },
    }, { projection: { "rental.host": 1, "rental.size": 1 } }).toArray();
    const used = new Map<
      string,
      { cpus: number; memMb: number; diskGb: number }
    >();
    for (const s of subs) {
      const key = String(s.rental!.host);
      const u = used.get(key) ?? { cpus: 0, memMb: 0, diskGb: 0 };
      u.cpus += s.rental!.size.cpus;
      u.memMb += s.rental!.size.memMb;
      u.diskGb += s.rental!.size.diskGb;
      used.set(key, u);
    }
    return used;
  }

  /**
   * Pool machines of the rental's class that can take `size` (PLAN §26.7):
   * memory and disk never overcommit, CPU up to the class's ratio. Fullest
   * first, so whole machines stay free. `remainderShort`: the remainder would
   * have to give back memory it uses (the agent refuses then).
   */
  async placement(
    id: ObjectId,
    extra?: { cpus: number; memMb: number; diskGb: number },
  ) {
    const sub = await this.rentalOf(id);
    const cls = await serverClassModel.findOne({ _id: sub.rental.class });
    const size = extra ?? sub.rental.size;
    const machines = await serverModel.find({
      tenant: await this.platformTenant(),
      status: "active",
      "pool.status": "ready",
      "pool.class": sub.rental.class,
      "pool.accepting": { $ne: false },
      ...(extra ? { _id: sub.rental.host } : {}),
    }, {
      projection: { name: 1, pool: 1, "resources.partitions": 1 },
      limit: 200,
    }).toArray();
    const used = await this.usedOn(machines.map((m) => m._id));
    return machines.map((m) => {
      const all = m.pool!.allocatable!;
      const u = used.get(String(m._id)) ?? { cpus: 0, memMb: 0, diskGb: 0 };
      const free = {
        memMb: all.memMb - u.memMb,
        diskGb: all.diskGb - u.diskGb,
      };
      const cpuRoom = all.cpus * (cls?.cpuOvercommit ?? 1) - u.cpus;
      const remainder = m.resources?.partitions?.find((p) => p.remainder);
      const keeps = free.memMb - size.memMb;
      return {
        server: String(m._id),
        name: m.name,
        free,
        cpuRoom,
        fits: free.memMb >= size.memMb && free.diskGb >= size.diskGb &&
          cpuRoom >= size.cpus,
        remainderShort: !!remainder && remainder.memUsed > keeps * 2 ** 20,
        remainderUsesMb: remainder
          ? Math.round(remainder.memUsed / 2 ** 20)
          : undefined,
      };
    }).sort((a, b) =>
      Number(b.fits) - Number(a.fits) || a.free.memMb - b.free.memMb
    );
  }

  /**
   * An admin approves a request on a pool machine (PLAN §26.9): the first
   * month is charged, then the partition is created; its agent joins the
   * customer's tenant as a rented server.
   */
  async approve(id: ObjectId, host: ObjectId, admin: ObjectId) {
    const sub = await this.rentalOf(id, { status: "requested" });
    const spot = (await this.placement(id)).find((m) =>
      m.server === String(host)
    );
    if (!spot?.fits) {
      throw Response.badRequest("That machine has no room for this rental");
    }
    if (spot.remainderShort) {
      throw Response.badRequest(
        `Huruf's partition there uses ${spot.remainderUsesMb} MB: free memory there first, or pick another machine`,
      );
    }
    await this.billing.activate(id, admin);
    const name = partitionName(id);
    await subscriptionModel.updateOne({ _id: id }, {
      $set: {
        "rental.host": host,
        "rental.partition": name,
        updatedAt: new Date(),
      },
    });
    await this.createPartitionFor({
      ...sub,
      rental: { ...sub.rental, host, partition: name },
    }, admin);
    const plan = await planModel.findOne({ _id: sub.plan }, {
      projection: { name: 1 },
    });
    notifyOwner(sub.tenant, {
      subject: `{workspace}: your ${
        plan?.name ?? "rented"
      } server is being set up`,
      text:
        `Your request for a ${plan?.name} server was approved and the first month charged. ` +
        `It appears among your servers in a few minutes, ready to deploy to.`,
    }).catch((e) => log(`approve notice: ${e}`));
  }

  /** (Re)issues the partition for an approved rental (e.g. after a failed create). */
  async createPartitionFor(sub: TSub, by: ObjectId) {
    if (!sub.rental.host || !sub.rental.partition) {
      throw Response.badRequest("The rental isn't placed yet");
    }
    const plan = await planModel.findOne({ _id: sub.plan }, {
      projection: { name: 1 },
    });
    return await createPartition({
      host: sub.rental.host,
      name: sub.rental.partition,
      tenant: sub.tenant,
      size: sub.rental.size,
      createdBy: by,
      rental: {
        subscription: sub._id,
        name: `Huruf · ${plan?.name ?? "Server"}`,
      },
    });
  }

  async reject(id: ObjectId, reason: string) {
    const sub = await this.rentalOf(id, { status: "requested" });
    await subscriptionModel.updateOne({ _id: id }, {
      $set: {
        status: "rejected",
        "rental.rejectedReason": reason,
        updatedAt: new Date(),
      },
    });
    notifyOwner(sub.tenant, {
      subject: "{workspace}: your server request wasn't approved",
      text: `Your request for a rented server wasn't approved: ${reason}\n\n` +
        `Nothing was charged; the money you added stays in your wallet.`,
    }).catch((e) => log(`reject notice: ${e}`));
  }

  /** The customer asks for another size; an admin approves it (PLAN §26.9). */
  async requestResize(
    tenant: ObjectId,
    id: ObjectId,
    choice: { plan?: ObjectId; custom?: TResources & { class: ObjectId } },
  ) {
    const sub = await this.rentalOf(id, { tenant, status: "active" });
    const plan = await this.planFor(tenant, choice);
    if (!plan.class!.equals(sub.rental.class)) {
      throw Response.badRequest("A resize stays in the same class");
    }
    if (plan._id.equals(sub.plan)) {
      throw Response.badRequest("That's the current size");
    }
    await subscriptionModel.updateOne({ _id: id }, {
      $set: {
        "rental.pendingChange": { plan: plan._id, requestedAt: new Date() },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * An admin approves a resize: larger starts now, prorated, and the
   * partition grows live; smaller applies at the period end (`renewed`).
   */
  async approveResize(id: ObjectId, admin: ObjectId) {
    const sub = await this.rentalOf(id, { status: "active" });
    const change = sub.rental.pendingChange;
    if (!change) throw Response.badRequest("No resize waiting");
    const plan = await planModel.findOne({ _id: change.plan });
    if (!plan?.resources) throw Response.notFound("Plan not found");
    const size = partitionSize(plan.resources, await this.overheadMb());
    const growing = size.memMb > sub.rental.size.memMb ||
      size.diskGb > sub.rental.size.diskGb || size.cpus > sub.rental.size.cpus;
    if (growing) {
      const [spot] = await this.placement(id, {
        cpus: Math.max(0, size.cpus - sub.rental.size.cpus),
        memMb: Math.max(0, size.memMb - sub.rental.size.memMb),
        diskGb: Math.max(0, size.diskGb - sub.rental.size.diskGb),
      });
      if (!spot?.fits || spot.remainderShort) {
        throw Response.badRequest(
          "It doesn't fit on its machine: move the rental first (Phase 16f) or free room there",
        );
      }
    }
    const result = await this.billing.subscribe(sub.tenant, admin, plan._id, {
      kind: "server",
      subscription: id,
    });
    if (result.result === "pending") {
      throw Response.badRequest(
        "The customer's bank wants them to confirm the payment: ask them to add funds first",
      );
    }
    await subscriptionModel.updateOne({ _id: id }, {
      $unset: { "rental.pendingChange": "" },
      $set: { updatedAt: new Date() },
    });
    if (result.result === "active") await this.applySize(sub, size);
    return result;
  }

  async rejectResize(id: ObjectId, reason: string) {
    const sub = await this.rentalOf(id);
    await subscriptionModel.updateOne({ _id: id }, {
      $unset: { "rental.pendingChange": "" },
      $set: { updatedAt: new Date() },
    });
    notifyOwner(sub.tenant, {
      subject: "{workspace}: your resize wasn't approved",
      text: `Your rented server's resize wasn't approved: ${reason}`,
    }).catch((e) => log(`resize notice: ${e}`));
  }

  private async applySize(sub: TSub, size: TRental["size"]) {
    await subscriptionModel.updateOne({ _id: sub._id }, {
      $set: { "rental.size": size, updatedAt: new Date() },
    });
    if (sub.rental.host && sub.rental.partition) {
      await resizePartition(sub.rental.host, sub.rental.partition, size);
    }
  }

  /** The customer cancels: it ends at the period end (no refund, as plans). */
  cancel(tenant: ObjectId, id: ObjectId) {
    return this.billing.cancel(tenant, { kind: "server", subscription: id });
  }

  // --- Billing's rental hooks (PLAN §26.9) ---

  async overage(sub: WithId<TSubscription>) {
    const ended = await subscriptionPeriodModel.findOne(
      { subscription: sub._id, periodEnd: { $lte: new Date() } },
      { sort: { periodEnd: -1 } },
    );
    if (!ended?.resourcesSnapshot || !sub.rental) return null;
    return overageOf(
      ended.usage?.trafficBytes ?? 0,
      ended.resourcesSnapshot.trafficGb,
      sub.rental.trafficRatePerGb,
    );
  }

  async renewed(sub: WithId<TSubscription>, plan: WithId<TPlan>) {
    if (!sub.rental) return;
    const rental = sub as TSub;
    if (sub.status === "suspended" && sub.rental.host && sub.rental.partition) {
      await startPartition(sub.rental.host, sub.rental.partition);
      await subscriptionModel.updateOne({ _id: sub._id }, {
        $unset: { "rental.suspendedAt": "", "rental.warned": "" },
      });
    }
    // A smaller size scheduled for the period end applies now.
    if (plan.resources && !plan._id.equals(sub.plan)) {
      await this.applySize(
        rental,
        partitionSize(plan.resources, await this.overheadMb()),
      );
    }
  }

  async unpaid(sub: WithId<TSubscription>, now: Date) {
    if (!sub.rental?.host || !sub.rental.partition) return;
    const [graceDays, retentionDays] = await Promise.all([
      readNumberSetting("SHARED_GRACE_DAYS", 3),
      readNumberSetting("SHARED_RETENTION_DAYS", 14),
    ]);
    if (sub.status !== "suspended") {
      if (now.getTime() - sub.pastDueSince!.getTime() < graceDays * DAY_MS) {
        return;
      }
      await stopPartition(sub.rental.host, sub.rental.partition);
      await subscriptionModel.updateOne({ _id: sub._id }, {
        $set: {
          status: "suspended",
          "rental.suspendedAt": now,
          updatedAt: now,
        },
      });
      notifyOwner(sub.tenant, {
        subject: "{workspace}: your rented server is stopped",
        text:
          `Your rented server couldn't renew for ${graceDays} days, so it's stopped. ` +
          `Its data is kept for ${retentionDays} days: pay on the Billing page and it starts again.`,
      }).catch((e) => log(`suspend notice: ${e}`));
      return;
    }
    const suspendedFor = now.getTime() -
      (sub.rental.suspendedAt ?? now).getTime();
    const left = Math.ceil((retentionDays * DAY_MS - suspendedFor) / DAY_MS);
    if (left <= 0) return await this.release(sub as TSub, "released");
    const warned = sub.rental.warned ?? [];
    const due = [7, 1].find((d) => left <= d && !warned.includes(d));
    if (due) {
      await subscriptionModel.updateOne({ _id: sub._id }, {
        $addToSet: { "rental.warned": due },
      });
      notifyOwner(sub.tenant, {
        subject:
          `{workspace}: your rented server's data is deleted in ${left} day${
            left === 1 ? "" : "s"
          }`,
        text:
          `Your rented server is stopped for non-payment. In ${left} day${
            left === 1 ? "" : "s"
          } it's deleted with its data. ` +
          `Pay on the Billing page to start it again.`,
      }).catch((e) => log(`release warning: ${e}`));
    }
  }

  async ended(sub: WithId<TSubscription>) {
    if (sub.rental) await this.release(sub as TSub, "canceled");
  }

  /** Deletes the partition and its data, and the customer's server record. */
  private async release(sub: TSub, status: "released" | "canceled") {
    if (sub.rental.host && sub.rental.partition) {
      await removePartition(sub.rental.host, sub.rental.partition)
        .catch((e) => log(`remove ${sub.rental.partition}: ${e}`));
    }
    if (sub.server) {
      await releaseServer(sub.server, sub.tenant);
      await serverModel.deleteOne({ _id: sub.server, tenant: sub.tenant });
    }
    await subscriptionModel.updateOne({ _id: sub._id }, {
      $set: { status, updatedAt: new Date() },
    });
    if (status === "released") {
      notifyOwner(sub.tenant, {
        subject: "{workspace}: your rented server was deleted",
        text:
          "Your rented server stayed unpaid past the retention period, so it was deleted with its data.",
      }).catch((e) => log(`release notice: ${e}`));
    }
  }

  // --- Traffic (PLAN §26.6) ---

  /**
   * A pool machine's partitions from its summary: each rental's traffic since
   * the last reading goes to its current period, and a rental due for renewal
   * renews here too, so an idle customer still renews (PLAN §26.6 B).
   */
  async recordUsage(
    host: ObjectId,
    partitions: z.output<typeof $partitionUsage>[],
  ) {
    const rented = partitions.filter((p) => !p.remainder);
    if (!rented.length) return;
    const subs = await subscriptionModel.find({
      kind: "server",
      "rental.host": host,
      "rental.partition": { $in: rented.map((p) => p.name) },
      status: { $in: ["active", "pastDue", "suspended"] },
    }).toArray();
    const now = new Date();
    for (const sub of subs) {
      const p = rented.find((x) => x.name === sub.rental!.partition)!;
      const before = sub.rental!.counters;
      const delta = counterDelta(before?.rx, p.rxBytes) +
        counterDelta(before?.tx, p.txBytes);
      await subscriptionModel.updateOne({ _id: sub._id }, {
        $set: { "rental.counters": { rx: p.rxBytes, tx: p.txBytes } },
      });
      if (delta > 0) {
        await subscriptionPeriodModel.updateOne(
          {
            subscription: sub._id,
            periodStart: { $lte: now },
            periodEnd: { $gt: now },
          },
          { $inc: { "usage.trafficBytes": delta } },
        );
      }
      const due = sub.currentPeriodEnd && sub.currentPeriodEnd <= now &&
        (!sub.nextRenewalAttemptAt || sub.nextRenewalAttemptAt <= now);
      if (due) {
        await this.billing.renewIfDue(sub.tenant).catch((e) =>
          log(`renew: ${e}`)
        );
      }
    }
  }

  /** The rentals of a tenant, for its Servers page. */
  list(tenant: ObjectId) {
    return subscriptionModel.find(
      { tenant, kind: "server", status: { $nin: ["released"] } },
      { sort: { startedAt: -1 }, limit: 100 },
    ).toArray();
  }

  /** Waiting for an admin: new requests and resizes. */
  queue() {
    return subscriptionModel.find({
      kind: "server",
      $or: [
        { status: "requested" },
        { "rental.pendingChange": { $exists: true } },
      ],
    }, { sort: { updatedAt: 1 }, limit: 200 }).toArray();
  }
}
