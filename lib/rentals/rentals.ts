import { moveRelay } from "@/lib/domains/tunnels.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import { bootstrapSessionModel } from "@/schemas/infrastructure/bootstrapSession.ts";
import { ObjectId, type WithId } from "mongodb";
import { platformTenantId } from "@/lib/billing/platform.ts";
import { Response } from "@/core/http/response.ts";
import { Logger } from "@/core/utils/logger.ts";
import { readNumberSetting } from "@/lib/core/settings.ts";
import {
  addInterval,
  type BillingService,
  type TRentalHooks,
} from "@/lib/billing/billing.ts";
import type { PaymentService } from "@/lib/payments/payments.ts";
import { notifyOwner } from "@/lib/billing/notify.ts";
import { retireServer } from "@/lib/agents/retire.ts";
import { profilesOf } from "@/lib/agents/profile.ts";
import { isMeshPortTaken, meshPlacement } from "@/lib/agents/servers.ts";
import { refreshSpecs } from "@/lib/deploy/specs.ts";
import { freeOf, takenOn } from "@/lib/pool/room.ts";
import type { EarningsService } from "@/lib/market/earnings.ts";
import { linked, RENTABLE } from "@/lib/market/market.ts";
import {
  hourlyOf,
  monthlyOf,
  type TRentPrices,
  type TResources,
} from "@/lib/market/pricing.ts";
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
const HOUR_MS = 60 * 60_000;
const GB = 1e9;
/** The customer answers an owner's move proposal within this (PLAN §30.8). */
const PROPOSAL_MS = 72 * HOUR_MS;
/** No proposals this close to a renewal: the owner can stop renewing instead. */
const PROPOSAL_CUTOFF_MS = 3 * DAY_MS;

const log = (text: string) => Logger.warn(`[rentals] ${text}`);

export type { TResources };

/** A rental's size on a machine (PLAN §30.5): an amount, or the whole machine. */
export type TChoice = Partial<TResources> & { whole?: boolean };

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

/** The partition's size: what the apps get plus what its own Docker and agent use. */
const partitionSize = (r: TResources, overheadMb: number) => ({
  cpus: r.vcpu,
  memMb: r.memMb + overheadMb,
  diskGb: r.diskGb,
});

/** The end of a committed term of `months`, from `start`. */
const termEnd = (start: Date, months: number) => {
  let end = start;
  for (let i = 0; i < months; i++) end = addInterval(end, "month");
  return end;
};

type TRental = NonNullable<TSubscription["rental"]>;
type TSub = WithId<TSubscription> & { rental: TRental };

/**
 * Rentals (PLAN §26, §28, §30): a customer rents a partition, or the whole
 * machine, of any machine for rent in the market. The machine prices it; a
 * rental is a server subscription with its own private plan, and the
 * partition joins the customer's tenant as an ordinary (rented) server. The
 * machine's owner accepts requests (or auto-accept does); the money of each
 * month matures into the owner's earnings (`EarningsService`).
 */
export class RentalService implements TRentalHooks {
  constructor(
    private readonly billing: BillingService,
    private readonly payments: Pick<PaymentService, "fundNow">,
    private readonly earnings: EarningsService,
  ) {}

  private overheadMb() {
    return readNumberSetting("PARTITION_OVERHEAD_MB", 128);
  }

  /** A machine for rent in the market, or 404. */
  private async rentable(id: ObjectId) {
    const machine = await serverModel.findOne({ _id: id, ...RENTABLE }, {
      projection: {
        tenant: 1,
        name: 1,
        pool: 1,
        provider: 1,
        resources: 1,
        inventory: 1,
        createdAt: 1,
      },
    });
    if (!machine?.pool?.rent) throw Response.notFound("Machine not for rent");
    return machine as typeof machine & {
      pool: NonNullable<typeof machine.pool> & {
        rent: { prices: TRentPrices; autoAccept: boolean };
      };
    };
  }

  /**
   * A size's monthly price on a machine (PLAN §30.3), checked against its
   * free room: memory, disk and CPU are never sold twice. The whole machine
   * is offered only while nothing else runs on it (§29).
   */
  async quote(machineId: ObjectId, choice: TChoice, opts: {
    /** A resize: its own partition's size counts as free. */
    current?: TRental["size"];
    /** A move or proposal: the machine may have stopped taking rentals. */
    machine?: Awaited<ReturnType<RentalService["rentable"]>>;
  } = {}) {
    const m = opts.machine ?? await this.rentable(machineId);
    const overheadMb = await this.overheadMb();
    const all = m.pool.allocatable ?? { cpus: 0, memMb: 0, diskGb: 0 };
    let r: TResources;
    if (choice.whole) {
      const profile = (await profilesOf([m])).get(String(m._id));
      if (!profile?.dedicated && !opts.current) {
        throw Response.badRequest(
          `The whole machine isn't available: ${
            profile?.notDedicated ?? "something else runs on it"
          }`,
        );
      }
      r = {
        vcpu: all.cpus,
        memMb: all.memMb - overheadMb,
        diskGb: all.diskGb,
      };
    } else {
      const { vcpu = 0, memMb = 0, diskGb = 0 } = choice;
      if (
        vcpu < 0.25 || vcpu * 4 % 1 !== 0 ||
        memMb < 512 || memMb % 256 !== 0 ||
        diskGb < 5 || diskGb % 1 !== 0
      ) {
        throw Response.badRequest(
          "Sizes go in steps of 0.25 vCPU, 0.25 GB of memory and 1 GB of disk, from 0.25 vCPU, 0.5 GB and 5 GB",
        );
      }
      r = { vcpu, memMb, diskGb };
    }
    const size = partitionSize(r, overheadMb);
    const used = (await takenOn([m])).get(String(m._id))!;
    const free = freeOf(m, used);
    const room = {
      cpus: all.cpus - used.cpus + (opts.current?.cpus ?? 0),
      memMb: free.memMb + (opts.current?.memMb ?? 0),
      diskGb: free.diskGb + (opts.current?.diskGb ?? 0),
    };
    const fits = size.cpus <= room.cpus + 1e-9 && size.memMb <= room.memMb &&
      size.diskGb <= room.diskGb;
    const prices = m.pool.rent.prices;
    const hourly = hourlyOf(prices, r, overheadMb, choice.whole);
    const perVcpu = await readNumberSetting("RENTAL_TRAFFIC_PER_VCPU_GB", 100);
    return {
      machine: m,
      resources: r,
      size,
      fits,
      room,
      hourly,
      price: monthlyOf(hourly),
      trafficGb: Math.round(r.vcpu * perVcpu),
      trafficRatePerGb: prices.trafficGb,
      overheadMb,
    };
  }

  /** A private plan for one rental, priced by its machine (PLAN §30.3). */
  private async rentalPlan(
    tenant: ObjectId,
    q: Awaited<ReturnType<RentalService["quote"]>>,
    whole?: boolean,
  ) {
    const _id = new ObjectId();
    const r = q.resources;
    const plan = $plan.parse({
      name: whole
        ? `${q.machine.name} (whole)`
        : `${r.vcpu} vCPU · ${r.memMb / 1024} GB`,
      slug: `rental-${_id}`,
      description: `${q.machine.name}: ${r.vcpu} vCPU, ${
        Math.round(r.memMb / 102.4) / 10
      } GB memory, ${r.diskGb} GB disk`,
      kind: "server",
      custom: true,
      resources: { ...r, trafficGb: q.trafficGb },
      visibility: "private",
      allowedTenants: [tenant],
      price: { amount: q.price, currency: "usd", interval: "month" },
    });
    await planModel.insertOne({ _id, ...plan });
    return { _id, ...plan } as WithId<TPlan>;
  }

  /**
   * A customer requests a machine from the market (PLAN §30.5): a size and a
   * committed term, the first month put in their wallet now (3-D Secure in the
   * browser), charged when the owner accepts. Auto-accept accepts at once.
   */
  async request(
    tenant: ObjectId,
    user: ObjectId,
    choice: TChoice & {
      machine: ObjectId;
      termMonths: number;
      waiveWithdrawal: boolean;
    },
  ) {
    if (!choice.waiveWithdrawal) {
      throw Response.badRequest(
        "Agree that the server starts at once, so the paid month isn't refundable",
      );
    }
    const q = await this.quote(choice.machine, choice);
    if (!q.fits) throw Response.badRequest("That machine has no room for it");
    if (await linked(tenant, q.machine.tenant)) {
      throw Response.forbidden("You can't rent a machine of your own");
    }
    const plan = await this.rentalPlan(tenant, q, choice.whole);
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
        host: q.machine._id,
        owner: q.machine.tenant,
        ...(choice.whole ? { whole: true } : {}),
        term: { months: choice.termMonths },
        waivedWithdrawalAt: now,
        size: q.size,
        trafficRatePerGb: q.trafficRatePerGb,
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
      await planModel.deleteOne({ _id: plan._id });
      throw error;
    }
    if (q.machine.pool.rent.autoAccept) {
      try {
        await this.approve(_id, user);
        return { result: "active" as const, rental: String(_id) };
      } catch (error) {
        log(
          `auto-accept ${_id}: ${
            error instanceof Response ? error.status : error
          }`,
        );
      }
    } else {
      notifyOwner(q.machine.tenant, {
        subject: `{workspace}: a rental request for ${q.machine.name}`,
        text:
          `Someone asked to rent ${q.machine.name} (${q.resources.vcpu} vCPU, ${
            q.resources.memMb / 1024
          } GB memory, ${q.resources.diskGb} GB disk) for ${choice.termMonths} month(s). ` +
          `Accept or decline it on the machine's page within 72 hours.`,
      }).catch((e) => log(`request notice: ${e}`));
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

  /** The rental of one of `owner`'s machines (the owner side, PLAN §30.5). */
  ownedRental(owner: ObjectId, id: ObjectId, filter: object = {}) {
    return this.rentalOf(id, { "rental.owner": owner, ...filter });
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

  /** A rental's own plan nobody uses any more goes (one is made per request and resize). */
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
   * Requests nobody accepted in time (PLAN §30.5) are declined; nothing was
   * charged, the money stays in the customer's wallet.
   */
  async expireRequests(filter: object = {}) {
    const hours = await readNumberSetting("RENTAL_REQUEST_HOURS", 72);
    const stale = await subscriptionModel.find({
      kind: "server",
      status: "requested",
      startedAt: { $lt: new Date(Date.now() - hours * HOUR_MS) },
      ...filter,
    }, { projection: { _id: 1 }, limit: 50 }).toArray();
    for (const s of stale) {
      await this.reject(s._id, "Not accepted in time").catch((e) =>
        log(`expire ${s._id}: ${e}`)
      );
    }
  }

  /** Whether a rental fits on its machine (a resize: only its growth). */
  async placement(id: ObjectId, extra?: TRental["size"]) {
    const sub = await this.rentalOf(id);
    const host = sub.rental.host;
    if (!host) return { fits: false };
    const machine = await serverModel.findOne({ _id: host }, {
      projection: { pool: 1, "resources.partitions": 1 },
    });
    if (!machine?.pool?.allocatable) return { fits: false };
    const used = (await takenOn([machine])).get(String(host))!;
    const free = freeOf(machine, used);
    // A requested rental isn't counted in `used` yet; an approved one is.
    const size = extra ?? sub.rental.size;
    return {
      fits: free.memMb >= size.memMb && free.diskGb >= size.diskGb &&
        machine.pool.allocatable.cpus - used.cpus + 1e-9 >= size.cpus,
    };
  }

  /**
   * The owner (or auto-accept) accepts a request (PLAN §30.5): the first
   * month is charged, the term starts, and the partition is created; its
   * agent joins the customer's tenant as a rented server.
   */
  async approve(id: ObjectId, by: ObjectId, owner?: ObjectId) {
    const sub = await this.rentalOf(id, {
      status: "requested",
      ...(owner ? { "rental.owner": owner } : {}),
    });
    const host = sub.rental.host!;
    if (!(await this.placement(id)).fits) {
      throw Response.badRequest("The machine has no room for this rental now");
    }
    // Throws when another approval or a withdraw got there first.
    await this.billing.activate(id, by);
    const name = partitionName(id);
    const now = new Date();
    await subscriptionModel.updateOne({ _id: id }, {
      $set: {
        "rental.partition": name,
        "rental.term.until": termEnd(now, sub.rental.term?.months ?? 1),
        updatedAt: now,
      },
    });
    await this.createPartitionFor({
      ...sub,
      rental: { ...sub.rental, host, partition: name },
    }, by);
    const plan = await planModel.findOne({ _id: sub.plan }, {
      projection: { name: 1 },
    });
    notifyOwner(sub.tenant, {
      subject: `{workspace}: your ${
        plan?.name ?? "rented"
      } server is being set up`,
      text:
        `Your request for a ${plan?.name} server was accepted and the first month charged. ` +
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

  async reject(id: ObjectId, reason: string, owner?: ObjectId) {
    const sub = await this.rentalOf(id, {
      status: "requested",
      ...(owner ? { "rental.owner": owner } : {}),
    });
    await subscriptionModel.updateOne({ _id: id, status: "requested" }, {
      $set: {
        status: "rejected",
        "rental.rejectedReason": reason,
        updatedAt: new Date(),
      },
    });
    notifyOwner(sub.tenant, {
      subject: "{workspace}: your server request wasn't accepted",
      text: `Your request for a rented server wasn't accepted: ${reason}\n\n` +
        `Nothing was charged; the money you added stays in your wallet.`,
    }).catch((e) => log(`reject notice: ${e}`));
    await this.dropCustomPlan(sub.plan);
  }

  /** The customer asks for another size on the same machine; its owner accepts it. */
  async requestResize(tenant: ObjectId, id: ObjectId, choice: TResources) {
    const sub = await this.rentalOf(id, { tenant, status: "active" });
    if (sub.rental.whole) {
      throw Response.badRequest("It has the whole machine already");
    }
    const q = await this.quote(sub.rental.host!, choice, {
      current: sub.rental.size,
      machine: await this.machineOf(sub.rental.host!),
    });
    if (
      q.size.cpus === sub.rental.size.cpus &&
      q.size.memMb === sub.rental.size.memMb &&
      q.size.diskGb === sub.rental.size.diskGb
    ) throw Response.badRequest("That's the current size");
    if (!q.fits) throw Response.badRequest("Its machine has no room for that");
    const plan = await this.rentalPlan(tenant, q);
    await subscriptionModel.updateOne({ _id: id }, {
      $set: {
        "rental.pendingChange": { plan: plan._id, requestedAt: new Date() },
        updatedAt: new Date(),
      },
    });
    // A resize asked for before this one is replaced.
    const replaced = sub.rental.pendingChange?.plan;
    if (replaced) await this.dropCustomPlan(replaced);
  }

  /** A resize's price on its rental's machine (it may have stopped taking rentals). */
  async quoteResize(tenant: ObjectId, id: ObjectId, choice: TChoice) {
    const sub = await this.rentalOf(id, { tenant });
    return await this.quote(sub.rental.host!, choice, {
      current: sub.rental.size,
      machine: await this.machineOf(sub.rental.host!),
    });
  }

  /** A machine for rent, even one that stopped taking new rentals. */
  private async machineOf(id: ObjectId) {
    const machine = await serverModel.findOne({
      _id: id,
      "pool.rent": { $exists: true },
    }, {
      projection: {
        tenant: 1,
        name: 1,
        pool: 1,
        provider: 1,
        resources: 1,
        inventory: 1,
        createdAt: 1,
      },
    });
    if (!machine?.pool?.rent) throw Response.notFound("Machine not for rent");
    return machine as Awaited<ReturnType<RentalService["rentable"]>>;
  }

  /**
   * The owner accepts a resize: larger starts now, prorated, and the
   * partition grows live; smaller applies at the period end (`renewed`).
   */
  async approveResize(id: ObjectId, by: ObjectId, owner?: ObjectId) {
    const sub = await this.rentalOf(id, {
      status: "active",
      ...(owner ? { "rental.owner": owner } : {}),
    });
    const change = sub.rental.pendingChange;
    if (!change) throw Response.badRequest("No resize waiting");
    if (sub.rental.move) {
      throw Response.badRequest(
        "It's moving: accept the resize once it's done",
      );
    }
    const plan = await planModel.findOne({ _id: change.plan });
    if (!plan?.resources) throw Response.notFound("Plan not found");
    const size = partitionSize(plan.resources, await this.overheadMb());
    const growing = size.memMb > sub.rental.size.memMb ||
      size.diskGb > sub.rental.size.diskGb || size.cpus > sub.rental.size.cpus;
    if (growing) {
      const { fits } = await this.placement(id, {
        cpus: Math.max(0, size.cpus - sub.rental.size.cpus),
        memMb: Math.max(0, size.memMb - sub.rental.size.memMb),
        diskGb: Math.max(0, size.diskGb - sub.rental.size.diskGb),
      });
      if (!fits) {
        throw Response.badRequest(
          "It doesn't fit on the machine any more: free room there first",
        );
      }
    }
    const result = await this.billing.subscribe(sub.tenant, by, plan._id, {
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

  async rejectResize(id: ObjectId, reason: string, owner?: ObjectId) {
    const sub = await this.rentalOf(id, owner ? { "rental.owner": owner } : {});
    await subscriptionModel.updateOne({ _id: id }, {
      $unset: { "rental.pendingChange": "" },
      $set: { updatedAt: new Date() },
    });
    notifyOwner(sub.tenant, {
      subject: "{workspace}: your resize wasn't accepted",
      text: `Your rented server's resize wasn't accepted: ${reason}`,
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

  /**
   * The customer cancels (PLAN §30.5): it runs to the end of the paid month
   * and doesn't renew; a paid month isn't refunded.
   */
  cancel(tenant: ObjectId, id: ObjectId) {
    return this.billing.cancel(tenant, { kind: "server", subscription: id });
  }

  /**
   * The owner stops renting a rental out (PLAN §30.5): it ends at the later
   * of its committed term and its paid month; the customer is told.
   */
  async end(owner: ObjectId, id: ObjectId) {
    const sub = await this.ownedRental(owner, id, {
      status: { $in: [...LIVE] },
    });
    const until = sub.rental.term?.until;
    const endAt = new Date(Math.max(
      until?.getTime() ?? 0,
      sub.currentPeriodEnd?.getTime() ?? Date.now(),
    ));
    await subscriptionModel.updateOne({ _id: id }, {
      $set: { "rental.endAt": endAt, updatedAt: new Date() },
    });
    notifyOwner(sub.tenant, {
      subject: "{workspace}: your rented server ends",
      text:
        `The machine's owner stops renting it out. Your rented server keeps running until ${
          endAt.toISOString().slice(0, 10)
        }, the end of your term and paid month, and is then deleted with its data. ` +
        `Rent another machine in the market and move your projects before then.`,
    }).catch((e) => log(`end notice: ${e}`));
    return { endAt };
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
   * of the same owner with room; a half-made one on the old machine goes.
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
      const machine = await this.machineOf(to);
      if (!sub.rental.owner || !machine.tenant.equals(sub.rental.owner)) {
        throw Response.badRequest(
          "Only onto another machine of the same owner",
        );
      }
      const plan = await planModel.findOne({ _id: sub.plan }, {
        projection: { resources: 1 },
      });
      const q = await this.quote(
        to,
        sub.rental.whole ? { whole: true } : plan?.resources ?? {},
        { machine },
      );
      if (!q.fits) {
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

  // --- Billing's rental hooks (PLAN §26.9, §30) ---

  /** Who earns a period being charged, at what commission (PLAN §30.7). */
  periodFields(sub: WithId<TSubscription>) {
    return this.earnings.periodFields(sub);
  }

  /**
   * Before a rental renews (PLAN §30.6): a machine down past the limit has
   * left, so the rental ends without another charge ("skip"); one its owner
   * stopped renting out ends at its date ("end").
   */
  async beforeRenew(sub: WithId<TSubscription>, now: Date) {
    if (!sub.rental) return undefined;
    if ((await this.earnings.downTooLong([sub], now)).size) {
      await this.lose(sub as TSub, now);
      return "skip" as const;
    }
    if (sub.rental.endAt && sub.currentPeriodEnd! >= sub.rental.endAt) {
      return "end" as const;
    }
    return undefined;
  }

  /**
   * Its machine left (PLAN §30.6): the rental ends without another charge,
   * its last month matures as "left" (the customer gets the downtime back,
   * the owner nothing) and both sides are told.
   */
  private async lose(sub: TSub, now: Date) {
    const { modifiedCount } = await subscriptionModel.updateOne(
      { _id: sub._id, status: { $in: [...RUNNING] } },
      {
        $set: {
          status: "canceled",
          "rental.lostAt": now,
          autoRenew: false,
          updatedAt: now,
        },
      },
    );
    if (!modifiedCount) return;
    await this.earnings.settleDue({ subscription: sub._id }, now);
    if (sub.rental.host && sub.rental.partition) {
      await removePartition(sub.rental.host, sub.rental.partition)
        .catch((e) => log(`remove the lost ${sub.rental.partition}: ${e}`));
    }
    if (sub.server) await retireServer(sub.tenant, sub.server);
    notifyOwner(sub.tenant, {
      subject: "{workspace}: your rented server's machine is gone",
      text:
        "The machine your rented server ran on was down for more than 72 hours, so the rental ended. " +
        "You weren't charged again, and the downtime of your last month is back in your wallet. " +
        "Rent another machine in the market.",
    }).catch((e) => log(`lost notice: ${e}`));
    if (sub.rental.owner) {
      notifyOwner(sub.rental.owner, {
        subject: "{workspace}: a rental on your machine ended",
        text:
          "One of your machines was down for more than 72 hours, so a rental on it ended. " +
          "You earn nothing for its last month, and a broken term forfeits the machine's security to its renters.",
      }).catch((e) => log(`lost owner notice: ${e}`));
    }
  }

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
    await this.earnings.settleDue({ subscription: sub._id });
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
    await this.earnings.settleDue({ subscription: sub._id }, now);
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
    if (!sub.rental) return;
    await this.earnings.settleDue({ subscription: sub._id });
    await this.release(sub as TSub, "canceled");
  }

  /** Deletes the partition and its data, and the customer's server with its projects. */
  private async release(sub: TSub, status: "released" | "canceled") {
    if (sub.rental.host && sub.rental.partition) {
      await removePartition(sub.rental.host, sub.rental.partition)
        .catch((e) => log(`remove ${sub.rental.partition}: ${e}`));
    }
    if (sub.server) await retireServer(sub.tenant, sub.server);
    // A partition still being set up holds its machine's room: its join
    // token goes, so the room is free again.
    await bootstrapSessionModel.updateMany({
      "rental.subscription": sub._id,
      status: "installing",
    }, { $set: { status: "failed", error: "The rental ended" } });
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

  // --- Moving (PLAN §26.10, §30.8) ---

  /**
   * Machines a rental can move to, and roughly how long it's down meanwhile.
   * `owner`: an owner's proposal, to their own machines or ones that accept
   * at once (auto-accept); otherwise (an admin) any machine for rent.
   */
  async moveTargets(id: ObjectId, owner?: ObjectId) {
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
    const candidates = await serverModel.find({
      ...RENTABLE,
      _id: { $ne: sub.rental.host },
      ...(owner
        ? { $or: [{ tenant: owner }, { "pool.rent.autoAccept": true }] }
        : {}),
    }, {
      projection: {
        tenant: 1,
        name: 1,
        pool: 1,
        provider: 1,
        resources: 1,
        inventory: 1,
        createdAt: 1,
      },
      limit: 200,
    }).toArray();
    const plan = await planModel.findOne({ _id: sub.plan }, {
      projection: { resources: 1 },
    });
    const choice = sub.rental.whole ? { whole: true } : plan?.resources ?? {};
    const spots = [];
    for (const m of candidates) {
      // Never onto the customer's own machines (PLAN §30.10).
      if (m.tenant.equals(sub.tenant)) continue;
      const q = await this.quote(m._id, choice, {
        machine: m as Awaited<ReturnType<RentalService["rentable"]>>,
      }).catch(() => null);
      if (!q) continue;
      spots.push({
        server: String(m._id),
        name: m.name,
        free: { memMb: q.room.memMb, diskGb: q.room.diskGb },
        cpuRoom: q.room.cpus,
        fits: q.fits,
        price: q.price,
        own: !!owner && m.tenant.equals(owner),
      });
    }
    // The target fetches from the source's address (TCP MOVE_PORT open), or
    // through the tunnel server when the platform's tunnels are configured.
    const reachable = !!source &&
      (!!moveAddress(source) ||
        !!await moveRelay(source._id, source._id, sub.rental.partition));
    const used = source?.resources?.partitions
      ?.find((p) => p.name === sub.rental.partition)?.diskUsed ??
      sub.rental.size.diskGb * GB;
    const mbps = await readNumberSetting("POOL_MOVE_MBPS", 50);
    return {
      from: source?.name,
      moving: !!sub.rental.move,
      // Stopping, committing and starting take about a minute; the rest is copying.
      downtimeSec: Math.ceil(60 + used / (mbps * 1e6)),
      targets: spots.sort((a, b) => Number(b.fits) - Number(a.fits))
        .map((m) => ({ ...m, reachable })),
    };
  }

  /**
   * Moves a rental to another machine: the partition stops, its data is
   * copied (encrypted, §26.10), and it starts there with the same server,
   * projects and domains. An admin's move, or one the customer agreed to.
   */
  async move(
    id: ObjectId,
    to: ObjectId,
    by: ObjectId,
    opts: { agreed?: boolean; owner?: ObjectId } = {},
  ) {
    const { targets } = await this.moveTargets(id, opts.owner);
    const spot = targets.find((m) => m.server === String(to));
    if (!spot?.fits) {
      throw Response.badRequest("That machine has no room for this rental");
    }
    if (!spot.reachable) {
      throw Response.badRequest(
        "The machine it's on has no address to move from, and tunnels aren't set up",
      );
    }
    // Claimed first, so two moves can't start at once.
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
            by,
            ...(opts.agreed ? { agreed: true } : {}),
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
        createdBy: by,
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
   * The owner proposes moving a rental (PLAN §30.8), e.g. a fault: to one of
   * their machines or one that accepts at once. The customer answers within
   * 72 hours; never this close to a renewal, and only while the machine is up
   * (the data is copied from it).
   */
  async propose(owner: ObjectId, id: ObjectId, to: ObjectId, reason?: string) {
    const sub = await this.ownedRental(owner, id, {
      status: { $in: [...RUNNING] },
    });
    if (sub.rental.move) throw Response.badRequest("It's being moved");
    const now = new Date();
    if (
      sub.currentPeriodEnd &&
      sub.currentPeriodEnd.getTime() - now.getTime() < PROPOSAL_CUTOFF_MS
    ) {
      throw Response.badRequest(
        "It renews within 3 days: stop renewing it instead, or propose after the renewal",
      );
    }
    const lease = sub.server &&
      await serverLeaseModel.findOne({ _id: sub.server }, {
        projection: { aliveUntil: 1 },
      });
    if (!lease || lease.aliveUntil < now) {
      throw Response.badRequest(
        "It's down: a move copies its data from the machine, so it must be up",
      );
    }
    const { targets } = await this.moveTargets(id, owner);
    const spot = targets.find((t) => t.server === String(to));
    if (!spot?.fits) {
      throw Response.badRequest("That machine has no room for this rental");
    }
    await subscriptionModel.updateOne({ _id: id }, {
      $set: {
        "rental.proposal": {
          to,
          at: now,
          expiresAt: new Date(now.getTime() + PROPOSAL_MS),
          price: spot.price,
          ...(reason ? { reason } : {}),
        },
        updatedAt: now,
      },
    });
    notifyOwner(sub.tenant, {
      subject: "{workspace}: move your rented server?",
      text:
        `The owner of the machine your rented server runs on asks to move it to ${spot.name}` +
        `${reason ? ` (${reason})` : ""}, at ${
          (spot.price / 100).toFixed(2)
        } USD a month from your next renewal. ` +
        `Accept, decline or pick another machine on its page within 72 hours.`,
    }).catch((e) => log(`proposal notice: ${e}`));
  }

  /**
   * The customer agrees (PLAN §30.8), to the proposed machine or one they
   * pick (theirs to choose among machines that accept at once): it moves now.
   */
  async acceptProposal(
    tenant: ObjectId,
    user: ObjectId,
    id: ObjectId,
    to?: ObjectId,
  ) {
    const sub = await this.rentalOf(id, {
      tenant,
      status: { $in: [...RUNNING] },
      "rental.proposal.expiresAt": { $gt: new Date() },
    }).catch(() => {
      throw Response.badRequest("No move waiting for your answer");
    });
    const target = to ?? sub.rental.proposal!.to;
    await this.move(id, target, user, {
      agreed: true,
      owner: sub.rental.owner,
    });
  }

  /** The customer declines: nothing changes. */
  async declineProposal(tenant: ObjectId, id: ObjectId) {
    const sub = await this.rentalOf(id, { tenant });
    if (!sub.rental.proposal) throw Response.badRequest("No move waiting");
    await subscriptionModel.updateOne({ _id: id }, {
      $unset: { "rental.proposal": "" },
      $set: { updatedAt: new Date() },
    });
    if (sub.rental.owner) {
      notifyOwner(sub.rental.owner, {
        subject: "{workspace}: a renter declined your move",
        text:
          "A renter declined moving their rented server off your machine. It stays where it is; " +
          "shutting the machine down before their term ends forfeits its security.",
      }).catch((e) => log(`decline notice: ${e}`));
    }
  }

  /**
   * An agreed move is done (PLAN §30.8): the target's owner earns their own
   * price for the rest of the month, its price applies from the renewal, and
   * the term carries over.
   */
  private async agreedMoveDone(sub: TSub, to: ObjectId, now: Date) {
    const target = await this.machineOf(to);
    const plan = await planModel.findOne({ _id: sub.plan });
    const q = await this.quote(
      to,
      sub.rental.whole ? { whole: true } : plan?.resources ?? {},
      { machine: target, current: sub.rental.size },
    );
    const next = await this.rentalPlan(sub.tenant, q, sub.rental.whole);
    await subscriptionModel.updateOne({ _id: sub._id }, {
      $set: {
        nextPlan: next._id,
        "rental.owner": target.tenant,
        "rental.trafficRatePerGb": q.trafficRatePerGb,
        updatedAt: now,
      },
      $unset: { "rental.proposal": "" },
    });
    const period = await subscriptionPeriodModel.findOne({
      subscription: sub._id,
      periodStart: { $lte: now },
      periodEnd: { $gt: now },
    });
    const platform = await platformTenantId();
    if (period?.market && !(platform && target.tenant.equals(platform))) {
      const left = (period.periodEnd.getTime() - now.getTime()) /
        (period.periodEnd.getTime() - period.periodStart.getTime());
      await subscriptionPeriodModel.updateOne({ _id: period._id }, {
        $set: {
          "market.split": {
            owner: target.tenant,
            machine: to,
            commission: await this.earnings.commissionOf(target.tenant),
            from: now,
            amount: Math.round(q.price * left),
          },
        },
      });
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
      if (move.agreed) {
        await this.agreedMoveDone(sub as TSub, move.to, now)
          .catch((e) => log(`agreed move ${sub._id}: ${e}`));
      }
    } else {
      await startPartition(from, partition)
        .catch((e) => log(`restart ${partition}: ${e}`));
      if (move.agreed) {
        await subscriptionModel.updateOne({ _id: sub._id }, {
          $unset: { "rental.proposal": "" },
        });
        notifyOwner(sub.tenant, {
          subject: "{workspace}: your rented server didn't move",
          text:
            "Moving your rented server failed, so it started again where it was. Nothing changed.",
        }).catch((e) => log(`move failed notice: ${e}`));
      }
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
    // The part before this period was counted when that period matured
    // (an outage still going on then, PLAN §30.6).
    const period = await subscriptionPeriodModel.findOne({
      subscription: sub._id,
      periodStart: { $lte: now },
      periodEnd: { $gt: now },
    }, { projection: { periodStart: 1 } });
    if (!period) return;
    const from = Math.max(since.getTime(), period.periodStart.getTime());
    await subscriptionPeriodModel.updateOne({ _id: period._id }, {
      $inc: { "usage.downtimeMs": Math.max(0, now.getTime() - from) },
    });
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
   * Per machine for rent (PLAN §30): what it offers, what its owner's own
   * partitions and rentals take, what's free, and revenue against cost.
   * `owner`: one owner's machines; otherwise the whole market (admins).
   */
  async capacity(owner?: ObjectId) {
    const machines = await serverModel.find({
      ...(owner ? { tenant: owner } : {}),
      status: "active",
      "pool.status": "ready",
      "pool.rent": { $exists: true },
    }, {
      projection: {
        name: 1,
        tenant: 1,
        pool: 1,
        "resources.partitions": 1,
      },
      sort: { name: 1 },
      limit: 500,
    }).toArray();
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
          tenant: String(m.tenant),
          forRent: !!m.pool!.rent?.enabled,
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

  /** Waiting for a machine's owner (PLAN §30.5): new requests and resizes. */
  async queue(owner?: ObjectId) {
    const mine = owner ? { "rental.owner": owner } : {};
    await this.expireRequests(mine);
    return await subscriptionModel.find({
      kind: "server",
      ...mine,
      $or: [
        { status: "requested" },
        { "rental.pendingChange": { $exists: true } },
      ],
    }, { sort: { updatedAt: 1 }, limit: 200 }).toArray();
  }

  /** The rentals on one machine (its owner's view, PLAN §30). */
  onMachine(machine: ObjectId) {
    return subscriptionModel.find({
      kind: "server",
      "rental.host": machine,
      status: { $in: [...LIVE] },
    }, { limit: 200 }).toArray();
  }
}
