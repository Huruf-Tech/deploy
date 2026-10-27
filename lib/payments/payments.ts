import { isDuplicateKeyError } from "@/database.ts";
import { AsyncLocalStorage } from "node:async_hooks";
import { ObjectId } from "mongodb";
import type { WithId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { Logger } from "@/core/utils/logger.ts";
import {
  InsufficientBalanceError,
  TopupPendingError,
  type TWalletTopupRequest,
  type TWalletTopupResult,
  Wallet,
} from "@/plugins/Huruf-Tech/thunder-core/lib/wallet.ts";
import { walletModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/wallet.ts";
import { walletLedgerModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/walletLedger.ts";
import { readNumberSetting, readTextSetting } from "@/lib/core/settings.ts";
import {
  subscriptionModel,
  WORKSPACE_KIND,
} from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import type { RateLimiter } from "@/lib/core/rateLimiter.ts";
import {
  TOPUP_CLAIM_TIMEOUT_MS,
  TopupStatus,
  walletTopupModel,
} from "@/plugins/Huruf-Tech/thunder-core/schemas/walletTopup.ts";
import {
  billingAccountModel,
  paymentCardModel,
  paymentEventModel,
  type TBillingAccount,
  type TGatewayId,
  type TPaymentCard,
} from "@/schemas/billing/payment.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import type {
  PaymentGateway,
  TCardDetails,
  TChargeResult,
  TGatewayEvent,
} from "@/lib/payments/gateway.ts";

/** Plans and wallets are in USD for now (PLAN §25.1). */
export const PAYMENTS_CURRENCY = "usd";

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** Events other than refunds and disputes are kept this long (PLAN §25.4). */
const EVENT_TTL_MS = 90 * 24 * 60 * 60_000;

/**
 * Who is behind a charge. Off session (the default: a lazy renewal) only a
 * tenant with autoPay on is charged, and authentication can't happen; on
 * session (the owner pressed a button) 3-D Secure is answered in the browser
 * with the client secret left here.
 */
type TChargeContext = {
  offSession: boolean;
  clientSecret?: string;
  /** The gateway's reason when it declined, for the owner to read. */
  error?: string;
};
const chargeContext = new AsyncLocalStorage<TChargeContext>();

/** An `initiated` or `pending` top-up this old has lost its webhook. */
export const STUCK_AFTER_MS = 15 * 60_000;

/**
 * Top-ups an admin may have to finish (PLAN §25.5, Recovery): charged but not
 * credited (`paid`), a claim whose process died (`processing`), or an outcome
 * the webhook never brought (`initiated`, `pending`).
 */
export const stuckTopups = (now = Date.now()) => ({
  $or: [
    {
      status: { $in: [TopupStatus.Initiated, TopupStatus.Pending] },
      createdAt: { $lt: new Date(now - STUCK_AFTER_MS) },
    },
    { status: TopupStatus.Paid },
    {
      status: TopupStatus.Processing,
      updatedAt: { $lt: new Date(now - TOPUP_CLAIM_TIMEOUT_MS) },
    },
  ],
});

/** A card still usable this month. */
export const cardIsValid = (
  card: Pick<TPaymentCard, "expMonth" | "expYear">,
  now = new Date(),
) =>
  card.expYear > now.getUTCFullYear() ||
  (card.expYear === now.getUTCFullYear() &&
    card.expMonth >= now.getUTCMonth() + 1);

/**
 * Cards, gateway customers and the wallet's top-up hook (PLAN §25). Every
 * charge reaches the gateway through `coverShortfall`, which thunder-core calls
 * when a wallet is short; money always lands in the wallet first.
 */
export class PaymentService {
  constructor(
    private readonly gateways: PaymentGateway[],
    private readonly limiter: Pick<RateLimiter, "hit">,
  ) {}

  /** The gateway new cards go to; the only one for now. */
  get primary() {
    return this.gateways[0];
  }

  gateway(id: TGatewayId) {
    const gateway = this.gateways.find((g) => g.id === id);
    if (!gateway) throw Response.notFound(`No ${id} gateway`);
    return gateway;
  }

  account(tenant: ObjectId) {
    return billingAccountModel.findOne({ tenant });
  }

  /** The tenant's gateway customer, created on first use. */
  async ensureAccount(
    tenant: ObjectId,
    contact: { email?: string; name?: string },
  ): Promise<WithId<TBillingAccount>> {
    const existing = await this.account(tenant);
    if (existing) return existing;

    const gateway = this.primary;
    const customerRef = await gateway.createCustomer({ tenant, ...contact });
    const now = new Date();
    // Upsert: a concurrent first visit got the same customer (gateway
    // idempotency) and lands on the same document.
    return (await billingAccountModel.findOneAndUpdate(
      { tenant },
      {
        $setOnInsert: {
          tenant,
          gateway: gateway.id,
          customerRef,
          autoPay: true,
          createdAt: now,
        },
        $set: { updatedAt: now },
      },
      { upsert: true, returnDocument: "after" },
    ))!;
  }

  cards(tenant: ObjectId) {
    return paymentCardModel.find({ tenant }, {
      sort: { isDefault: -1, createdAt: -1 },
    }).toArray();
  }

  async hasValidCard(tenant: ObjectId) {
    const cards = await paymentCardModel.find(
      { tenant },
      { projection: { expMonth: 1, expYear: 1 } },
    ).toArray();
    return cards.some((card) => cardIsValid(card));
  }

  async startCardSetup(
    tenant: ObjectId,
    contact: { email?: string; name?: string },
  ) {
    const account = await this.ensureAccount(tenant, contact);
    return await this.gateway(account.gateway).startCardSetup({
      tenant,
      customerRef: account.customerRef,
    });
  }

  /** Called by the browser right after it confirmed the setup, for instant feedback. */
  async finishCardSetup(tenant: ObjectId, setupRef: string) {
    const account = await this.account(tenant);
    if (!account) throw Response.badRequest("Start adding a card first");
    const card = await this.gateway(account.gateway).finishedCardSetup({
      tenant,
      setupRef,
    });
    if (!card) throw Response.badRequest("The card wasn't saved");
    return await this.saveCard(account, card);
  }

  /** Records a card the gateway saved; idempotent (the webhook does it too). */
  async saveCard(account: WithId<TBillingAccount>, card: TCardDetails) {
    // Only a card attached to this tenant's own customer.
    if (card.customerRef !== account.customerRef) {
      throw Response.forbidden("That card belongs to another customer");
    }
    // The same card added again: keep the one on file, drop the new copy.
    const same = card.fingerprint
      ? await paymentCardModel.findOne({
        tenant: account.tenant,
        fingerprint: card.fingerprint,
        providerRef: { $ne: card.providerRef },
      })
      : null;
    if (same) {
      await this.gateway(account.gateway).removeCard(card.providerRef);
      return same;
    }
    const hasDefault = !!await paymentCardModel.findOne({
      tenant: account.tenant,
      isDefault: true,
    });
    const saved = (await paymentCardModel.findOneAndUpdate(
      { providerRef: card.providerRef },
      {
        $set: {
          brand: card.brand,
          last4: card.last4,
          expMonth: card.expMonth,
          expYear: card.expYear,
          fingerprint: card.fingerprint,
        },
        $setOnInsert: {
          tenant: account.tenant,
          gateway: account.gateway,
          providerRef: card.providerRef,
          // The first card becomes the default.
          isDefault: !hasDefault,
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" },
    ))!;
    if (saved.isDefault && !hasDefault) {
      await this.gateway(account.gateway).setDefaultCard(
        account.customerRef,
        card.providerRef,
      );
    }
    return saved;
  }

  async setDefaultCard(tenant: ObjectId, card: ObjectId) {
    const account = await this.account(tenant);
    const target = await paymentCardModel.findOne({ _id: card, tenant });
    if (!account || !target) throw Response.notFound("Card not found");
    if (!cardIsValid(target)) throw Response.badRequest("That card expired");
    await this.gateway(account.gateway).setDefaultCard(
      account.customerRef,
      target.providerRef,
    );
    await paymentCardModel.updateMany(
      { tenant, _id: { $ne: card } },
      { $set: { isDefault: false } },
    );
    await paymentCardModel.updateOne({ _id: card }, {
      $set: { isDefault: true },
    });
  }

  /** Removing the last card is refused while the tenant runs servers (PLAN §25.10). */
  async removeCard(tenant: ObjectId, card: ObjectId) {
    const target = await paymentCardModel.findOne({ _id: card, tenant });
    if (!target) throw Response.notFound("Card not found");
    const others = await paymentCardModel.countDocuments({
      tenant,
      _id: { $ne: card },
    });
    if (
      !others &&
      await serverModel.countDocuments({ tenant, status: "active" })
    ) {
      throw Response.badRequest(
        "Add another card before removing this one: a card is required while you have servers",
      );
    }
    await this.gateway(target.gateway).removeCard(target.providerRef);
    await this.forgetCard(target.providerRef);
  }

  async setAutoPay(tenant: ObjectId, autoPay: boolean) {
    await billingAccountModel.updateOne({ tenant }, {
      $set: { autoPay, updatedAt: new Date() },
    });
  }

  /**
   * Whether a charge can be credited: the wallet credits top-ups from the
   * funding tenant (`WALLET_TOPUP_TENANT`). Without it a charged card stays
   * uncredited (`paid`), so nothing is charged until it's set.
   */
  private async canCredit() {
    try {
      await Wallet.resolveTopupTenant();
      return true;
    } catch (error) {
      Logger.error(
        `Payments: ${error instanceof Error ? error.message : error}`,
      );
      return false;
    }
  }

  /** On session: refuse up front rather than charge what can't be credited. */
  private async assertCanCredit() {
    if (await this.canCredit()) return;
    throw Response.json({
      code: "payments_not_ready",
      message:
        "Payments aren't fully set up yet, so nothing was charged. Please try again later.",
    }, { status: 503 });
  }

  /** Runs `fn` as the owner, present in the browser (PLAN §25.5). */
  async onSession<T>(fn: () => Promise<T>) {
    const context: TChargeContext = { offSession: false };
    try {
      const result = await chargeContext.run(context, fn);
      return { result, clientSecret: context.clientSecret };
    } catch (error) {
      // The gateway's own words beat "the fallback declined".
      if (context.error && !(error instanceof TopupPendingError)) {
        throw Response.badRequest(context.error);
      }
      throw error;
    }
  }

  /**
   * "Add funds" (PLAN §25.5): an exact amount from the default card, with the
   * owner present. A repeated `nonce` (a double click) reuses one charge.
   */
  async addFunds(tenant: ObjectId, amount: number, nonce: string) {
    const [min, max, daily] = await Promise.all([
      readNumberSetting("PAYMENTS_ADD_FUNDS_MIN", 500),
      readNumberSetting("PAYMENTS_ADD_FUNDS_MAX", 100_000),
      readNumberSetting("PAYMENTS_DAILY_CAP", 200_000),
    ]);
    if (!Number.isInteger(amount) || amount < min || amount > max) {
      throw Response.badRequest(
        `Add between ${dollars(min)} and ${dollars(max)}`,
      );
    }
    if (!await this.hasValidCard(tenant)) {
      throw Response.badRequest("Add a card first");
    }
    await this.assertCanCredit();
    // Card testing (PLAN §25.6): a few attempts an hour, and a daily total.
    if (!await this.limiter.hit(`addFunds:${tenant}`, 5, 3_600)) {
      throw Response.json(
        { message: "Too many attempts; try again in an hour" },
        { status: 429 },
      );
    }
    const since = new Date(Date.now() - 24 * 60 * 60_000);
    const [today] = await walletTopupModel.aggregate<{ total: number }>([
      {
        $match: {
          tenant,
          createdAt: { $gte: since },
          status: { $ne: "failed" },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray();
    if ((today?.total ?? 0) + amount > daily) {
      throw Response.badRequest(
        `That would pass the daily limit of ${dollars(daily)}`,
      );
    }

    try {
      const { result, clientSecret } = await this.onSession(() =>
        Wallet.addBalance({
          tenant,
          currency: PAYMENTS_CURRENCY,
          amount,
          idempotencyKey: `add:${tenant}:${nonce}`,
        })
      );
      return {
        status: "completed" as const,
        topup: String(result.topup?._id ?? ""),
        clientSecret,
      };
    } catch (error) {
      if (!(error instanceof TopupPendingError)) throw error;
      return { status: "pending" as const, ...await this.pending(error.topup) };
    }
  }

  /**
   * A top-up waiting on the bank: what the browser needs to finish 3-D Secure,
   * if the bank asked for it.
   */
  private async pending(topup: ObjectId) {
    const row = await walletTopupModel.findOne({ _id: topup });
    const charge = row?.providerRef
      ? await this.gateway((row.provider as TGatewayId) ?? this.primary.id)
        .readCharge(row.providerRef)
      : undefined;
    return {
      topup: String(topup),
      clientSecret: charge?.status === "action_required"
        ? charge.clientSecret
        : undefined,
    };
  }

  /**
   * A paid plan, with the owner present (PLAN §25.5): tops up what the wallet
   * is short of before the plan is charged in its own transaction. `short`:
   * nothing to charge (no card or account); the charge then says the wallet
   * is short. A declined card throws with the bank's reason.
   */
  async fundNow(opts: {
    tenant: ObjectId;
    amount: number;
    currency: string;
    key: string;
  }): Promise<
    { status: "funded" | "short" } | {
      status: "pending";
      topup: string;
      clientSecret?: string;
    }
  > {
    await this.assertCanCredit();
    try {
      await this.onSession(() =>
        Wallet.ensureBalance({
          tenant: opts.tenant,
          currency: opts.currency,
          amount: opts.amount,
          idempotencyKey: opts.key,
        })
      );
      return { status: "funded" };
    } catch (error) {
      // A declined attempt mustn't hold its key: the owner may retry the same
      // change with another card.
      await this.releaseFailed(opts.key);
      if (error instanceof InsufficientBalanceError) return { status: "short" };
      if (!(error instanceof TopupPendingError)) throw error;
      return { status: "pending", ...await this.pending(error.topup) };
    }
  }

  /**
   * A renewal, with the owner away (PLAN §25.5): `funded`, `pending` (the bank
   * is processing, or wants the owner to confirm) or `short` (no card, autoPay
   * off, or declined).
   */
  async fundRenewal(opts: {
    tenant: ObjectId;
    amount: number;
    currency: string;
    key: string;
  }): Promise<"funded" | "pending" | "short"> {
    try {
      await Wallet.ensureBalance({
        tenant: opts.tenant,
        currency: opts.currency,
        amount: opts.amount,
        idempotencyKey: opts.key,
      });
      return "funded";
    } catch (error) {
      if (error instanceof TopupPendingError) return "pending";
      if (error instanceof InsufficientBalanceError) return "short";
      throw error;
    }
  }

  /** Whether the card gate below would stop this tenant. */
  async needsCard(tenant: ObjectId) {
    if (await this.hasValidCard(tenant)) return false;
    if (!await this.primary.isConfigured()) return false;
    const exempt = await Promise.all([
      readTextSetting("PLATFORM_TENANT", ""),
      readTextSetting("WALLET_TOPUP_TENANT", ""),
    ]);
    if (exempt.includes(tenant.toHexString())) return false;
    const now = new Date();
    const granted = await subscriptionPeriodModel.findOne({
      tenant,
      scope: WORKSPACE_KIND,
      kind: "complimentary",
      periodStart: { $lte: now },
      periodEnd: { $gt: now },
    }, { projection: { _id: 1 } });
    return !granted;
  }

  /**
   * The card gate (PLAN §25.10, 4): adding a server, creating a project and
   * subscribing need a valid saved card, Free included. Exempt: tenants on a
   * granted (complimentary) plan, the platform's own tenants, and every tenant
   * while payments aren't configured.
   */
  async requireCard(tenant: ObjectId) {
    if (!await this.needsCard(tenant)) return;
    throw Response.json({
      code: "card_required",
      message:
        "Add a card on the Billing page first. We won't charge you: a card verifies your account, and Free stays free.",
    }, { status: 402 });
  }

  /** A top-up of this tenant, for the browser waiting on a webhook. */
  topupStatus(tenant: ObjectId, topup: ObjectId) {
    return walletTopupModel.findOne(
      { _id: topup, tenant },
      { projection: { status: 1, amount: 1, error: 1 } },
    );
  }

  /**
   * The charge the bank wants the owner to confirm (an off-session renewal),
   * with what the browser needs to confirm it on session.
   */
  async flaggedCharge(tenant: ObjectId) {
    const account = await this.account(tenant);
    if (!account?.actionRequired) return null;
    const row = await walletTopupModel.findOne({
      _id: account.actionRequired.topup,
    });
    const card = await paymentCardModel.findOne({ tenant, isDefault: true });
    if (!row?.providerRef || !card) return null;
    const charge = await this.gateway(account.gateway).readCharge(
      row.providerRef,
    );
    if (!charge.clientSecret) return null;
    return {
      topup: String(row._id),
      amount: row.amount,
      clientSecret: charge.clientSecret,
      // The gateway's id for the card, so the browser retries with it.
      cardRef: card.providerRef,
    };
  }

  /** The wallet's balance and its latest entries (PLAN §25.5, Billing page). */
  /** The wallet's balance alone: one indexed read. */
  async balance(tenant: ObjectId) {
    const wallet = await walletModel.findOne(
      { tenant, currency: PAYMENTS_CURRENCY },
      { projection: { balance: 1 } },
    );
    return wallet?.balance ?? 0;
  }

  async statement(tenant: ObjectId, limit = 100) {
    const [balance, entries] = await Promise.all([
      this.balance(tenant),
      walletLedgerModel.find(
        { tenant, currency: PAYMENTS_CURRENCY },
        {
          sort: { _id: -1 },
          limit,
          projection: {
            type: 1,
            amount: 1,
            description: 1,
            purpose: 1,
            reference: 1,
            createdAt: 1,
          },
        },
      ).toArray(),
    ]);
    return { balance, entries };
  }

  /**
   * thunder-core's `Wallet.onInsufficientBalance` (PLAN §25.2): charges the
   * default card for the shortfall. The top-up row exists already; its id is
   * the gateway's idempotency key and comes back in the webhook.
   */
  async coverShortfall(
    request: TWalletTopupRequest,
  ): Promise<TWalletTopupResult | void> {
    const context = chargeContext.getStore() ?? { offSession: true };
    const tenant = request.wallet.tenant;
    const account = await this.account(tenant);
    if (!account || (context.offSession && !account.autoPay)) return;
    // A charge already waits for the owner's confirmation: charging again
    // while they're away would only ask the bank again (PLAN §25.5).
    if (context.offSession && account.actionRequired) return;

    const card = await paymentCardModel.findOne({ tenant, isDefault: true });
    if (!card || !cardIsValid(card)) return;
    // A renewal mustn't charge what can't be credited either.
    if (!await this.canCredit()) return;

    const gateway = this.gateway(account.gateway);
    const result: TChargeResult = await gateway.charge({
      tenant,
      customerRef: account.customerRef,
      cardRef: card.providerRef,
      amount: request.shortfall,
      currency: request.currency,
      topup: request.topup,
      offSession: context.offSession,
      description: request.transfer?.description
        ? `Huruf Deploy: ${request.transfer.description}`
        : "Huruf Deploy wallet top-up",
    });
    const base = { provider: gateway.id, providerRef: result.providerRef };

    if (result.status === "action_required") {
      // On session the browser answers the bank with this; a webhook settles.
      context.clientSecret = result.clientSecret;
      return { ...base, status: "pending" };
    }
    if (result.status === "failed" && result.authenticationRequired) {
      // The bank wants the cardholder. The owner confirms this same charge on
      // the Billing page later, so the top-up stays pending (settleable): a
      // failed row would leave that payment uncredited.
      await billingAccountModel.updateOne({ tenant }, {
        $set: {
          actionRequired: {
            topup: request.topup,
            message: result.error ?? "Your bank asked you to confirm a payment",
            at: new Date(),
          },
          updatedAt: new Date(),
        },
      });
      return { ...base, status: "pending" };
    }
    if (result.status === "failed") {
      context.error = result.error;
      return { ...base, status: "failed" };
    }
    return {
      ...base,
      status: result.status,
      amount: result.status === "completed" ? result.amount : undefined,
    };
  }

  /**
   * A gateway webhook (PLAN §25.5). Every branch is idempotent, so a
   * redelivered event does no harm; the event id is recorded afterwards.
   */
  async handleWebhook(gatewayId: TGatewayId, req: Request) {
    const gateway = this.gateway(gatewayId);
    let event: TGatewayEvent | void;
    try {
      event = await gateway.parseWebhook(req);
    } catch (error) {
      throw Response.badRequest(
        `Invalid webhook: ${error instanceof Error ? error.message : error}`,
      );
    }
    if (!event) return;
    if (await paymentEventModel.findOne({ eventId: event.id })) return;

    let tenant: ObjectId | undefined;
    let topup: ObjectId | undefined;

    switch (event.kind) {
      case "charge": {
        // Charges we didn't open (no top-up id) aren't ours to settle.
        if (!event.topup || !ObjectId.isValid(event.topup)) break;
        topup = new ObjectId(event.topup);
        try {
          const { topup: row } = await Wallet.settleTopup({
            topup,
            status: event.status,
            amount: event.status === "completed" ? event.amount : undefined,
            error: event.error,
          });
          tenant = row.tenant;
          await this.afterSettle(row);
        } catch (error) {
          if ((error as Error).message === "Top-up not found!") break;
          throw error;
        }
        break;
      }
      case "card_saved": {
        if (!event.tenant || !ObjectId.isValid(event.tenant)) break;
        tenant = new ObjectId(event.tenant);
        const account = await this.account(tenant);
        if (!account) break;
        await this.saveCard(account, await gateway.readCard(event.cardRef));
        break;
      }
      case "card_removed":
        await this.forgetCard(event.cardRef);
        break;
      case "refund":
      case "dispute": {
        // Kept for the admin (PLAN §25.5; Admin → Payments, Phase 15d).
        const row = event.providerRef
          ? await walletTopupModel.findOne({ providerRef: event.providerRef })
          : null;
        tenant = row?.tenant;
        topup = row?._id;
        Logger.warn(
          `Payment ${event.kind} for ${event.providerRef}: ${event.amount} ${event.currency}`,
        );
        break;
      }
    }

    const kept = event.kind === "refund" || event.kind === "dispute";
    await paymentEventModel.insertOne({
      kept: kept || undefined,
      gateway: gatewayId,
      eventId: event.id,
      type: event.type,
      tenant,
      topup,
      providerRef: "providerRef" in event ? event.providerRef : undefined,
      amount: kept && "amount" in event ? event.amount : undefined,
      currency: kept && "currency" in event ? event.currency : undefined,
      processedAt: new Date(),
      expiresAt: kept ? undefined : new Date(Date.now() + EVENT_TTL_MS),
    }).catch((error) => {
      // A concurrent delivery recorded it first.
      if (!isDuplicateKeyError(error)) throw error;
    });
  }

  /** A settled top-up: wake its renewal, clear the owner's flag. */
  private async afterSettle(row: {
    _id: ObjectId;
    tenant: ObjectId;
    status: string;
    idempotencyKey?: string;
  }) {
    // A renewal's top-up landed: renew on the next check, not next hour.
    const renewal = row.idempotencyKey?.match(/^renew:([0-9a-f]{24}):/);
    if (row.status === "completed" && renewal) {
      await subscriptionModel.updateOne(
        { _id: new ObjectId(renewal[1]) },
        { $unset: { nextRenewalAttemptAt: "" } },
      );
    }
    // Paid or given up: either way nothing waits for the owner now.
    if (row.status === "completed" || row.status === "failed") {
      await billingAccountModel.updateOne(
        { tenant: row.tenant, "actionRequired.topup": row._id },
        { $unset: { actionRequired: "" } },
      );
    }
  }

  /** Frees the key of a failed top-up so the next attempt charges afresh. */
  private async releaseFailed(key: string) {
    const row = await walletTopupModel.findOne(
      { idempotencyKey: key, status: TopupStatus.Failed },
      { projection: { error: 1 } },
    );
    if (row) await Wallet.abandonTopup({ topup: row._id, reason: row.error });
  }

  /** What the gateway says happened to a top-up's charge (recovery). */
  private async chargeOf(row: {
    _id: ObjectId;
    provider?: string;
    providerRef?: string;
  }) {
    const gateway = this.gateway(
      (row.provider as TGatewayId | undefined) ?? this.primary.id,
    );
    try {
      const charge = row.providerRef
        ? await gateway.readCharge(row.providerRef)
        : await gateway.findCharge(row._id);
      return { gateway, charge };
    } catch (error) {
      // An admin reads this: the gateway's own words ("No such payment_intent").
      throw Response.badRequest(
        `${gateway.id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async stuckTopup(topup: ObjectId) {
    const row = await walletTopupModel.findOne({
      _id: topup,
      ...stuckTopups(),
    });
    if (!row) {
      throw Response.badRequest(
        "Only a stuck top-up can be settled or abandoned",
      );
    }
    return row;
  }

  /**
   * Admin → Payments, Settle (PLAN §25.5): asks the gateway what really
   * happened and settles the top-up to match. Safe to repeat.
   */
  async settleStuck(topup: ObjectId): Promise<{
    outcome: "settled" | "waiting" | "owner" | "no_charge";
    status: string;
    error?: string;
  }> {
    const row = await this.stuckTopup(topup);
    const { gateway, charge } = await this.chargeOf(row);
    if (!charge) return { outcome: "no_charge", status: row.status };
    if (charge.status === "pending" || charge.status === "action_required") {
      return { outcome: "waiting", status: row.status };
    }
    // The bank wants the owner (an off-session renewal): theirs to confirm.
    if (
      charge.status === "failed" &&
      await billingAccountModel.countDocuments({
        tenant: row.tenant,
        "actionRequired.topup": row._id,
      })
    ) {
      return { outcome: "owner", status: row.status };
    }
    if (!row.providerRef && charge.providerRef) {
      await walletTopupModel.updateOne(
        { _id: row._id, providerRef: { $exists: false } },
        { $set: { provider: gateway.id, providerRef: charge.providerRef } },
      );
    }
    let settled;
    try {
      ({ topup: settled } = await Wallet.settleTopup({
        topup: row._id,
        status: charge.status,
        amount: charge.status === "completed" ? charge.amount : undefined,
        error: charge.error,
      }));
    } catch (error) {
      // The card is charged but crediting failed again; the row stays `paid`
      // for another Settle once the cause is fixed.
      throw Response.badRequest(
        `Charged but not credited: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
    await this.afterSettle(settled);
    return { outcome: "settled", status: settled.status, error: settled.error };
  }

  /**
   * Admin → Payments, Abandon: closes an `initiated` top-up the gateway never
   * charged, freeing its key. Refused while the gateway has a live charge,
   * which Settle finishes instead.
   */
  async abandonStuck(topup: ObjectId) {
    const row = await this.stuckTopup(topup);
    if (row.status !== "initiated") {
      throw Response.badRequest("Only an initiated top-up can be abandoned");
    }
    const { charge } = await this.chargeOf(row);
    if (charge && charge.status !== "failed") {
      throw Response.badRequest(
        `The gateway has this charge as ${
          charge.status.replace("_", " ")
        }: settle it instead`,
      );
    }
    await Wallet.abandonTopup({
      topup: row._id,
      reason: charge?.error ??
        "Never reached the gateway; abandoned by an admin",
    });
  }

  /** Admin → Payments: a refund or dispute dealt with in the gateway. */
  async markHandled(event: ObjectId, by: ObjectId) {
    const { matchedCount } = await paymentEventModel.updateOne(
      { _id: event, kept: true },
      { $set: { handledAt: new Date(), handledBy: by } },
    );
    if (!matchedCount) throw Response.notFound("Event not found");
  }

  /** Drops a card we no longer have and promotes another to default. */
  private async forgetCard(providerRef: string) {
    const removed = await paymentCardModel.findOneAndDelete({ providerRef });
    if (!removed?.isDefault) return;
    const next = await paymentCardModel.findOne(
      { tenant: removed.tenant },
      { sort: { createdAt: -1 } },
    );
    if (!next) return;
    await paymentCardModel.updateOne({ _id: next._id }, {
      $set: { isDefault: true },
    });
    const account = await this.account(removed.tenant);
    if (account) {
      await this.gateway(account.gateway).setDefaultCard(
        account.customerRef,
        next.providerRef,
      ).catch((error) =>
        Logger.warn(`Couldn't set the default card at the gateway: ${error}`)
      );
    }
  }
}
