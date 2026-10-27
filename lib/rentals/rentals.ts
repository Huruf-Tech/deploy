import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import { bootstrapSessionModel } from "@/schemas/infrastructure/bootstrapSession.ts";
import { ObjectId, type WithId } from "mongodb";
import { platformTenant } from "@/lib/billing/platform.ts";
import { Response } from "@/core/http/response.ts";
import { Logger } from "@/core/utils/logger.ts";
import { readNumberSetting } from "@/lib/core/settings.ts";
import type { BillingService, TRentalHooks } from "@/lib/billing/billing.ts";
import type { PaymentService } from "@/lib/payments/payments.ts";
import { notifyOwner } from "@/lib/billing/notify.ts";
import { retireServer } from "@/lib/agents/retire.ts";
import { isMeshPortTaken, meshPlacement } from "@/lib/agents/servers.ts";
import { refreshSpecs } from "@/lib/deploy/specs.ts";
import { freeOf, takenOn } from "@/lib/pool/room.ts";
import {
  createPartition,
  moveAddress,
  movePartition,
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
  LIVE_RENTAL as LIVE,
  RUNNING_RENTAL as RUNNING,
  subscriptionModel,
  type TSubscription,
} from "@/schemas/billing/subscription.ts";
import {
  subscriptionPeriodModel,
  type TSubscriptionPeriod,
} from "@/schemas/billing/subscriptionPeriod.ts";
import {
  TopupStatus,
  walletTopupModel,
} from "@/plugins/Huruf-Tech/thunder-core/schemas/walletTopup.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import type { TPartitionUsage } from "@/schemas/protocol/agent.ts";

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
 * Rentals (PLAN §26, §28): a customer rents a partition on one of the
 * platform's machines. Built on the existing pieces: a size is a server plan, a rental
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
    const sub = await subscriptionModel.findOneAndUpdate(
      { _id: id, tenant, kind: "server", status: "requested" },
      { $set: { status: "canceled", updatedAt: new Date() } },
    );
    if (!sub) throw Response.badRequest("No request to withdraw");
    await this.dropCustomPlan(sub.plan);
  }

  /** A custom size nobody rents any more goes (one is made per request, §26.6 A). */
  private async dropCustomPlan(plan: ObjectId) {
    const inUse = await subscriptionModel.countDocuments({
      $or: [{ plan }, { nextPlan: plan }, {
        "rental.pendingChange.plan": plan,
      }],
      status: { $nin: ["canceled", "rejected", "released"] },
    }, { limit: 1 });
    if (!inUse) await planModel.deleteOne({ _id: plan, custom: true });
  }

  /**
   * The platform's machines of the rental's class (PLAN §28: a machine is for
   * rent once an admin gives it a class) that can take `size` (§26.7):
   * memory and disk never overcommit, CPU up to the class's ratio. Fullest
   * first, so whole machines stay free. `extra` is a resize's growth on the
   * rental's own machine, which may have stopped taking new rentals.
   */
  async placement(
    id: ObjectId,
    extra?: { cpus: number; memMb: number; diskGb: number },
  ) {
    const sub = await this.rentalOf(id);
    const cls = await serverClassModel.findOne({ _id: sub.rental.class });
    const size = extra ?? sub.rental.size;
    const machines = await serverModel.find({
      tenant: await platformTenant(),
      status: "active",
      "pool.status": "ready",
      "pool.class": sub.rental.class,
      ...(extra
        ? { _id: sub.rental.host }
        : { "pool.accepting": { $ne: false } }),
    }, {
      projection: { name: 1, pool: 1, "resources.partitions": 1 },
      limit: 200,
    }).toArray();
    const used = await takenOn(machines);
    return machines.map((m) => {
      const u = used.get(String(m._id))!;
      const free = freeOf(m, u);
      const cpuRoom = m.pool!.allocatable!.cpus * (cls?.cpuOvercommit ?? 1) -
        u.cpus;
      return {
        server: String(m._id),
        name: m.name,
        free,
        cpuRoom,
        fits: free.memMb >= size.memMb && free.diskGb >= size.diskGb &&
          cpuRoom >= size.cpus,
      };
    }).sort((a, b) =>
      Number(b.fits) - Number(a.fits) || a.free.memMb - b.free.memMb
    );
  }

  /**
   * An admin approves a request on a machine of its class (PLAN §26.9, §28): the first
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
    // Throws when another approval or a withdraw got there first.
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
    await subscriptionModel.updateOne({ _id: id, status: "requested" }, {
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
    await this.dropCustomPlan(sub.plan);
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
    // A resize asked for before this one is replaced.
    const replaced = sub.rental.pendingChange?.plan;
    if (replaced && !replaced.equals(plan._id)) {
      await this.dropCustomPlan(replaced);
    }
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
      if (!spot?.fits) {
        throw Response.badRequest(
          "It doesn't fit on its machine: move the rental to one with room first, or free room there",
        );
      }
    }
    const result = await this.billing.subscribe(sub.tenant, admin, plan._id, {
      kind: "server",
      subscription: id,
    }, { customerAway: true });
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
    if (sub.rental.pendingChange) {
      await this.dropCustomPlan(sub.rental.pendingChange.plan);
    }
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

  // --- An admin's hand (support, abuse) ---

  /** Stops a rental; it isn't renewed until an admin resumes it. */
  async hold(id: ObjectId, admin: ObjectId, reason?: string) {
    const sub = await this.rentalOf(id, { status: { $in: [...RUNNING] } });
    if (!sub.rental.host || !sub.rental.partition) {
      throw Response.badRequest("The rental isn't placed yet");
    }
    if (sub.rental.move) throw Response.badRequest("It's being moved");
    await stopPartition(sub.rental.host, sub.rental.partition);
    const now = new Date();
    await subscriptionModel.updateOne({ _id: id }, {
      $set: {
        status: "suspended",
        "rental.suspendedAt": now,
        "rental.held": {
          by: admin,
          at: now,
          status: sub.status as (typeof RUNNING)[number],
          ...(reason ? { reason } : {}),
        },
        updatedAt: now,
      },
    });
    notifyOwner(sub.tenant, {
      subject: "{workspace}: your rented server was stopped by Huruf",
      text: `Huruf stopped your rented server${
        reason ? `: ${reason}` : ""
      }. Its data is kept. Contact support to start it again.`,
    }).catch((e) => log(`hold notice: ${e}`));
  }

  /** Starts a held rental again; a period that ended meanwhile renews next. */
  async resume(id: ObjectId) {
    const sub = await this.rentalOf(id, {
      status: "suspended",
      "rental.held": { $exists: true },
    });
    await startPartition(sub.rental.host!, sub.rental.partition!);
    await subscriptionModel.updateOne({ _id: id }, {
      $set: { status: sub.rental.held!.status, updatedAt: new Date() },
      $unset: { "rental.held": "", "rental.suspendedAt": "" },
    });
    notifyOwner(sub.tenant, {
      subject: "{workspace}: your rented server is running again",
      text: "Huruf started your rented server again.",
    }).catch((e) => log(`resume notice: ${e}`));
  }

  // --- Rentals that didn't arrive (PLAN §26.9) ---

  /**
   * Approved rentals still without a server: being set up, or stuck, with
   * why (the machine couldn't create the partition, or its agent never joined).
   */
  async waiting() {
    const subs = await subscriptionModel.find({
      kind: "server",
      status: { $in: [...RUNNING] },
      "rental.host": { $exists: true },
      server: { $exists: false },
    }, { sort: { updatedAt: 1 }, limit: 100 }).toArray();
    const sessions = await bootstrapSessionModel.find({
      "rental.subscription": { $in: subs.map((s) => s._id) },
    }, {
      sort: { createdAt: -1 },
      projection: {
        rental: 1,
        status: 1,
        error: 1,
        createdAt: 1,
        expiresAt: 1,
        "partition.command": 1,
      },
    }).toArray();
    const [commands, hosts] = await Promise.all([
      agentCommandModel.find({
        _id: { $in: sessions.flatMap((s) => s.partition?.command ?? []) },
      }, { projection: { status: 1, error: 1 } }).toArray(),
      serverModel.find({ _id: { $in: subs.map((s) => s.rental!.host!) } }, {
        projection: { name: 1 },
      }).toArray(),
    ]);
    const now = new Date();
    return subs.map((sub) => {
      const session = sessions.find((s) =>
        s.rental?.subscription.equals(sub._id)
      );
      const command = session?.partition?.command &&
        commands.find((c) => c._id.equals(session.partition!.command!));
      const error = command?.status === "failed"
        ? command.error ?? "The machine couldn't create it"
        : session?.status === "failed"
        ? session.error ?? "Its agent couldn't join"
        : !session || session.expiresAt < now
        ? "Its agent never joined"
        : undefined;
      return {
        sub,
        host: hosts.find((h) => h._id.equals(sub.rental!.host!))?.name,
        since: session?.createdAt ?? sub.updatedAt,
        ...(error ? { error } : {}),
      };
    });
  }

  /**
   * Creates an approved rental's partition again, on its machine or another
   * of its class with room; a half-made one on the old machine goes.
   */
  async recreate(id: ObjectId, admin: ObjectId, host?: ObjectId) {
    const sub = await this.rentalOf(id, {
      status: { $in: [...RUNNING] },
      server: { $exists: false },
    });
    const from = sub.rental.host;
    if (!from || !sub.rental.partition) {
      throw Response.badRequest("The rental isn't placed yet");
    }
    const to = host ?? from;
    if (!to.equals(from)) {
      const spot = (await this.placement(id)).find((m) =>
        m.server === String(to)
      );
      if (!spot?.fits) {
        throw Response.badRequest("That machine has no room for this rental");
      }
      await removePartition(from, sub.rental.partition)
        .catch((e) => log(`remove the failed ${sub.rental.partition}: ${e}`));
      await subscriptionModel.updateOne({ _id: id }, {
        $set: { "rental.host": to, updatedAt: new Date() },
      });
    }
    // Its old join token goes, so only the new partition can join.
    await bootstrapSessionModel.updateMany({
      "rental.subscription": id,
      status: "installing",
    }, { $set: { status: "failed", error: "Created again" } });
    await this.createPartitionFor({
      ...sub,
      rental: { ...sub.rental, host: to },
    }, admin);
  }

  /**
   * Gives the running period's charge back to the customer's wallet and
   * removes the rental with its partition (e.g. it could never be delivered).
   */
  async refund(id: ObjectId, admin: ObjectId, reason?: string) {
    const sub = await this.rentalOf(id, { status: { $in: [...LIVE] } });
    if (sub.rental.move) {
      throw Response.badRequest("It's being moved: cancel the move first");
    }
    const amount = await this.billing.refundCurrent(id, admin);
    await this.release(sub, "canceled");
    notifyOwner(sub.tenant, {
      subject: "{workspace}: your rented server was refunded",
      text: `Huruf gave ${
        (amount / 100).toFixed(2)
      } USD back to your wallet and removed the rented server${
        reason ? `: ${reason}` : ""
      }.`,
    }).catch((e) => log(`refund notice: ${e}`));
    return { amount };
  }

  /** Deletes a rental now, with its partition and data; nothing is refunded. */
  async terminate(id: ObjectId, reason?: string) {
    const sub = await this.rentalOf(id, { status: { $in: [...LIVE] } });
    if (sub.rental.move) {
      throw Response.badRequest("It's being moved: cancel the move first");
    }
    await this.release(sub, "canceled");
    notifyOwner(sub.tenant, {
      subject: "{workspace}: your rented server was deleted by Huruf",
      text: `Huruf deleted your rented server with its data${
        reason ? `: ${reason}` : ""
      }.`,
    }).catch((e) => log(`terminate notice: ${e}`));
  }

  // --- Billing's rental hooks (PLAN §26.9) ---

  overage(sub: WithId<TSubscription>, period: WithId<TSubscriptionPeriod>) {
    if (!period.resourcesSnapshot || !sub.rental) return null;
    return overageOf(
      period.usage?.trafficBytes ?? 0,
      period.resourcesSnapshot.trafficGb,
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

  /** Deletes the partition and its data, and the customer's server with its projects. */
  private async release(sub: TSub, status: "released" | "canceled") {
    if (sub.rental.host && sub.rental.partition) {
      await removePartition(sub.rental.host, sub.rental.partition)
        .catch((e) => log(`remove ${sub.rental.partition}: ${e}`));
    }
    if (sub.server) await retireServer(sub.tenant, sub.server);
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
      projection: {
        name: 1,
        "inventory.publicIp": 1,
        "inventory.privateIp": 1,
        "resources.partitions": 1,
      },
    });
    const spots = (await this.placement(id))
      .filter((m) => m.server !== String(sub.rental.host));
    // The target fetches from the source's address (TCP MOVE_PORT open).
    const reachable = !!source && !!moveAddress(source);
    const used = source?.resources?.partitions
      ?.find((p) => p.name === sub.rental.partition)?.diskUsed ??
      sub.rental.size.diskGb * GB;
    const mbps = await readNumberSetting("POOL_MOVE_MBPS", 50);
    return {
      from: source?.name,
      moving: !!sub.rental.move,
      // Stopping, committing and starting take about a minute; the rest is copying.
      downtimeSec: Math.ceil(60 + used / (mbps * 1e6)),
      targets: spots.map((m) => ({ ...m, reachable })),
    };
  }

  /**
   * An admin moves a rental to another machine of its class: the
   * partition stops, its data is copied over the private network, and it
   * starts there with the same server, projects and domains.
   */
  async move(id: ObjectId, to: ObjectId, admin: ObjectId) {
    const { targets } = await this.moveTargets(id);
    const spot = targets.find((m) => m.server === String(to));
    if (!spot?.fits) {
      throw Response.badRequest("That machine has no room for this rental");
    }
    if (!spot.reachable) {
      throw Response.badRequest(
        "The machine it's on has no address to move from",
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
      // Its private network is reached through the new machine's port now.
      if (sub.server) {
        for (let attempt = 1;; attempt++) {
          const { meshPort, endpoint } = await meshPlacement(move.to);
          try {
            await serverModel.updateOne({ _id: sub.server }, {
              $set: {
                "provider.host": move.to,
                "provider.meshPort": meshPort,
                ...(endpoint ? { "mesh.endpoint": endpoint } : {}),
              },
              ...(endpoint ? {} : { $unset: { "mesh.endpoint": "" } }),
            });
            break;
          } catch (error) {
            if (attempt < 5 && isMeshPortTaken(error)) continue;
            throw error;
          }
        }
        await refreshSpecs([from, move.to, sub.server]);
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

  // --- Capacity (PLAN §26.7, §28) ---

  /**
   * Per machine for rent (a platform machine with a class): what it offers,
   * what the platform's own partitions and rentals take, what's free, and
   * revenue against cost.
   */
  async capacity() {
    const [classes, machines] = await Promise.all([
      serverClassModel.find({}, { projection: { name: 1 } }).toArray(),
      serverModel.find({
        tenant: await platformTenant(),
        status: "active",
        "pool.status": "ready",
        "pool.class": { $exists: true },
      }, {
        projection: { name: 1, pool: 1, "resources.partitions": 1 },
        sort: { name: 1 },
        limit: 500,
      }).toArray(),
    ]);
    const [taken, subs] = await Promise.all([
      takenOn(machines),
      subscriptionModel.find({
        kind: "server",
        "rental.host": { $in: machines.map((m) => m._id) },
        status: { $in: [...LIVE] },
      }, {
        projection: { plan: 1, status: 1, "rental.host": 1, "rental.size": 1 },
      }).toArray(),
    ]);
    const plans = await planModel.find(
      { _id: { $in: subs.map((s) => s.plan) } },
      { projection: { price: 1 } },
    ).toArray();
    return {
      machines: machines.map((m) => {
        const all = m.pool!.allocatable ?? { cpus: 0, memMb: 0, diskGb: 0 };
        const used = taken.get(String(m._id))!;
        const mine = subs.filter((s) => s.rental!.host!.equals(m._id));
        const rentedMemMb = mine.reduce((a, s) => a + s.rental!.size.memMb, 0);
        return {
          _id: String(m._id),
          name: m.name,
          class: classes.find((c) => c._id.equals(m.pool!.class!))?.name,
          accepting: m.pool!.accepting !== false,
          allocatable: all,
          rentedMemMb,
          ownMemMb: used.memMb - rentedMemMb,
          freeMemMb: all.memMb - used.memMb,
          rentals: mine.length,
          revenue: mine.filter((s) => s.status !== "suspended").reduce(
            (sum, s) =>
              sum +
              (plans.find((p) => p._id.equals(s.plan))?.price.amount ?? 0),
            0,
          ),
          cost: m.pool!.monthlyCost ?? 0,
        };
      }),
    };
  }

  // --- Traffic (PLAN §26.6) ---

  /**
   * A machine's partitions from its summary: each rental's traffic since the
   * last reading goes to its current period, and a rental due for renewal
   * renews here too, so an idle customer still renews (PLAN §26.6 B).
   */
  async recordUsage(host: ObjectId, partitions: TPartitionUsage[]) {
    if (!partitions.length) return;
    const subs = await subscriptionModel.find({
      kind: "server",
      "rental.host": host,
      "rental.partition": { $in: partitions.map((p) => p.name) },
      status: { $in: [...LIVE] },
    }).toArray();
    const now = new Date();
    for (const sub of subs) {
      const p = partitions.find((x) => x.name === sub.rental!.partition)!;
      const before = sub.rental!.counters;
      const delta = counterDelta(before?.rx, p.rxBytes) +
        counterDelta(before?.tx, p.txBytes);
      // Only files right under / or an older partition's system files escape
      // its quota (PLAN §28):
      // past its size it's flagged for the admin, and its owner told once.
      const over = p.diskUsed > sub.rental!.size.diskGb * 2 ** 30;
      await subscriptionModel.updateOne({ _id: sub._id }, {
        $set: {
          "rental.counters": { rx: p.rxBytes, tx: p.txBytes },
          ...(over
            ? {
              "rental.overDisk": {
                since: sub.rental!.overDisk?.since ?? now,
                bytes: p.diskUsed,
              },
            }
            : {}),
        },
        ...(!over && sub.rental!.overDisk
          ? { $unset: { "rental.overDisk": "" } }
          : {}),
      });
      if (over && !sub.rental!.overDisk) {
        notifyOwner(sub.tenant, {
          subject:
            "{workspace}: your rented server uses more disk than its size",
          text:
            `Your rented server uses ${
              Math.ceil(p.diskUsed / 2 ** 30)
            } GB of disk, more than its ${sub.rental!.size.diskGb} GB. ` +
            `Free some space (old images, logs, packages) or ask for a bigger size.`,
        }).catch((e) => log(`disk notice: ${e}`));
      }
      // The latest period: traffic while a renewal waits counts in the
      // period it follows, so its overage is charged with the renewal.
      if (delta > 0) {
        await subscriptionPeriodModel.findOneAndUpdate(
          { subscription: sub._id, periodStart: { $lte: now } },
          { $inc: { "usage.trafficBytes": delta } },
          { sort: { periodStart: -1 }, projection: { _id: 1 } },
        );
      }
      const due = sub.currentPeriodEnd && sub.currentPeriodEnd <= now &&
        (!sub.nextRenewalAttemptAt || sub.nextRenewalAttemptAt <= now);
      // Only this rental: the poll waits on it (PLAN §20).
      if (due) {
        await this.billing.renewOne(sub, now).catch((e) => log(`renew: ${e}`));
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
