import { assert, assertEquals, assertRejects } from "@std/assert";
import Stripe from "stripe";
// First: the handler sets up the framework (zod's strictParse) the wallet relies on.
import "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { Env } from "@/core/utils/env.ts";
import {
  TopupPendingError,
  Wallet,
} from "@/plugins/Huruf-Tech/thunder-core/lib/wallet.ts";
import { PaymentService } from "@/lib/payments/payments.ts";
import { StripeGateway } from "@/lib/payments/stripe.ts";
import {
  billingAccountModel,
  paymentCardModel,
  paymentEventModel,
} from "@/schemas/billing/payment.ts";
import { testSession } from "./_session.ts";

// The Stripe gateway against Stripe's own test mode (PLAN §25.9). Runs only
// with a test key (`sk_test_…` in .env.test); live keys never reach it.

const key = Env.getSync("STRIPE_SECRET_KEY", true) ?? "";
const webhookSecret = Env.getSync("STRIPE_WEBHOOK_SECRET", true) ?? "";

Deno.test({
  name: "payments: Stripe test mode end to end",
  ignore: !key.startsWith("sk_test_") || !webhookSecret,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const stripe = new Stripe(key, {
      httpClient: Stripe.createFetchHttpClient(),
    });
    const session = await testSession("stripe");
    const funding = await testSession("stripe-funding");
    const tenant = session.tenantId;
    const d = mongodb.db();
    const balance = async () =>
      (await d.collection("wallets").findOne({ tenant, currency: "usd" }))
        ?.balance ?? 0;

    const gateway = new StripeGateway();
    const payments = new PaymentService([gateway]);
    const previousHook = Wallet.onInsufficientBalance;
    Wallet.onInsufficientBalance = (r) => payments.coverShortfall(r);
    const config = Env.getAll<Record<string, string>>();
    const previousFunding = config.WALLET_TOPUP_TENANT;
    config.WALLET_TOPUP_TENANT = funding.tenantId.toHexString();

    let customerRef = "";
    // A Stripe test card attached to the customer, saved as the default.
    const useCard = async (testMethod: string) => {
      const method = await stripe.paymentMethods.attach(testMethod, {
        customer: customerRef,
      });
      const account = (await payments.account(tenant))!;
      const card = await payments.saveCard(
        account,
        await gateway.readCard(method.id),
      );
      await payments.setDefaultCard(tenant, card._id);
      return method.id;
    };
    // A webhook signed with the endpoint's secret, as Stripe sends them.
    const signed = async (event: object, secret = webhookSecret) => {
      const payload = JSON.stringify(event);
      const header = await stripe.webhooks.generateTestHeaderStringAsync({
        payload,
        secret,
      });
      return new Request("http://localhost/payments/api/webhook/stripe", {
        method: "POST",
        headers: { "stripe-signature": header },
        body: payload,
      });
    };

    try {
      await t.step(
        "a customer and a card saved through a SetupIntent",
        async () => {
          const account = await payments.ensureAccount(tenant, {
            email: session.email,
            name: "stripe test",
          });
          customerRef = account.customerRef;
          assert(customerRef.startsWith("cus_"));

          const { setupRef, clientSecret } = await payments.startCardSetup(
            tenant,
            {},
          );
          assert(clientSecret.startsWith("seti_"));
          // The browser's part, done here with Stripe's test card.
          await stripe.setupIntents.confirm(setupRef, {
            payment_method: "pm_card_visa",
          });
          const card = await payments.finishCardSetup(tenant, setupRef);
          assertEquals(card.brand, "visa");
          assertEquals(card.last4, "4242");
          assert(card.isDefault);

          // Someone else's setup saves nothing for this tenant.
          await assertRejects(() =>
            payments.finishCardSetup(funding.tenantId, setupRef)
          );
        },
      );

      await t.step("add funds: $20 charged once, credited once", async () => {
        const before = await balance();
        const add = () =>
          payments.onSession(() =>
            Wallet.addBalance({
              tenant,
              currency: "usd",
              amount: 2_000,
              idempotencyKey: `add:${tenant}:stripe-1`,
            })
          );
        const first = await add();
        await add();
        assertEquals(await balance(), before + 2_000);
        const intent = await stripe.paymentIntents.retrieve(
          first.result.topup!.providerRef!,
        );
        assertEquals(intent.status, "succeeded");
        assertEquals(intent.amount, 2_000);
        assertEquals(intent.metadata.topup, first.result.topup!._id.toString());
      });

      await t.step(
        "a renewal off session charges only the shortfall",
        async () => {
          const have = await balance();
          const { topup } = await Wallet.ensureBalance({
            tenant,
            currency: "usd",
            amount: have + 750,
            idempotencyKey: `renew:stripe:${tenant}:1`,
          });
          assertEquals(await balance(), have + 750);
          const intent = await stripe.paymentIntents.retrieve(
            topup!.providerRef!,
          );
          assertEquals(intent.amount, 750);
          assertEquals(intent.status, "succeeded");
        },
      );

      await t.step("a declined card: nothing credited", async () => {
        // Attaches fine, declines when charged.
        await useCard("pm_card_chargeCustomerFail");
        const have = await balance();
        await assertRejects(() =>
          Wallet.ensureBalance({
            tenant,
            currency: "usd",
            amount: have + 500,
            idempotencyKey: `renew:stripe:${tenant}:2`,
          })
        );
        assertEquals(await balance(), have);
      });

      await t.step("3-D Secure off session: pending and flagged", async () => {
        await useCard("pm_card_authenticationRequired");
        const have = await balance();
        await assertRejects(
          () =>
            Wallet.ensureBalance({
              tenant,
              currency: "usd",
              amount: have + 600,
              idempotencyKey: `renew:stripe:${tenant}:3`,
            }),
          TopupPendingError,
        );
        const account = await billingAccountModel.findOne({ tenant });
        assert(account?.actionRequired);
        assertEquals(await balance(), have);
      });

      await t.step(
        "3-D Secure on session: a client secret for the browser",
        async () => {
          // The flag above only stops charges while the owner is away.
          let pending = false;
          const { clientSecret } = await payments.onSession(async () => {
            try {
              await Wallet.addBalance({
                tenant,
                currency: "usd",
                amount: 1_000,
                idempotencyKey: `add:${tenant}:stripe-3ds`,
              });
            } catch (error) {
              pending = error instanceof TopupPendingError;
              if (!pending) throw error;
            }
          });
          assert(pending);
          assert(clientSecret?.startsWith("pi_"));
        },
      );

      await t.step(
        "webhooks: signed ones settle, forged ones are refused",
        async () => {
          const account = (await billingAccountModel.findOne({ tenant }))!;
          const topup = account.actionRequired!.topup;
          const row = await d.collection("walletTopups").findOne({
            _id: topup,
          });
          const have = await balance();
          const event = {
            id: `evt_test_${topup}`,
            object: "event",
            type: "payment_intent.succeeded",
            data: {
              object: {
                id: row!.providerRef,
                object: "payment_intent",
                amount_received: 600,
                metadata: { topup: topup.toHexString() },
              },
            },
          };
          // Signed with the wrong secret: refused, nothing credited.
          const forged = await payments.handleWebhook(
            "stripe",
            await signed(event, "whsec_wrong"),
          ).then(() => null, (e) => e as Response);
          assertEquals(forged?.status, 400);
          assertEquals(await balance(), have);

          await payments.handleWebhook("stripe", await signed(event));
          assertEquals(await balance(), have + 600);
          assertEquals(
            (await billingAccountModel.findOne({ tenant }))?.actionRequired,
            undefined,
          );
          // Redelivered: no second credit.
          await payments.handleWebhook("stripe", await signed(event));
          assertEquals(await balance(), have + 600);
        },
      );
    } finally {
      Wallet.onInsufficientBalance = previousHook;
      config.WALLET_TOPUP_TENANT = previousFunding;
      if (customerRef) await stripe.customers.del(customerRef).catch(() => {});
      await Promise.all([
        billingAccountModel.deleteMany({ tenant }),
        paymentCardModel.deleteMany({ tenant }),
        paymentEventModel.deleteMany({ tenant }),
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
