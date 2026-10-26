import type { ObjectId } from "mongodb";
import type { TGatewayId } from "@/schemas/billing/payment.ts";

/** What a saved card shows: never the number or the CVC. */
export type TCardDetails = {
  providerRef: string;
  /** The gateway customer the card belongs to. */
  customerRef?: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  /** The same physical card always has the same fingerprint. */
  fingerprint?: string;
};

/**
 * The outcome of a charge:
 * - `completed`: the money is in;
 * - `pending`: the bank is still processing (a webhook settles it);
 * - `action_required`: the cardholder must confirm (3-D Secure) with
 *   `clientSecret`, on session; a webhook settles it afterwards;
 * - `failed`: declined, or authentication needed while the cardholder is
 *   away (`authenticationRequired`).
 */
export type TChargeResult = {
  status: "completed" | "pending" | "action_required" | "failed";
  providerRef?: string;
  clientSecret?: string;
  /** Cents actually taken, when the gateway says so. */
  amount?: number;
  error?: string;
  authenticationRequired?: boolean;
};

/** A verified webhook event, in gateway-neutral terms (PLAN §25.5). */
export type TGatewayEvent =
  & { id: string; type: string }
  & (
    | {
      kind: "charge";
      status: "completed" | "failed";
      /** Our walletTopups id, sent to the gateway as metadata. */
      topup?: string;
      providerRef: string;
      amount?: number;
      error?: string;
    }
    | { kind: "card_saved"; tenant?: string; cardRef: string }
    | { kind: "card_removed"; cardRef: string }
    | {
      kind: "refund" | "dispute";
      providerRef?: string;
      amount: number;
      currency: string;
    }
  );

/**
 * One payment gateway (PLAN §25.3, D41: a strategy per provider). Routes and
 * the billing service talk to this interface only; nothing imports Stripe
 * except its implementation.
 */
export interface PaymentGateway {
  readonly id: TGatewayId;
  /** Keys are set; the Billing page hides the gateway otherwise. */
  isConfigured(): Promise<boolean>;
  /** What the browser needs to show the gateway's own card form. */
  publicConfig(): Promise<{ publishableKey: string }>;
  /** Creates the customer once per tenant (idempotent under concurrency). */
  createCustomer(opts: {
    tenant: ObjectId;
    email?: string;
    name?: string;
  }): Promise<string>;
  /** Starts saving a card for later, off-session use. */
  startCardSetup(opts: {
    tenant: ObjectId;
    customerRef: string;
  }): Promise<{ clientSecret: string; setupRef: string }>;
  /** A card setup the browser finished; null unless it succeeded for this tenant. */
  finishedCardSetup(opts: {
    tenant: ObjectId;
    setupRef: string;
  }): Promise<TCardDetails | null>;
  readCard(cardRef: string): Promise<TCardDetails>;
  setDefaultCard(customerRef: string, cardRef: string): Promise<void>;
  removeCard(cardRef: string): Promise<void>;
  /**
   * Charges a saved card. `topup` is our walletTopups id: the gateway uses it
   * as its idempotency key and returns it in webhooks, so a retried call
   * never charges twice and a webhook finds its top-up.
   */
  charge(opts: {
    tenant: ObjectId;
    customerRef: string;
    cardRef: string;
    amount: number;
    currency: string;
    topup: ObjectId;
    offSession: boolean;
    description: string;
  }): Promise<TChargeResult>;
  /** The charge's current state, for recovery and for on-session confirmation. */
  readCharge(providerRef: string): Promise<TChargeResult>;
  /**
   * The charge opened for a top-up whose call never returned its id (the
   * process died mid-call); null when it never reached the gateway.
   */
  findCharge(topup: ObjectId): Promise<TChargeResult | null>;
  /** Verifies the signature and maps the event; nothing for events we ignore. */
  parseWebhook(req: Request): Promise<TGatewayEvent | void>;
}
