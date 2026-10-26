import Stripe from "stripe";
import type { ObjectId } from "mongodb";
import { readTextSetting } from "@/lib/core/settings.ts";
import type {
  PaymentGateway,
  TCardDetails,
  TChargeResult,
  TGatewayEvent,
} from "@/lib/payments/gateway.ts";

/** A charge or card call that hangs must not hold a request (PLAN §25.7). */
const TIMEOUT_MS = 8_000;

/**
 * Stripe behind the `PaymentGateway` interface (PLAN §25.3). Keys are platform
 * settings, read per call through the 60 s settings cache, so the owner can set
 * or rotate them without a restart.
 */
export class StripeGateway implements PaymentGateway {
  readonly id = "stripe" as const;

  private clients = new Map<string, Stripe>();

  private async client() {
    const key = await readTextSetting("STRIPE_SECRET_KEY", "");
    if (!key) throw new Error("Payments aren't set up yet");
    let client = this.clients.get(key);
    if (!client) {
      // One client per key: a rotated key gets a fresh client, the old one goes.
      this.clients.clear();
      client = new Stripe(key, {
        httpClient: Stripe.createFetchHttpClient(),
        timeout: TIMEOUT_MS,
        maxNetworkRetries: 1,
      });
      this.clients.set(key, client);
    }
    return client;
  }

  async isConfigured() {
    return !!(await readTextSetting("STRIPE_SECRET_KEY", "") &&
      await readTextSetting("STRIPE_PUBLISHABLE_KEY", ""));
  }

  async publicConfig() {
    return {
      publishableKey: await readTextSetting("STRIPE_PUBLISHABLE_KEY", ""),
    };
  }

  async createCustomer(opts: {
    tenant: ObjectId;
    email?: string;
    name?: string;
  }) {
    const customer = await (await this.client()).customers.create({
      email: opts.email,
      name: opts.name,
      metadata: { tenant: opts.tenant.toHexString() },
    }, {
      // Two concurrent first visits create one customer.
      idempotencyKey: `customer:${opts.tenant.toHexString()}`,
    });
    return customer.id;
  }

  async startCardSetup(opts: { tenant: ObjectId; customerRef: string }) {
    const intent = await (await this.client()).setupIntents.create({
      customer: opts.customerRef,
      // Saved for charges made while the cardholder is away (renewals).
      usage: "off_session",
      allowed_payment_method_types: ["card"],
      metadata: { tenant: opts.tenant.toHexString() },
    });
    if (!intent.client_secret) throw new Error("Stripe sent no client secret");
    return { clientSecret: intent.client_secret, setupRef: intent.id };
  }

  async finishedCardSetup(opts: { tenant: ObjectId; setupRef: string }) {
    const intent = await (await this.client()).setupIntents.retrieve(
      opts.setupRef,
    );
    // Another tenant's setup, or one that didn't finish, saves nothing.
    if (
      intent.status !== "succeeded" ||
      intent.metadata?.tenant !== opts.tenant.toHexString() ||
      !intent.payment_method
    ) return null;
    const ref = typeof intent.payment_method === "string"
      ? intent.payment_method
      : intent.payment_method.id;
    return await this.readCard(ref);
  }

  async readCard(cardRef: string): Promise<TCardDetails> {
    const method = await (await this.client()).paymentMethods.retrieve(
      cardRef,
    );
    if (!method.card) throw new Error("Only cards can be saved");
    return {
      providerRef: method.id,
      customerRef: typeof method.customer === "string"
        ? method.customer
        : method.customer?.id,
      brand: method.card.brand,
      last4: method.card.last4,
      expMonth: method.card.exp_month,
      expYear: method.card.exp_year,
      fingerprint: method.card.fingerprint ?? undefined,
    };
  }

  async setDefaultCard(customerRef: string, cardRef: string) {
    await (await this.client()).customers.update(customerRef, {
      invoice_settings: { default_payment_method: cardRef },
    });
  }

  async removeCard(cardRef: string) {
    try {
      await (await this.client()).paymentMethods.detach(cardRef);
    } catch (error) {
      // Already detached (e.g. from Stripe's dashboard): nothing left to do.
      if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) {
        throw error;
      }
    }
  }

  async charge(opts: {
    tenant: ObjectId;
    customerRef: string;
    cardRef: string;
    amount: number;
    currency: string;
    topup: ObjectId;
    offSession: boolean;
    description: string;
  }): Promise<TChargeResult> {
    const stripe = await this.client();
    try {
      const intent = await stripe.paymentIntents.create({
        amount: opts.amount,
        currency: opts.currency,
        customer: opts.customerRef,
        payment_method: opts.cardRef,
        allowed_payment_method_types: ["card"],
        confirm: true,
        off_session: opts.offSession || undefined,
        description: opts.description,
        metadata: {
          topup: opts.topup.toHexString(),
          tenant: opts.tenant.toHexString(),
        },
      }, {
        // The top-up row's id: a retried call returns the same charge.
        idempotencyKey: `topup:${opts.topup.toHexString()}`,
      });
      return this.resultOf(intent);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeCardError) {
        return {
          status: "failed",
          providerRef: error.payment_intent?.id,
          error: error.message,
          // Off session, the bank wants the cardholder: they confirm on the
          // Billing page later.
          authenticationRequired: error.code === "authentication_required",
        };
      }
      throw error;
    }
  }

  async readCharge(providerRef: string) {
    return this.resultOf(
      await (await this.client()).paymentIntents.retrieve(providerRef),
    );
  }

  // Search lags writes by about a minute; only rows stuck 15 minutes ask.
  async findCharge(topup: ObjectId) {
    const { data } = await (await this.client()).paymentIntents.search({
      query: `metadata['topup']:'${topup.toHexString()}'`,
      limit: 1,
    });
    return data[0] ? this.resultOf(data[0]) : null;
  }

  async parseWebhook(req: Request): Promise<TGatewayEvent | void> {
    const secret = await readTextSetting("STRIPE_WEBHOOK_SECRET", "");
    const signature = req.headers.get("stripe-signature");
    if (!secret || !signature) throw new Error("Unsigned webhook");

    // The raw body: the signature covers the exact bytes Stripe sent.
    const event = await (await this.client()).webhooks.constructEventAsync(
      await req.text(),
      signature,
      secret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
    const base = { id: event.id, type: event.type };

    switch (event.type) {
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        return {
          ...base,
          kind: "charge",
          status: event.type === "payment_intent.succeeded"
            ? "completed"
            : "failed",
          topup: intent.metadata?.topup,
          providerRef: intent.id,
          amount: intent.amount_received || undefined,
          error: intent.last_payment_error?.message,
        };
      }
      case "setup_intent.succeeded": {
        const intent = event.data.object;
        if (!intent.payment_method) return;
        return {
          ...base,
          kind: "card_saved",
          tenant: intent.metadata?.tenant,
          cardRef: typeof intent.payment_method === "string"
            ? intent.payment_method
            : intent.payment_method.id,
        };
      }
      case "payment_method.detached":
        return { ...base, kind: "card_removed", cardRef: event.data.object.id };
      case "charge.refunded": {
        const charge = event.data.object;
        return {
          ...base,
          kind: "refund",
          providerRef: typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id,
          amount: charge.amount_refunded,
          currency: charge.currency,
        };
      }
      case "charge.dispute.created": {
        const dispute = event.data.object;
        return {
          ...base,
          kind: "dispute",
          providerRef: typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : dispute.payment_intent?.id,
          amount: dispute.amount,
          currency: dispute.currency,
        };
      }
    }
  }

  private resultOf(intent: Stripe.PaymentIntent): TChargeResult {
    const base = {
      providerRef: intent.id,
      // Confirming on session needs it, even for a charge that failed off session.
      clientSecret: intent.client_secret ?? undefined,
    };
    switch (intent.status) {
      case "succeeded":
        return { ...base, status: "completed", amount: intent.amount_received };
      case "processing":
        return { ...base, status: "pending" };
      case "requires_action":
      case "requires_confirmation":
        return { ...base, status: "action_required" };
      default:
        return {
          ...base,
          status: "failed",
          error: intent.last_payment_error?.message ??
            `The payment was ${intent.status.replaceAll("_", " ")}`,
        };
    }
  }
}
