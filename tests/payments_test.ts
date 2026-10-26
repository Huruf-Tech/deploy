import { assert, assertEquals, assertRejects } from "@std/assert";
import { ObjectId } from "mongodb";
// First: the handler sets up the framework (zod's strictParse) the wallet relies on.
import "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { Env } from "@/core/utils/env.ts";
import {
  TopupPendingError,
  Wallet,
} from "@/plugins/Huruf-Tech/thunder-core/lib/wallet.ts";
import { PaymentService } from "@/lib/payments/payments.ts";
import type {
  PaymentGateway,
  TCardDetails,
  TChargeResult,
  TGatewayEvent,
} from "@/lib/payments/gateway.ts";
import {
  billingAccountModel,
  paymentCardModel,
  paymentEventModel,
} from "@/schemas/billing/payment.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { testSession } from "./_session.ts";

// Payments (PLAN §25, Phase 15a): cards, the wallet top-up hook and webhooks,
// driven by a fake gateway against the real wallet.

/** A gateway that answers from a script; webhooks are plain JSON events. */
class FakeGateway implements PaymentGateway {
  readonly id = "stripe" as const;
  charges: { topup: string; amount: number; offSession: boolean }[] = [];
  next: (amount: number) => TChargeResult = (amount) => ({
    status: "completed",
    amount,
  });
  cards = new Map<string, TCardDetails>();
  defaults = new Map<string, string>();
  removed: string[] = [];

  isConfigured() {
    return Promise.resolve(true);
  }
  publicConfig() {
    return Promise.resolve({ publishableKey: "pk_test_fake" });
  }
  createCustomer(opts: { tenant: ObjectId }) {
    return Promise.resolve(`cus_${opts.tenant.toHexString()}`);
  }
  startCardSetup(opts: { tenant: ObjectId }) {
    return Promise.resolve({
      clientSecret: "seti_secret",
      setupRef: `seti_${opts.tenant.toHexString()}`,
    });
  }
  finishedCardSetup(opts: { setupRef: string }) {
    return Promise.resolve(this.cards.get(opts.setupRef) ?? null);
  }
  readCard(cardRef: string) {
    const card = [...this.cards.values()].find((c) =>
      c.providerRef === cardRef
    );
    if (!card) throw new Error("No such card");
    return Promise.resolve(card);
  }
  setDefaultCard(customerRef: string, cardRef: string) {
    this.defaults.set(customerRef, cardRef);
    return Promise.resolve();
  }
  removeCard(cardRef: string) {
    this.removed.push(cardRef);
    return Promise.resolve();
  }
  charge(opts: {
    amount: number;
    topup: ObjectId;
    offSession: boolean;
  }) {
    const topup = opts.topup.toHexString();
    // Like Stripe's idempotency key: the same top-up never charges twice.
    if (!this.charges.some((c) => c.topup === topup)) {
      this.charges.push({
        topup,
        amount: opts.amount,
        offSession: opts.offSession,
      });
    }
    return Promise.resolve({
      providerRef: `pi_${topup}`,
      ...this.next(opts.amount),
    });
  }
  readCharge(providerRef: string): Promise<TChargeResult> {
    return Promise.resolve({ status: "completed", providerRef });
  }
  async parseWebhook(req: Request): Promise<TGatewayEvent | void> {
    if (req.headers.get("x-fake-signature") !== "ok") {
      throw new Error("Bad signature");
    }
    return await req.json();
  }
}

const webhook = (event: TGatewayEvent, signed = true) =>
  new Request("http://localhost/payments/api/webhook/stripe", {
    method: "POST",
    headers: signed ? { "x-fake-signature": "ok" } : {},
    body: JSON.stringify(event),
  });

Deno.test({
  name: "payments: cards, top-ups through the gateway, webhooks",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const session = await testSession("payments");
    const funding = await testSession("payments-funding");
    const tenant = session.tenantId;
    const d = mongodb.db();
    const balance = async () =>
      (await d.collection("wallets").findOne({ tenant, currency: "usd" }))
        ?.balance ?? 0;

    const gateway = new FakeGateway();
    const payments = new PaymentService([gateway]);
    const previousHook = Wallet.onInsufficientBalance;
    Wallet.onInsufficientBalance = (r) => payments.coverShortfall(r);
    // `.env` wins over the `envs` collection, so set it on the loaded config.
    const config = Env.getAll<Record<string, string>>();
    const previousFunding = config.WALLET_TOPUP_TENANT;
    config.WALLET_TOPUP_TENANT = funding.tenantId.toHexString();

    const card = (n: string, extra: Partial<TCardDetails> = {}) => ({
      providerRef: `pm_${n}`,
      customerRef: `cus_${tenant.toHexString()}`,
      brand: "visa",
      last4: n.padStart(4, "0").slice(-4),
      expMonth: 12,
      expYear: new Date().getUTCFullYear() + 2,
      ...extra,
    });

    try {
      await t.step(
        "a saved card: first is default, foreign ones refused",
        async () => {
          const account = await payments.ensureAccount(tenant, {
            email: session.email,
          });
          assertEquals(account.customerRef, `cus_${tenant.toHexString()}`);
          assertEquals(account.autoPay, true);
          assertEquals(await payments.hasValidCard(tenant), false);

          gateway.cards.set(`seti_${tenant.toHexString()}`, card("4242"));
          const saved = await payments.finishCardSetup(
            tenant,
            `seti_${tenant.toHexString()}`,
          );
          assertEquals(saved.isDefault, true);
          assertEquals(gateway.defaults.get(account.customerRef), "pm_4242");
          assert(await payments.hasValidCard(tenant));

          // Saving the same card again (the webhook does too) changes nothing.
          await payments.saveCard(account, card("4242"));
          assertEquals(await paymentCardModel.countDocuments({ tenant }), 1);

          await assertRejects(() =>
            payments.saveCard(
              account,
              card("9999", { customerRef: "cus_someone_else" }),
            )
          );
        },
      );

      await t.step("an expired card doesn't count", async () => {
        const account = (await payments.account(tenant))!;
        const old = await payments.saveCard(
          account,
          card("1111", { expYear: 2020 }),
        );
        assertEquals(old.isDefault, false);
        await assertRejects(() => payments.setDefaultCard(tenant, old._id));
        await payments.removeCard(tenant, old._id);
        assert(gateway.removed.includes("pm_1111"));
      });

      await t.step(
        "add funds charges the card once, even when repeated",
        async () => {
          const before = await balance();
          const add = () =>
            payments.onSession(() =>
              Wallet.addBalance({
                tenant,
                currency: "usd",
                amount: 2_000,
                idempotencyKey: `add:${tenant}:click-1`,
              })
            );
          await add();
          await add();
          assertEquals(await balance(), before + 2_000);
          assertEquals(gateway.charges.length, 1);
          assertEquals(gateway.charges[0].offSession, false);
        },
      );

      await t.step(
        "a renewal short of funds charges only the shortfall",
        async () => {
          const have = await balance();
          await Wallet.ensureBalance({
            tenant,
            currency: "usd",
            amount: have + 500,
            idempotencyKey: `renew:test:${tenant}:1`,
          });
          assertEquals(await balance(), have + 500);
          const last = gateway.charges.at(-1)!;
          assertEquals(last.amount, 500);
          assertEquals(last.offSession, true);
        },
      );

      await t.step(
        "autoPay off: no charge while the owner is away",
        async () => {
          await payments.setAutoPay(tenant, false);
          const charges = gateway.charges.length;
          await assertRejects(() =>
            Wallet.ensureBalance({
              tenant,
              currency: "usd",
              amount: 5_000_000,
              idempotencyKey: `renew:test:${tenant}:2`,
            })
          );
          assertEquals(gateway.charges.length, charges);
          await payments.setAutoPay(tenant, true);
        },
      );

      await t.step(
        "3-D Secure on session: pending, then the webhook credits",
        async () => {
          gateway.next = () => ({
            status: "action_required",
            clientSecret: "pi_secret_3ds",
          });
          const before = await balance();
          let pending: TopupPendingError | undefined;
          const { clientSecret } = await payments.onSession(async () => {
            try {
              await Wallet.addBalance({
                tenant,
                currency: "usd",
                amount: 1_500,
                idempotencyKey: `add:${tenant}:3ds`,
              });
            } catch (error) {
              if (error instanceof TopupPendingError) pending = error;
              else throw error;
            }
          });
          assertEquals(clientSecret, "pi_secret_3ds");
          assert(pending);
          assertEquals(await balance(), before);

          const event: TGatewayEvent = {
            id: "evt_3ds_ok",
            type: "payment_intent.succeeded",
            kind: "charge",
            status: "completed",
            topup: pending.topup.toHexString(),
            providerRef: `pi_${pending.topup.toHexString()}`,
            amount: 1_500,
          };
          await payments.handleWebhook("stripe", webhook(event));
          assertEquals(await balance(), before + 1_500);
          // A redelivered event changes nothing.
          await payments.handleWebhook("stripe", webhook(event));
          assertEquals(await balance(), before + 1_500);
          assertEquals(
            await paymentEventModel.countDocuments({ eventId: "evt_3ds_ok" }),
            1,
          );
        },
      );

      await t.step(
        "off session, the bank wants the owner: flagged, then cleared",
        async () => {
          gateway.next = () => ({
            status: "failed",
            error: "Authentication required",
            authenticationRequired: true,
          });
          const have = await balance();
          await assertRejects(
            () =>
              Wallet.ensureBalance({
                tenant,
                currency: "usd",
                amount: have + 700,
                idempotencyKey: `renew:test:${tenant}:3`,
              }),
            TopupPendingError,
          );
          const flagged = await billingAccountModel.findOne({ tenant });
          assert(flagged?.actionRequired);

          // The next hourly attempt doesn't ask the bank again.
          const charges = gateway.charges.length;
          await assertRejects(() =>
            Wallet.ensureBalance({
              tenant,
              currency: "usd",
              amount: have + 700,
              idempotencyKey: `renew:test:${tenant}:4`,
            })
          );
          assertEquals(gateway.charges.length, charges);

          // The owner confirms on session; the webhook for that top-up clears it.
          await payments.handleWebhook(
            "stripe",
            webhook({
              id: "evt_auth_ok",
              type: "payment_intent.succeeded",
              kind: "charge",
              status: "completed",
              topup: flagged.actionRequired.topup.toHexString(),
              providerRef: "pi_auth",
            }),
          );
          assertEquals(
            (await billingAccountModel.findOne({ tenant }))?.actionRequired,
            undefined,
          );
          // That confirmed payment is credited, not lost.
          assertEquals(await balance(), have + 700);
          gateway.next = (amount) => ({ status: "completed", amount });
        },
      );

      await t.step("unsigned webhooks are refused", async () => {
        const refused = await payments.handleWebhook(
          "stripe",
          webhook({
            id: "evt_forged",
            type: "x",
            kind: "card_removed",
            cardRef: "pm_4242",
          }, false),
        ).then(() => null, (e) => e as Response);
        assertEquals(refused?.status, 400);
        assertEquals(await paymentCardModel.countDocuments({ tenant }), 1);
      });

      await t.step("the last card stays while servers run", async () => {
        const only = (await paymentCardModel.findOne({ tenant }))!;
        const server = await serverModel.insertOne({
          tenant,
          status: "active",
          // deno-lint-ignore no-explicit-any
        } as any);
        await assertRejects(() => payments.removeCard(tenant, only._id));
        await serverModel.deleteOne({ _id: server.insertedId });
        await payments.removeCard(tenant, only._id);
        assertEquals(await payments.hasValidCard(tenant), false);
      });

      await t.step(
        "routes: owner only, webhook needs a signature",
        async () => {
          const config = await session.call("GET", "/payments/api/config");
          assertEquals(config.status, 200, JSON.stringify(config.json));
          const cards = await session.call("GET", "/payments/api/cards");
          assertEquals(cards.status, 200, JSON.stringify(cards.json));

          // Another tenant's member can't see this tenant's cards.
          const other = await funding.call(
            "GET",
            "/payments/api/cards",
            undefined,
            {
              "x-tenant-id": session.tenant,
            },
          );
          assertEquals(other.status, 403);

          const forged = await session.call(
            "POST",
            "/payments/api/webhook/stripe",
            { id: "evt_x" },
            { cookie: "", "x-tenant-id": "" },
          );
          assertEquals(forged.status, 400, JSON.stringify(forged.json));
        },
      );
    } finally {
      Wallet.onInsufficientBalance = previousHook;
      config.WALLET_TOPUP_TENANT = previousFunding;
      await Promise.all([
        billingAccountModel.deleteMany({ tenant }),
        paymentCardModel.deleteMany({ tenant }),
        paymentEventModel.deleteMany({ tenant }),
        paymentEventModel.deleteMany({ eventId: "evt_forged" }),
        d.collection("walletTopups").deleteMany({ tenant }),
        d.collection("walletLedgers").deleteMany({
          tenant: { $in: [tenant, funding.tenantId] },
        }),
        d.collection("wallets").deleteMany({
          tenant: { $in: [tenant, funding.tenantId] },
        }),
      ]);
      await session.cleanup();
      await funding.cleanup();
    }
  },
});
