import { assert, assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
// First: the handler sets up the framework (zod's strictParse) the wallet relies on.
import "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { billing, entitlements } from "@/lib/services.ts";
import { prorate } from "@/lib/billing/billing.ts";
import { Wallet } from "@/plugins/Huruf-Tech/thunder-core/lib/wallet.ts";
import { Env } from "@/core/utils/env.ts";
import { $plan, planModel } from "@/schemas/billing/plan.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { testSession } from "./_session.ts";

// Subscriptions per subject and proration (PLAN §26.6 B, Phase 16b).

const DAY = 86_400_000;
const near = (actual: number, expected: number, what: string) =>
  assert(
    Math.abs(actual - expected) <= 2,
    `${what}: ${actual}, expected about ${expected}`,
  );

Deno.test("prorate: the unused share of what a paid period cost", () => {
  const now = new Date();
  const period = (startDays: number, endDays: number, extra = {}) => ({
    kind: "paid" as const,
    amount: 1_000,
    periodStart: new Date(now.getTime() + startDays * DAY),
    periodEnd: new Date(now.getTime() + endDays * DAY),
    ...extra,
  });
  assertEquals(prorate(period(-15, 15), now), 500);
  assertEquals(prorate(period(0, 30), now), 1_000);
  assertEquals(prorate(period(-30, 0), now), 0, "ended");
  assertEquals(prorate(period(-15, 15, { kind: "complimentary" }), now), 0);
  // A period that got a credit itself was worth its price, not what was paid.
  assertEquals(
    prorate(period(-15, 15, { amount: 600, proratedCredit: 400 }), now),
    500,
  );
});

Deno.test({
  name: "billing: proration, refunds, server subscriptions beside the plan",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const session = await testSession("billing-subjects");
    const platform = await testSession("billing-subjects-platform");
    const { call, tenantId } = session;
    const d = mongodb.db();
    const balance = async () =>
      (await d.collection("wallets").findOne({
        tenant: tenantId,
        currency: "usd",
      }))?.balance ?? 0;
    const config = Env.getAll<Record<string, string>>();
    const previous = config.PLATFORM_TENANT;
    config.PLATFORM_TENANT = platform.tenantId.toHexString();

    const created: ObjectId[] = [];
    try {
      const plan = async (
        name: string,
        amount: number,
        interval: "month" | "year",
        extra = {},
      ) => {
        const { insertedId } = await planModel.insertOne($plan.parse({
          name,
          slug: `${name.toLowerCase().replaceAll(" ", "-")}-${Date.now()}`,
          price: { amount, currency: "usd", interval },
          ...extra,
        }));
        created.push(insertedId);
        return insertedId;
      };
      const plans = {
        a: await plan("Starter", 1_000, "month"),
        b: await plan("Team", 3_000, "month"),
        c: await plan("Scale yearly", 60_000, "year"),
        d: await plan("Business", 6_000, "month"),
        small: await plan("Small", 2_200, "month", {
          kind: "server",
          resources: { vcpu: 1, memMb: 2_048, diskGb: 25, trafficGb: 100 },
        }),
      };
      // The workspace period now, moved so that `daysLeft` of 30 remain.
      const halfway = async (daysLeft: number) => {
        const now = Date.now();
        await subscriptionPeriodModel.updateMany(
          {
            tenant: tenantId,
            scope: "workspace",
            periodEnd: { $gt: new Date() },
          },
          {
            $set: {
              periodStart: new Date(now - (30 - daysLeft) * DAY),
              periodEnd: new Date(now + daysLeft * DAY),
            },
          },
        );
      };
      const latest = () =>
        subscriptionPeriodModel.findOne(
          { tenant: tenantId, scope: "workspace" },
          { sort: { _id: -1 } },
        );

      await Wallet.transfer({
        fromTenant: platform.tenantId,
        toTenant: tenantId,
        amount: 100_000,
        currency: "usd",
        allowOverdraft: true,
        overdraftLimit: 10_000_000,
        description: "test credit",
      });

      await t.step("an upgrade halfway credits the unused half", async () => {
        const first = await call("POST", "/billing/api/subscribe", {
          plan: plans.a,
        });
        assertEquals(first.json.result, "active", JSON.stringify(first.json));
        assertEquals(await balance(), 99_000);
        await halfway(15);

        const quote = await call("GET", `/billing/api/quote?plan=${plans.b}`);
        assertEquals(quote.status, 200, JSON.stringify(quote.json));
        assertEquals(quote.json.change, "now");
        near(quote.json.credit, 500, "credit");
        near(quote.json.due, 2_500, "due");

        const res = await call("POST", "/billing/api/subscribe", {
          plan: plans.b,
        });
        assertEquals(res.json.result, "active", JSON.stringify(res.json));
        near(await balance(), 96_500, "balance");
        const period = await latest();
        near(period!.amount, 2_500, "charged");
        near(period!.proratedCredit!, 500, "credited");
        assertEquals((await entitlements.resolve(tenantId)).plan, plans.b);
      });

      await t.step(
        "credit beyond the new price goes back to the wallet",
        async () => {
          // Monthly → yearly: a full yearly price minus the Team month just paid.
          await call("POST", "/billing/api/subscribe", { plan: plans.c });
          near(await balance(), 96_500 - 57_000, "after the yearly plan");

          // Yearly → a dearer monthly plan: the year's unused value is far more
          // than one month, so nothing is due and the rest is refunded.
          const quote = await call("GET", `/billing/api/quote?plan=${plans.d}`);
          assertEquals(quote.json.due, 0);
          near(quote.json.refund, 54_000, "refund");
          const before = await balance();
          await call("POST", "/billing/api/subscribe", { plan: plans.d });
          near(await balance(), before + 54_000, "refunded");
          const period = await latest();
          assertEquals(period!.amount, 0);
          assertEquals(period!.proratedCredit, 6_000);
          const refund = await d.collection("walletLedgers").findOne({
            tenant: tenantId,
            description: "Unused time of your previous plan",
          });
          assert(refund, "the refund has its ledger entry");
        },
      );

      const server = new ObjectId();
      await t.step(
        "a rented server's subscription lives beside the workspace plan",
        async () => {
          const listed = (await call("GET", "/billing/api/plans")).json
            .map((p: { _id: string }) => p._id);
          assert(
            !listed.includes(String(plans.small)),
            "server sizes aren't workspace plans",
          );
          assert(
            (await billing.available(tenantId, "server"))
              .some((p) => p._id.equals(plans.small)),
          );

          const before = await balance();
          const res = await billing.subscribe(
            tenantId,
            session.user,
            plans.small,
            { kind: "server", server },
          );
          assertEquals(res.result, "active");
          assertEquals(await balance(), before - 2_200);
          const subs = await subscriptionModel.find({ tenant: tenantId })
            .toArray();
          assertEquals(subs.map((s) => s.kind).sort(), ["server", "workspace"]);
          const rented = await subscriptionPeriodModel.findOne({
            tenant: tenantId,
            scope: "server",
          });
          assertEquals(rented!.resourcesSnapshot!.memMb, 2_048);
          // The tenant's plan is still its workspace plan.
          entitlements.invalidate(tenantId);
          assertEquals((await entitlements.resolve(tenantId)).plan, plans.d);
          assertEquals(
            String((await billing.currentPeriod(tenantId))!.plan),
            String(plans.d),
          );
          // A workspace plan isn't a server size, and the other way round.
          await billing.subscribe(tenantId, session.user, plans.a, {
            kind: "server",
            server,
          }).then(
            () => assert(false, "a workspace plan for a server"),
            (e: Response) => assertEquals(e.status, 404),
          );
        },
      );

      await t.step("renewal renews each due subscription once", async () => {
        const past = new Date(Date.now() - 1_000);
        await subscriptionPeriodModel.updateMany(
          { tenant: tenantId, periodEnd: { $gt: past } },
          { $set: { periodEnd: past } },
        );
        await subscriptionModel.updateMany({ tenant: tenantId }, {
          $set: { currentPeriodEnd: past },
          $unset: { nextRenewalAttemptAt: "" },
        });
        const before = await balance();
        await Promise.all(
          Array.from({ length: 5 }, () => billing.renewIfDue(tenantId)),
        );
        assertEquals(await balance(), before - 6_000 - 2_200);
        const subs = await subscriptionModel.find({ tenant: tenantId })
          .toArray();
        assert(
          subs.every((s) =>
            s.status === "active" && s.currentPeriodEnd! > new Date()
          ),
        );

        // Cancelling the workspace plan leaves the rented server alone.
        await billing.cancel(tenantId);
        const rented = await subscriptionModel.findOne({ server });
        assertEquals(rented!.cancelAtPeriodEnd, false);
      });
    } finally {
      config.PLATFORM_TENANT = previous;
      await Promise.all([
        planModel.deleteMany({ _id: { $in: created } }),
        ...["subscriptions", "subscriptionPeriods"].map((name) =>
          d.collection(name).deleteMany({ tenant: tenantId })
        ),
        ...[tenantId, platform.tenantId].map((tenant) =>
          Promise.all([
            d.collection("wallets").deleteMany({ tenant }),
            d.collection("walletLedgers").deleteMany({ tenant }),
          ])
        ),
      ]);
      await Promise.all([session.cleanup(), platform.cleanup()]);
    }
  },
});
