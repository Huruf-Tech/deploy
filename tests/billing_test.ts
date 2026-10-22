import { assert, assertEquals, assertMatch } from "@std/assert";
import { ObjectId } from "mongodb";
// First: the handler sets up the framework (zod's strictParse) the wallet relies on.
import "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { billing, entitlements } from "@/lib/services.ts";
import { Wallet } from "@/plugins/Huruf-Tech/thunder-core/lib/wallet.ts";
import { Env } from "@/core/utils/env.ts";
import { $plan, planModel } from "@/schemas/billing/plan.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { testSession } from "./_session.ts";

// Plans, subscriptions and lazy renewal (PLAN §16 Phase 10, §22).

Deno.test({
  name: "billing: upgrade, private plans, renewal once, Free fallback, limits",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const session = await testSession("billing");
    const platform = await testSession("platform");
    const other = await testSession("billing-other");
    const { call, tenantId } = session;
    const d = mongodb.db();
    const plans: ObjectId[] = [];
    const balance = async () =>
      (await d.collection("wallets").findOne({
        tenant: tenantId,
        currency: "usd",
      }))?.balance ?? 0;
    // Ends the current period now, as if its time had passed.
    const endPeriod = async () => {
      const past = new Date(Date.now() - 1_000);
      await subscriptionPeriodModel.updateMany(
        { tenant: tenantId, periodEnd: { $gt: past } },
        { $set: { periodEnd: past } },
      );
      await subscriptionModel.updateOne({ tenant: tenantId }, {
        $set: { currentPeriodEnd: past },
        $unset: { nextRenewalAttemptAt: "" },
      });
      entitlements.invalidate(tenantId);
    };

    // `.env` wins over the `envs` collection, so set it on the loaded config.
    const config = Env.getAll<Record<string, string>>();
    const previous = config.PLATFORM_TENANT;
    config.PLATFORM_TENANT = platform.tenantId.toHexString();

    try {
      await t.step(
        "plans: public for all, private for its tenant",
        async () => {
          const plan = (name: string, extra: object) =>
            $plan.parse({
              name,
              slug: `${name.toLowerCase()}-${Date.now()}`,
              price: { amount: 2_000, currency: "usd", interval: "month" },
              ...extra,
            });
          for (
            const doc of [
              plan("Pro", { limits: { servers: 50, projects: 200 } }),
              plan("Partner", {
                visibility: "private",
                allowedTenants: [other.tenantId],
              }),
            ]
          ) {
            plans.push((await planModel.insertOne(doc)).insertedId);
          }
          const { json } = await call("GET", "/billing/api/plans");
          const ids = json.map((p: { _id: string }) => p._id);
          assert(ids.includes(plans[0].toHexString()));
          assert(
            !ids.includes(plans[1].toHexString()),
            "another tenant's plan",
          );
          const theirs = await other.call("GET", "/billing/api/plans");
          assert(
            theirs.json.some((p: { _id: string }) =>
              p._id === plans[1].toHexString()
            ),
          );
        },
      );

      await t.step("an empty wallet can't upgrade", async () => {
        const res = await call("POST", "/billing/api/subscribe", {
          plan: plans[0],
        });
        assertEquals(res.status, 400);
        assertMatch(JSON.stringify(res.json), /enough USD/);
        assertEquals((await call("GET", "/billing/api")).json.source, "free");
      });

      await t.step("an upgrade raises the quotas at once", async () => {
        await Wallet.transfer({
          fromTenant: platform.tenantId,
          toTenant: tenantId,
          amount: 5_000,
          currency: "usd",
          allowOverdraft: true,
          overdraftLimit: 1_000_000,
          description: "test credit",
        });
        const before = (await call("GET", "/billing/api")).json;
        assertEquals(before.limits.servers, 5);
        const res = await call("POST", "/billing/api/subscribe", {
          plan: plans[0],
        });
        assertEquals(res.status, 200, JSON.stringify(res.json));
        assertEquals(res.json.result, "active");
        const after = (await call("GET", "/billing/api")).json;
        assertEquals([after.plan.name, after.limits.servers], ["Pro", 50]);
        assertEquals(await balance(), 3_000);
        const { json: periods } = await call("GET", "/billing/api/periods");
        assertEquals(periods.length, 1);
        assert(periods[0].ledgerReference, "the charge has its ledger entry");

        // Subscribing again to the same change doesn't charge twice.
        const again = await call("POST", "/billing/api/subscribe", {
          plan: plans[0],
        });
        assertEquals(again.status, 400);
        assertEquals(await balance(), 3_000);
      });

      await t.step(
        "cancel waits for the period end; resubscribe resumes",
        async () => {
          assertEquals((await call("POST", "/billing/api/cancel")).status, 200);
          let sub = (await call("GET", "/billing/api")).json.subscription;
          assertEquals([sub.cancelAtPeriodEnd, sub.autoRenew], [true, false]);
          const resumed = await call("POST", "/billing/api/subscribe", {
            plan: plans[0],
          });
          assertEquals(resumed.json.result, "resumed");
          sub = (await call("GET", "/billing/api")).json.subscription;
          assertEquals([sub.cancelAtPeriodEnd, sub.autoRenew], [false, true]);
        },
      );

      await t.step("concurrent renewals charge exactly once", async () => {
        await endPeriod();
        await Promise.all(
          Array.from({ length: 5 }, () => billing.renewIfDue(tenantId)),
        );
        assertEquals(await balance(), 1_000);
        assertEquals(
          await subscriptionPeriodModel.countDocuments({
            tenant: tenantId,
            kind: "paid",
          }),
          2,
        );
        assertEquals((await entitlements.resolve(tenantId)).limits.servers, 50);
      });

      await t.step(
        "an empty wallet at renewal falls back to Free",
        async () => {
          await endPeriod();
          const resolved = await entitlements.resolve(tenantId); // renews lazily
          assertEquals(resolved.source, "free");
          assertEquals(resolved.limits.servers, 5);
          const sub = await subscriptionModel.findOne({ tenant: tenantId });
          assertEquals(sub!.status, "pastDue");
          assert(sub!.nextRenewalAttemptAt! > new Date(), "retried hourly");
          assertEquals(await balance(), 1_000, "nothing charged");
          const page = (await call("GET", "/billing/api")).json;
          assertEquals(page.subscription.status, "pastDue");
          assertMatch(page.subscription.lastError, /balance/i);
        },
      );

      await t.step("a complimentary period applies at once", async () => {
        await billing.grantComplimentary({
          tenant: tenantId,
          plan: plans[1],
          days: 30,
          note: "partner",
          by: session.user,
        });
        const page = (await call("GET", "/billing/api")).json;
        assertEquals([page.plan.name, page.period.kind], [
          "Partner",
          "complimentary",
        ]);
      });

      await t.step(
        "servers beyond the quota are throttled after the grace",
        async () => {
          const servers = [new ObjectId(), new ObjectId()];
          await d.collection("servers").insertMany(servers.map((_id) => ({
            _id,
            tenant: tenantId,
            status: "active",
            name: `s-${_id}`,
            identity: { fingerprint: `test-${_id}` },
          })));
          await serverLeaseModel.insertMany(servers.map((_id) => ({
            _id,
            tenant: tenantId,
            status: "active",
            aliveUntil: new Date(),
            offline: false,
            shard: 0,
            desiredVersion: 0,
            commandSeq: 0,
            deliveredSeq: 0,
          })));
          const limited = { ...(await entitlements.resolve(tenantId)) };
          limited.limits = { ...limited.limits, servers: 1 };
          await billing.enforceLimits(tenantId, limited);
          const usage = await tenantUsageModel.findOne({ tenant: tenantId });
          assert(usage?.overLimitSince, "the grace starts");
          assertEquals(
            await serverLeaseModel.countDocuments({
              tenant: tenantId,
              throttled: true,
            }),
            0,
            "within the grace",
          );
          await tenantUsageModel.updateOne({ tenant: tenantId }, {
            $set: { overLimitSince: new Date(Date.now() - 4 * 86_400_000) },
          });
          await billing.enforceLimits(tenantId, limited);
          const throttled = await serverLeaseModel.find({
            tenant: tenantId,
            throttled: true,
          }).toArray();
          assertEquals(throttled.map((l) => String(l._id)), [
            String(servers[1]),
          ]);

          await billing.enforceLimits(
            tenantId,
            await entitlements.resolve(tenantId),
          );
          assertEquals(
            await serverLeaseModel.countDocuments({
              tenant: tenantId,
              throttled: true,
            }),
            0,
            "back within the quota",
          );
        },
      );
    } finally {
      config.PLATFORM_TENANT = previous;
      await Promise.all([
        planModel.deleteMany({ _id: { $in: plans } }),
        ...["subscriptions", "subscriptionPeriods", "servers", "serverLeases"]
          .map((name) => d.collection(name).deleteMany({ tenant: tenantId })),
        ...[tenantId, platform.tenantId].map((tenant) =>
          Promise.all([
            d.collection("wallets").deleteMany({ tenant }),
            d.collection("walletLedgers").deleteMany({ tenant }),
          ])
        ),
      ]);
      await Promise.all([
        session.cleanup(),
        platform.cleanup(),
        other.cleanup(),
      ]);
    }
  },
});
