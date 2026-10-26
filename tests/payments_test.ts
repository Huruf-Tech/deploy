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
import { BillingService } from "@/lib/billing/billing.ts";
import { entitlements } from "@/lib/services.ts";
import { $plan, planModel } from "@/schemas/billing/plan.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
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
  /** What `readCharge`/`findCharge` report; set by the recovery test. */
  found: TChargeResult | null = null;
  readCharge(providerRef: string): Promise<TChargeResult> {
    return Promise.resolve(this.found ?? { status: "completed", providerRef });
  }
  findCharge(): Promise<TChargeResult | null> {
    return Promise.resolve(this.found);
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
    const session = await testSession("payments", { card: false });
    const funding = await testSession("payments-funding");
    const tenant = session.tenantId;
    const d = mongodb.db();
    const balance = async () =>
      (await d.collection("wallets").findOne({ tenant, currency: "usd" }))
        ?.balance ?? 0;

    const gateway = new FakeGateway();
    const payments = new PaymentService([gateway], {
      hit: () => Promise.resolve(true),
    });
    const previousHook = Wallet.onInsufficientBalance;
    Wallet.onInsufficientBalance = (r) => payments.coverShortfall(r);
    // `.env` wins over the `envs` collection, so set it on the loaded config.
    const config = Env.getAll<Record<string, string>>();
    const previousFunding = config.WALLET_TOPUP_TENANT;
    config.WALLET_TOPUP_TENANT = funding.tenantId.toHexString();
    // Settings are cached a minute per process: set them before anything reads them.
    const platform = await testSession("payments-platform");
    const previousPlatform = config.PLATFORM_TENANT;
    config.PLATFORM_TENANT = platform.tenantId.toHexString();

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

          // The same physical card added a second time is kept once.
          await paymentCardModel.updateOne({ providerRef: "pm_4242" }, {
            $set: { fingerprint: "fp_4242" },
          });
          const again = await payments.saveCard(
            account,
            card("4242", {
              providerRef: "pm_4242_again",
              fingerprint: "fp_4242",
            }),
          );
          assertEquals(again.providerRef, "pm_4242");
          assert(gateway.removed.includes("pm_4242_again"));
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

      await t.step("add funds: limits, decline reason, daily cap", async () => {
        const refused = (fn: () => Promise<unknown>) =>
          fn().then(() => null, (e) => e as Response);

        assertEquals(
          (await refused(() => payments.addFunds(tenant, 100, "nonce-small")))
            ?.status,
          400,
        );
        assertEquals(
          (await refused(() =>
            payments.addFunds(tenant, 200_000, "nonce-large")
          ))?.status,
          400,
        );

        // The bank's own words reach the owner.
        gateway.next = () => ({
          status: "failed",
          error: "Your card has insufficient funds.",
        });
        const declined = await refused(() =>
          payments.addFunds(tenant, 1_000, "nonce-declined")
        );
        assertEquals(declined?.status, 400);
        assertEquals(
          await declined?.text(),
          "Your card has insufficient funds.",
        );
        gateway.next = (amount) => ({ status: "completed", amount });

        const before = await balance();
        const done = await payments.addFunds(tenant, 1_000, "nonce-ok-1");
        assertEquals(done.status, "completed");
        assertEquals(await balance(), before + 1_000);

        // 3-D Secure: pending, with what the browser needs.
        gateway.next = () => ({
          status: "action_required",
          clientSecret: "pi_secret_add",
        });
        const pending = await payments.addFunds(tenant, 1_000, "nonce-3ds");
        assertEquals(pending.status, "pending");
        gateway.next = (amount) => ({ status: "completed", amount });

        // Today's top-ups plus this one may not pass the daily cap ($2,000).
        await payments.addFunds(tenant, 100_000, "nonce-cap-1");
        assertEquals(
          (await refused(() =>
            payments.addFunds(tenant, 100_000, "nonce-cap-2")
          ))?.status,
          400,
        );
      });

      await t.step(
        "the card gate: no card, no servers, projects or plans",
        async () => {
          const bare = await testSession("payments-bare", { card: false });
          // The gate is on only when payments are configured.
          const config = Env.getAll<Record<string, string>>();
          const keys = {
            secret: config.STRIPE_SECRET_KEY,
            publishable: config.STRIPE_PUBLISHABLE_KEY,
          };
          config.STRIPE_SECRET_KEY = "sk_test_gate";
          config.STRIPE_PUBLISHABLE_KEY = "pk_test_gate";
          try {
            const project = await bare.call("POST", "/projects/api", {
              name: "gated",
              slug: `gated-${Date.now()}`,
              source: { type: "image", image: "nginx:alpine" },
              servers: [new ObjectId().toHexString()],
            });
            assertEquals(project.status, 402, JSON.stringify(project.json));
            assertEquals(project.json.code, "card_required");

            const bootstrap = await bare.call(
              "POST",
              "/servers/api/bootstrap",
              {
                host: "203.0.113.10",
                username: "root",
                password: "x",
              },
            );
            assertEquals(bootstrap.status, 402);

            // A granted plan is exempt.
            const now = new Date();
            await d.collection("subscriptionPeriods").insertOne({
              tenant: bare.tenantId,
              subscription: new ObjectId(),
              plan: new ObjectId(),
              periodStart: new Date(now.getTime() - 1_000),
              periodEnd: new Date(now.getTime() + 60_000),
              amount: 0,
              currency: "usd",
              limitsSnapshot: {},
              featuresSnapshot: {},
              kind: "complimentary",
              createdAt: now,
            });
            await payments.requireCard(bare.tenantId);
          } finally {
            config.STRIPE_SECRET_KEY = keys.secret;
            config.STRIPE_PUBLISHABLE_KEY = keys.publishable;
            await d.collection("subscriptionPeriods").deleteMany({
              tenant: bare.tenantId,
            });
            await bare.cleanup();
          }
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

      await t.step(
        "plans: the card pays the shortfall, on and off session",
        async () => {
          const billing = new BillingService(entitlements, payments);
          const price = 900_000;
          const { insertedId: plan } = await planModel.insertOne($plan.parse({
            name: "Card plan",
            slug: `card-plan-${Date.now()}`,
            price: { amount: price, currency: "usd", interval: "month" },
          }));
          const endPeriod = async () => {
            const past = new Date(Date.now() - 1_000);
            await subscriptionPeriodModel.updateMany(
              { tenant, periodEnd: { $gt: past } },
              { $set: { periodEnd: past } },
            );
            await subscriptionModel.updateOne({ tenant }, {
              $set: { currentPeriodEnd: past },
              $unset: { nextRenewalAttemptAt: "" },
            });
            entitlements.invalidate(tenant);
          };
          try {
            // Subscribe: the card covers exactly what the wallet lacks.
            const have = await balance();
            const charges = gateway.charges.length;
            const result = await billing.subscribe(tenant, session.user, plan);
            assertEquals(result.result, "active");
            assertEquals(gateway.charges.at(-1)!.amount, price - have);
            assertEquals(gateway.charges.at(-1)!.offSession, false);
            assertEquals(gateway.charges.length, charges + 1);
            assertEquals(await balance(), 0);

            // Renewal, owner away: the card pays the whole price once.
            await endPeriod();
            await billing.renewIfDue(tenant);
            assertEquals(gateway.charges.at(-1)!.amount, price);
            assertEquals(gateway.charges.at(-1)!.offSession, true);
            assertEquals(
              (await subscriptionModel.findOne({ tenant }))?.status,
              "active",
            );

            // The bank wants the owner: past due, retried later, not charged again.
            gateway.next = () => ({
              status: "failed",
              error: "Authentication required",
              authenticationRequired: true,
            });
            await endPeriod();
            await billing.renewIfDue(tenant);
            const pastDue = await subscriptionModel.findOne({ tenant });
            assertEquals(pastDue?.status, "pastDue");
            assert(pastDue?.nextRenewalAttemptAt);
            gateway.next = (amount) => ({ status: "completed", amount });

            // The owner confirms; the webhook clears the hourly wait, so the
            // next check renews from the funds that just landed.
            const flagged = (await billingAccountModel.findOne({ tenant }))!
              .actionRequired!;
            await payments.handleWebhook(
              "stripe",
              webhook({
                id: `evt_renew_${flagged.topup}`,
                type: "payment_intent.succeeded",
                kind: "charge",
                status: "completed",
                topup: flagged.topup.toHexString(),
                providerRef: "pi_renew",
              }),
            );
            assertEquals(
              (await subscriptionModel.findOne({ tenant }))
                ?.nextRenewalAttemptAt,
              undefined,
            );
            const before = gateway.charges.length;
            await billing.renewIfDue(tenant);
            assertEquals(
              (await subscriptionModel.findOne({ tenant }))?.status,
              "active",
            );
            assertEquals(gateway.charges.length, before);
          } finally {
            await Promise.all([
              planModel.deleteOne({ _id: plan }),
              subscriptionModel.deleteMany({ tenant }),
              subscriptionPeriodModel.deleteMany({ tenant }),
              d.collection("walletLedgers").deleteMany({
                tenant: platform.tenantId,
              }),
              d.collection("wallets").deleteMany({ tenant: platform.tenantId }),
            ]);
          }
        },
      );

      await t.step(
        "admin recovery: settle, abandon, a released key, refunds",
        async () => {
          const topups = d.collection("walletTopups");
          const old = new Date(Date.now() - 20 * 60_000);
          const row = async (amount: number, extra = {}) =>
            (await topups.insertOne({
              status: "initiated",
              tenant,
              currency: "usd",
              amount,
              createdAt: old,
              updatedAt: old,
              ...extra,
            })).insertedId;
          const refused = (fn: () => Promise<unknown>) =>
            fn().then(() => null, (e) => e as Response);

          // A fresh row is still waiting on its webhook: not the admin's yet.
          const fresh = await row(100, { createdAt: new Date() });
          assertEquals(
            (await refused(() => payments.settleStuck(fresh)))?.status,
            400,
          );

          // Charged, but the call never returned the charge id: Settle finds
          // it at the gateway and credits it once.
          const before = await balance();
          const charged = await row(700);
          gateway.found = {
            status: "completed",
            providerRef: "pi_found",
            amount: 700,
          };
          // A live charge is never abandoned.
          assertEquals(
            (await refused(() => payments.abandonStuck(charged)))?.status,
            400,
          );
          const settled = await payments.settleStuck(charged);
          assertEquals(settled.status, "completed");
          assertEquals(await balance(), before + 700);
          assertEquals(
            (await topups.findOne({ _id: charged }))?.providerRef,
            "pi_found",
          );
          // Settled rows aren't stuck: a second Settle is refused, nothing credited.
          assertEquals(
            (await refused(() => payments.settleStuck(charged)))?.status,
            400,
          );
          assertEquals(await balance(), before + 700);

          // Never reached the gateway: nothing to settle; Abandon frees its key.
          gateway.found = null;
          const lost = await row(400, { idempotencyKey: `add:${tenant}:lost` });
          assertEquals((await payments.settleStuck(lost)).outcome, "no_charge");
          await payments.abandonStuck(lost);
          const abandoned = await topups.findOne({ _id: lost });
          assertEquals(abandoned?.status, "failed");
          assertEquals(abandoned?.idempotencyKey, undefined);

          // Paid but not credited (a missing settlement tenant): Settle retries.
          const paid = await row(250, {
            status: "paid",
            providerRef: "pi_paid",
          });
          // Without the funding tenant, crediting can't work: Settle says why
          // (no 500) and leaves the row to settle again; nothing new is charged.
          config.WALLET_TOPUP_TENANT = "";
          const notSet = await refused(() => payments.settleStuck(paid));
          assertEquals(notSet?.status, 400);
          assert((await notSet!.text()).includes("WALLET_TOPUP_TENANT"));
          assertEquals((await topups.findOne({ _id: paid }))?.status, "paid");
          const charges = gateway.charges.length;
          const short = (await balance()) + 5_000;
          const unready = await refused(() =>
            payments.fundNow({
              tenant,
              amount: short,
              currency: "usd",
              key: `fund:unready:${tenant}`,
            })
          );
          assertEquals(unready?.status, 503);
          assertEquals(gateway.charges.length, charges, "no card charged");
          config.WALLET_TOPUP_TENANT = funding.tenantId.toHexString();
          assertEquals((await payments.settleStuck(paid)).status, "completed");
          assertEquals(await balance(), before + 950);

          // A declined plan payment doesn't keep its key: retrying with a
          // working card charges afresh.
          const key = `fund:test:${tenant}`;
          const need = (await balance()) + 1_000;
          gateway.next = () => ({
            status: "failed",
            error: "Your card was declined.",
          });
          await assertRejects(() =>
            payments.fundNow({ tenant, amount: need, currency: "usd", key })
          );
          gateway.next = (amount) => ({ status: "completed", amount });
          assertEquals(
            (await payments.fundNow({
              tenant,
              amount: need,
              currency: "usd",
              key,
            }))
              .status,
            "funded",
          );

          // A refund is kept for the admin until marked handled.
          await payments.handleWebhook(
            "stripe",
            webhook({
              id: `evt_refund_${tenant}`,
              type: "charge.refunded",
              kind: "refund",
              providerRef: "pi_found",
              amount: 700,
              currency: "usd",
            }),
          );
          const kept = await paymentEventModel.findOne({
            eventId: `evt_refund_${tenant}`,
          });
          assertEquals(kept?.kept, true);
          assert(!kept?.expiresAt);
          assertEquals(String(kept?.tenant), String(tenant));
          await payments.markHandled(kept!._id, session.user);
          assert(
            (await paymentEventModel.findOne({ _id: kept!._id }))?.handledAt,
          );
        },
      );

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

          // Admin → Payments is root only.
          const admin = await session.call("GET", "/paymentsAdmin/api/topups");
          assertEquals(admin.status, 403, JSON.stringify(admin.json));

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
      config.PLATFORM_TENANT = previousPlatform;
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
      await platform.cleanup();
    }
  },
});
