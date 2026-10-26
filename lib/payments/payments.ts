import { AsyncLocalStorage } from "node:async_hooks";
import { ObjectId } from "mongodb";
import type { WithId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { Logger } from "@/core/utils/logger.ts";
import {
  type TWalletTopupRequest,
  type TWalletTopupResult,
  Wallet,
} from "@/plugins/Huruf-Tech/thunder-core/lib/wallet.ts";
import { walletTopupModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/walletTopup.ts";
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

/** Events other than refunds and disputes are kept this long (PLAN §25.4). */
const EVENT_TTL_MS = 90 * 24 * 60 * 60_000;

/**
 * Who is behind a charge. Off session (the default: a lazy renewal) only a
 * tenant with autoPay on is charged, and authentication can't happen; on
 * session (the owner pressed a button) 3-D Secure is answered in the browser
 * with the client secret left here.
 */
type TChargeContext = { offSession: boolean; clientSecret?: string };
const chargeContext = new AsyncLocalStorage<TChargeContext>();

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
  constructor(private readonly gateways: PaymentGateway[]) {}

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

  /** Runs `fn` as the owner, present in the browser (PLAN §25.5). */
  async onSession<T>(fn: () => Promise<T>) {
    const context: TChargeContext = { offSession: false };
    const result = await chargeContext.run(context, fn);
    return { result, clientSecret: context.clientSecret };
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
    if (result.status === "failed") return { ...base, status: "failed" };
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
          // Paid or given up: either way nothing waits for the owner now.
          await billingAccountModel.updateOne(
            { tenant, "actionRequired.topup": topup },
            { $unset: { actionRequired: "" } },
          );
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
      if ((error as { code?: number }).code !== 11000) throw error;
    });
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
