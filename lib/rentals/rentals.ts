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
  movePartition,
  partitionName,
  removePartition,
  resizePartition,
  startPartition,
  stopPartition,
} from "@/lib/pool/pool.ts";
import { reachable } from "@/lib/network/mesh.ts";
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
import {
  TopupStatus,
  walletTopupModel,
} from "@/plugins/Huruf-Tech/thunder-core/schemas/walletTopup.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import type { $partitionUsage } from "@/schemas/protocol/agent.ts";

const DAY_MS = 24 * 60 * 60_000;
const GB = 1e9;
/** Rentals whose partition exists and is paid for. */
const LIVE = ["active", "pastDue", "suspended"] as const;
/** Rentals that run (a suspended one is stopped on purpose). */
const RUNNING = ["active", "pastDue"] as const;

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
      // Charged but not credited yet: the request stays, or a retry would
      // charge again; the money lands when the top-up is settled.
      const charged = await walletTopupModel.findOne({
        idempotencyKey: `fund:rental:${_id}`,
        status: {
          $in: [
            TopupStatus.Paid,
            TopupStatus.Processing,
            TopupStatus.Completed,
          ],
        },
      }, { projection: { _id: 1 } });
      if (charged) {
        log(`request ${_id}: charged, not credited yet: ${error}`);
        return { result: "requested" as const, rental: String(_id) };
      }
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
      status: { $in: [...LIVE] },
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
    if (sub.rental.move) {
      throw Response.badRequest(
        "It's moving: approve the resize once it's done",
      );
    }
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
          "It doesn't fit on its machine: move the rental to one with room first, or free room there",
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

  // --- Moving (PLAN §26.10) ---

  /** Machines a rental can move to, and roughly how long it's down meanwhile. */
  async moveTargets(id: ObjectId) {
    const sub = await this.rentalOf(id, { status: { $in: [...RUNNING] } });
    if (!sub.rental.host || !sub.rental.partition) {
      throw Response.badRequest("The rental isn't placed yet");
    }
    const source = await serverModel.findOne({ _id: sub.rental.host }, {
      projection: { name: 1, mesh: 1, "resources.partitions": 1 },
    });
    const spots = (await this.placement(id))
      .filter((m) => m.server !== String(sub.rental.host));
    const meshes = await serverModel.find({
      _id: { $in: spots.map((m) => new ObjectId(m.server)) },
    }, { projection: { mesh: 1 } }).toArray();
    const used = source?.resources?.partitions
      ?.find((p) => p.name === sub.rental.partition)?.diskUsed ??
      sub.rental.size.diskGb * GB;
    const mbps = await readNumberSetting("POOL_MOVE_MBPS", 50);
    return {
      from: source?.name,
      moving: !!sub.rental.move,
      // Stopping, committing and starting take about a minute; the rest is copying.
      downtimeSec: Math.ceil(60 + used / (mbps * 1e6)),
      targets: spots.map((m) => {
        const target = meshes.find((t) => String(t._id) === m.server);
        return {
          ...m,
          reachable: !!source && !!target && reachable(source, target),
        };
      }),
    };
  }

  /**
   * An admin moves a rental to another pool machine of its class: the
   * partition stops, its data is copied over the private network, and it
   * starts there with the same server, projects and domains.
   */
  async move(id: ObjectId, to: ObjectId, admin: ObjectId) {
    const { targets } = await this.moveTargets(id);
    const spot = targets.find((m) => m.server === String(to));
    if (!spot?.fits) {
      throw Response.badRequest("That machine has no room for this rental");
    }
    if (spot.remainderShort) {
      throw Response.badRequest(
        `Huruf's partition there uses ${spot.remainderUsesMb} MB: free memory there first, or pick another machine`,
      );
    }
    if (!spot.reachable) {
      throw Response.badRequest(
        "The two machines don't reach each other over the private network",
      );
    }
    // Claimed first, so two admins can't move it at once.
    const placeholder = new ObjectId();
    const claimed = await subscriptionModel.findOneAndUpdate(
      {
        _id: id,
        status: { $in: [...RUNNING] },
        "rental.move": { $exists: false },
      },
      {
        $set: {
          "rental.move": {
            to,
            command: placeholder,
            startedAt: new Date(),
            by: admin,
          },
          updatedAt: new Date(),
        },
      },
    );
    if (!claimed?.rental?.host || !claimed.rental.partition) {
      throw Response.badRequest("It's moving already");
    }
    try {
      const { command } = await movePartition({
        from: claimed.rental.host,
        to,
        name: claimed.rental.partition,
        size: claimed.rental.size,
        createdBy: admin,
      });
      await subscriptionModel.updateOne(
        { _id: id, "rental.move.command": placeholder },
        { $set: { "rental.move.command": command } },
      );
    } catch (error) {
      await subscriptionModel.updateOne(
        { _id: id, "rental.move.command": placeholder },
        { $unset: { "rental.move": "" } },
      );
      throw error;
    }
  }

  /**
   * The target's `partition.receive` finished: the rental lives there now and
   * the source's copy goes, or it failed and the source starts it again.
   */
  async moveFinished(
    command: ObjectId,
    outcome: { ok: boolean; error?: string },
  ) {
    const sub = await subscriptionModel.findOne({
      "rental.move.command": command,
    });
    const move = sub?.rental?.move;
    const partition = sub?.rental?.partition;
    if (!sub?.rental?.host || !partition || !move) return;
    const from = sub.rental.host;
    const now = new Date();
    const { modifiedCount } = await subscriptionModel.updateOne(
      { _id: sub._id, "rental.move.command": command },
      outcome.ok
        ? {
          $set: {
            "rental.host": move.to,
            "rental.lastMove": { from, to: move.to, at: now },
            updatedAt: now,
          },
          // The new machine's traffic counters start over: its first reading is the baseline.
          $unset: { "rental.move": "", "rental.counters": "" },
        }
        : {
          $set: {
            "rental.lastMove": {
              from,
              to: move.to,
              at: now,
              error: (outcome.error ?? "The move failed").slice(0, 1_000),
            },
            updatedAt: now,
          },
          $unset: { "rental.move": "" },
        },
    );
    if (!modifiedCount) return; // another result or a cancel got there first
    if (outcome.ok) {
      if (sub.server) {
        await serverModel.updateOne({ _id: sub.server }, {
          $set: { "provider.host": move.to },
        });
      }
      await removePartition(from, partition)
        .catch((e) => log(`remove the moved ${partition}: ${e}`));
    } else {
      await startPartition(from, partition)
        .catch((e) => log(`restart ${partition}: ${e}`));
    }
  }

  /**
   * Gives up on a move that never reports back (an agent restarted during
   * it): the partition starts again where it was, the target's copy goes.
   */
  async cancelMove(id: ObjectId) {
    const sub = await this.rentalOf(id);
    const move = sub.rental.move;
    const partition = sub.rental.partition;
    if (!move || !sub.rental.host || !partition) {
      throw Response.badRequest("It isn't moving");
    }
    const { modifiedCount } = await subscriptionModel.updateOne(
      { _id: id, "rental.move.command": move.command },
      {
        $set: {
          "rental.lastMove": {
            from: sub.rental.host,
            to: move.to,
            at: new Date(),
            error: "Canceled",
          },
          updatedAt: new Date(),
        },
        $unset: { "rental.move": "" },
      },
    );
    if (!modifiedCount) return;
    await removePartition(move.to, partition)
      .catch((e) => log(`remove the moving ${partition}: ${e}`));
    await startPartition(sub.rental.host, partition);
  }

  // --- Uptime (PLAN §26.11) ---

  /**
   * A rented server polled again after its lease ran out: the outage counts
   * against its current period. Suspended rentals are stopped on purpose and
   * don't count.
   */
  async recordDowntime(server: ObjectId, since: Date, now: Date) {
    const sub = await subscriptionModel.findOne({
      server,
      kind: "server",
      status: { $in: [...RUNNING] },
    }, { projection: { _id: 1 } });
    if (!sub) return;
    // ponytail: an outage counts in the period it ends in; split it at period boundaries if credits need it exact.
    await subscriptionPeriodModel.updateOne(
      {
        subscription: sub._id,
        periodStart: { $lte: now },
        periodEnd: { $gt: now },
      },
      { $inc: { "usage.downtimeMs": now.getTime() - since.getTime() } },
    );
  }

  /** This period's uptime so far, in percent, per rental (an ongoing outage included). */
  async uptimes(subs: { _id: ObjectId; server?: ObjectId }[]) {
    const now = new Date();
    const [periods, leases] = await Promise.all([
      subscriptionPeriodModel.find({
        subscription: { $in: subs.map((s) => s._id) },
        periodStart: { $lte: now },
        periodEnd: { $gt: now },
      }, {
        projection: { subscription: 1, periodStart: 1, "usage.downtimeMs": 1 },
      }).toArray(),
      // Past its lease: down since then (what `recordDowntime` adds once it's back).
      serverLeaseModel.find({
        _id: { $in: subs.flatMap((s) => s.server ? [s.server] : []) },
        aliveUntil: { $lt: now },
      }, { projection: { aliveUntil: 1 } }).toArray(),
    ]);
    const out = new Map<string, number>();
    for (const sub of subs) {
      const period = periods.find((p) => p.subscription.equals(sub._id));
      if (!period || !sub.server) continue;
      const lease = leases.find((l) => l._id.equals(sub.server!));
      const ongoing = lease ? now.getTime() - lease.aliveUntil.getTime() : 0;
      const elapsed = now.getTime() - period.periodStart.getTime();
      const down = (period.usage?.downtimeMs ?? 0) + ongoing;
      out.set(
        String(sub._id),
        elapsed > 0 ? Math.max(0, 100 * (1 - down / elapsed)) : 100,
      );
    }
    return out;
  }

  // --- Capacity (PLAN §26.7, §26.11) ---

  /**
   * Per class: what the pool machines offer, what's rented, the spare share
   * kept for moving partitions off a failed machine (`POOL_SPARE_PERCENT`),
   * and revenue against cost.
   */
  async capacity() {
    const [classes, machines, target] = await Promise.all([
      serverClassModel.find({}, {
        sort: { sortOrder: 1 },
        projection: { name: 1 },
      }).toArray(),
      serverModel.find({
        tenant: await this.platformTenant(),
        status: "active",
        "pool.status": "ready",
      }, { projection: { pool: 1 }, limit: 500 }).toArray(),
      readNumberSetting("POOL_SPARE_PERCENT", 20),
    ]);
    const subs = await subscriptionModel.find({
      kind: "server",
      "rental.host": { $in: machines.map((m) => m._id) },
      status: { $in: [...LIVE] },
    }, {
      projection: { plan: 1, status: 1, "rental.host": 1, "rental.size": 1 },
    }).toArray();
    const plans = await planModel.find(
      { _id: { $in: subs.map((s) => s.plan) } },
      { projection: { price: 1 } },
    ).toArray();
    const zero = () => ({ cpus: 0, memMb: 0, diskGb: 0 });
    type TMachine = (typeof machines)[number];
    const offered = (list: TMachine[]) =>
      list.reduce((a, m) => {
        const all = m.pool?.allocatable ?? zero();
        return {
          cpus: a.cpus + all.cpus,
          memMb: a.memMb + all.memMb,
          diskGb: a.diskGb + all.diskGb,
        };
      }, zero());
    const on = (list: TMachine[]) =>
      subs.filter((s) => list.some((m) => m._id.equals(s.rental!.host!)));
    const rented = (list: TMachine[]) =>
      on(list).reduce((a, s) => ({
        cpus: a.cpus + s.rental!.size.cpus,
        memMb: a.memMb + s.rental!.size.memMb,
        diskGb: a.diskGb + s.rental!.size.diskGb,
      }), zero());

    return {
      sparePercent: target,
      classes: classes.map((cls) => {
        const mine = machines.filter((m) => m.pool?.class?.equals(cls._id));
        const accepting = mine.filter((m) => m.pool?.accepting !== false);
        const all = offered(mine);
        // Draining machines take nothing new: only accepting ones have room.
        const freeMemMb = offered(accepting).memMb - rented(accepting).memMb;
        return {
          _id: String(cls._id),
          name: cls.name,
          machines: mine.length,
          accepting: accepting.length,
          allocatable: all,
          rented: rented(mine),
          freeMemMb,
          // Memory never overcommits, so it's what runs out.
          spare: all.memMb ? Math.round(100 * freeMemMb / all.memMb) : 0,
          revenue: on(mine).filter((s) => s.status !== "suspended").reduce(
            (sum, s) =>
              sum +
              (plans.find((p) => p._id.equals(s.plan))?.price.amount ?? 0),
            0,
          ),
          cost: mine.reduce((sum, m) => sum + (m.pool?.monthlyCost ?? 0), 0),
        };
      }),
    };
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
