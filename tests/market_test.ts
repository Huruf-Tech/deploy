import { assert, assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { Env } from "@/core/utils/env.ts";
import { Mailer } from "@/plugins/Huruf-Tech/thunder-core/lib/mailer.ts";
import { Wallet } from "@/plugins/Huruf-Tech/thunder-core/lib/wallet.ts";
import { disputes, earnings, rentals } from "@/lib/services.ts";
import { HOLD_MS } from "@/lib/market/earnings.ts";
import { familyOf, linked, ratingsOf } from "@/lib/market/market.ts";
import {
  hourlyOf,
  monthlyOf,
  refundFor,
  securityFill,
  shareOf,
} from "@/lib/market/pricing.ts";
import { planModel } from "@/schemas/billing/plan.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { earningModel } from "@/schemas/billing/market.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { seedKeys } from "./sealing_test.ts";
import { testSession } from "./_session.ts";

// The market's money (PLAN §30.7–§30.10): a month matures with downtime
// refunded, the owner's commission, the security filled at most half a
// month, earnings held 14 days, claims and taking them back, disputes, a
// machine that leaves inside its term, an agreed move's split, ratings.

const DAY = 86_400_000;

Deno.test("market: a machine's family from what's measured", () => {
  assertEquals(familyOf({ cpus: 4, memMb: 8_192 }), {
    family: "Compute optimized",
    burstable: false,
  });
  assertEquals(familyOf({ cpus: 4, memMb: 16_384 }, 0.05), {
    family: "General purpose",
    burstable: true,
  });
  assertEquals(familyOf({ cpus: 2, memMb: 16_384 }).family, "Memory optimized");
});

Deno.test("market: prices, refunds, shares and the security fill", () => {
  const prices = { vcpu: 1, memGb: 0.5, diskGb: 0.02, whole: 10, trafficGb: 5 };
  // 2 vCPU, 3.875 + 0.125 GB, 50 GB: 2 + 2 + 1 = 5 cents an hour.
  assertEquals(hourlyOf(prices, { vcpu: 2, memMb: 3968, diskGb: 50 }, 128), 5);
  assertEquals(hourlyOf(prices, { vcpu: 8, memMb: 1, diskGb: 1 }, 0, true), 10);
  // No whole price (or 0): the sum of the parts.
  assertEquals(
    hourlyOf(
      { ...prices, whole: 0 },
      { vcpu: 2, memMb: 3968, diskGb: 50 },
      128,
      true,
    ),
    5,
  );
  assertEquals(monthlyOf(5), 3_650);
  // 10 hours of a $36.50 month: 50 cents; never more than the month.
  assertEquals(refundFor(3_650, 10 * 3_600_000), 50);
  assertEquals(refundFor(3_650, 59_999), 0, "counted to the minute");
  assertEquals(refundFor(3_650, 1_000 * 3_600_000), 3_650);
  assertEquals(shareOf(1_000, 20), { commission: 200, share: 800 });
  assertEquals(securityFill(800, 0, 10_000), 400, "half at most");
  assertEquals(securityFill(800, 9_900, 10_000), 100, "up to the cap");
  assertEquals(securityFill(800, 10_000, 10_000), 0);
});

Deno.test({
  name: "market: maturity, security, claims, reverts, disputes, forfeits",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const platform = await testSession("market-platform");
    const owner = await testSession("market-owner");
    const customer = await testSession("market-customer");
    const config = Env.getAll<Record<string, string>>();
    const previous = config.PLATFORM_TENANT;
    config.PLATFORM_TENANT = platform.tenantId.toHexString();
    Mailer.onSendMail = () => {};
    const { publicKey } = await seedKeys();
    const d = mongodb.db();
    const balance = async (tenant: ObjectId) =>
      (await d.collection("wallets").findOne({ tenant, currency: "usd" }))
        ?.balance ?? 0;
    const fund = (tenant: ObjectId, amount: number) =>
      Wallet.transfer({
        fromTenant: platform.tenantId,
        toTenant: tenant,
        amount,
        currency: "usd",
        allowOverdraft: true,
        overdraftLimit: 100_000_000,
        description: "test credit",
        idempotencyKey: crypto.randomUUID(),
      });
    const prices = {
      vcpu: 800 / 730,
      memGb: 400 / 730,
      diskGb: 12 / 730,
      whole: 6_000 / 730,
      trafficGb: 10,
    };
    const machine = async (name: string) => {
      const _id = new ObjectId();
      await serverModel.insertOne({
        _id,
        tenant: owner.tenantId,
        name,
        status: "active",
        provider: { kind: "machine" },
        createdAt: new Date(),
        identity: {
          signPublicKey: "x",
          boxPublicKey: publicKey,
          fingerprint: `market-${_id}`,
        },
        pool: {
          status: "ready",
          rent: { enabled: true, autoAccept: false, prices },
          allocatable: { cpus: 4, memMb: 16_384, diskGb: 200 },
          updatedAt: new Date(),
        },
        // deno-lint-ignore no-explicit-any
      } as any);
      await serverLeaseModel.insertOne({
        _id,
        tenant: owner.tenantId,
        status: "active",
        aliveUntil: new Date(Date.now() + 365 * DAY),
        offline: false,
        shard: 0,
        desiredVersion: 0,
        commandSeq: 0,
        deliveredSeq: 0,
      });
      return _id;
    };
    const m1 = await machine("home-1");
    const m2 = await machine("home-2");
    let rental: ObjectId;
    const period = async () =>
      (await subscriptionPeriodModel.findOne({ subscription: rental }, {
        sort: { periodStart: -1 },
      }))!;
    // Ends the running month `downMs` after a 30-day run.
    const mature = async (downMs: number) => {
      const p = await period();
      await subscriptionPeriodModel.updateOne({ _id: p._id }, {
        $set: {
          periodStart: new Date(Date.now() - 30 * DAY),
          periodEnd: new Date(Date.now() - 1_000),
          "usage.downtimeMs": downMs,
        },
      });
      await earnings.settle(p._id);
      return (await subscriptionPeriodModel.findOne({ _id: p._id }))!;
    };
    const rows = (type: string) =>
      earningModel.find({ owner: owner.tenantId, type: type as never })
        .toArray();

    try {
      await t.step(
        "a month matures: refund, commission, security, hold",
        async () => {
          await fund(customer.tenantId, 50_000);
          const res = await customer.call("POST", "/rentals/api/request", {
            machine: m1,
            vcpu: 1,
            memMb: 2048,
            diskGb: 25,
            termMonths: 6,
            waiveWithdrawal: true,
          });
          assertEquals(res.status, 200, JSON.stringify(res.json));
          rental = new ObjectId(res.json.rental);
          await rentals.approve(rental, owner.user, owner.tenantId);
          const charged = await period();
          assertEquals(charged.market!.commission, 20);
          assert(charged.market!.owner.equals(owner.tenantId));
          const price = charged.amount;
          // The cap: one month of the whole machine at its full price ($60).
          assertEquals((await earnings.securityOf(m1)).cap, 6_000);

          const before = await balance(customer.tenantId);
          const settled = await mature(10 * 3_600_000);
          const refund = refundFor(price, 10 * 3_600_000);
          const net = price - refund;
          const { share } = shareOf(net, 20);
          assertEquals(settled.settled!.refund, refund);
          assertEquals(settled.settled!.share, share);
          assertEquals(settled.settled!.toSecurity, Math.floor(share / 2));
          assertEquals(await balance(customer.tenantId), before + refund);
          // Settles once.
          await earnings.settle(settled._id);
          assertEquals(await balance(customer.tenantId), before + refund);

          const sum = await earnings.summary(owner.tenantId);
          assertEquals(sum.available, 0, "held 14 days after the month");
          assertEquals(sum.held, share - Math.floor(share / 2));
          assertEquals(sum.security, [{
            machine: String(m1),
            amount: Math.floor(share / 2),
          }]);
          const [month] = await rows("month").then((r) =>
            r.filter((x) => x.bucket === "earnings")
          );
          assertEquals(
            month.availableAt.getTime(),
            settled.periodEnd.getTime() + HOLD_MS,
          );
        },
      );

      let claimable = 0;
      await t.step("claimed into the wallet, and taken back", async () => {
        await earningModel.updateMany(
          { owner: owner.tenantId, bucket: "earnings" },
          { $set: { availableAt: new Date(Date.now() - 1_000) } },
        );
        claimable = (await earnings.summary(owner.tenantId)).available;
        assert(claimable > 0);
        const tooMuch = await owner.call("POST", "/earnings/api/claim", {
          amount: claimable + 1,
        });
        assertEquals(tooMuch.status, 400);
        const wallet = await balance(owner.tenantId);
        const claimed = await owner.call("POST", "/earnings/api/claim", {
          amount: claimable,
        });
        assertEquals(claimed.status, 200, JSON.stringify(claimed.json));
        assertEquals(await balance(owner.tenantId), wallet + claimable);
        assertEquals((await earnings.summary(owner.tenantId)).available, 0);

        // Nothing moved in the wallet since: taken back at once, in full.
        const back = await owner.call(
          "POST",
          `/earnings/api/claims/${claimed.json.claim}/revert`,
        );
        assertEquals(back.json, { result: "reverted", amount: claimable });
        assertEquals(await balance(owner.tenantId), wallet);
        assertEquals(
          (await earnings.summary(owner.tenantId)).available,
          claimable,
        );
        const twice = await owner.call(
          "POST",
          `/earnings/api/claims/${claimed.json.claim}/revert`,
        );
        assertEquals(twice.status, 400);

        // Claims at once: one gets it, every time.
        for (let round = 0; round < 5; round++) {
          const all = await Promise.all(
            [0, 1, 2].map(() =>
              earnings.claim(owner.tenantId, owner.user, claimable).then(
                (r) => r.claim,
                () => null,
              )
            ),
          );
          assertEquals(all.filter((c) => c).length, 1, `round ${round}`);
          assertEquals(await balance(owner.tenantId), wallet + claimable);
          const winner = all.find((c) => c)!;
          await owner.call("POST", `/earnings/api/claims/${winner}/revert`);
          assertEquals(await balance(owner.tenantId), wallet);
        }

        // Spent since: an admin decides, up to what wasn't spent.
        const again = await owner.call("POST", "/earnings/api/claim", {
          amount: claimable,
        });
        await Wallet.transfer({
          fromTenant: owner.tenantId,
          toTenant: platform.tenantId,
          amount: 100,
          currency: "usd",
          description: "spent on the platform",
          idempotencyKey: crypto.randomUUID(),
        });
        await fund(owner.tenantId, 5_000); // a top-up never adds to it
        const asked = await owner.call(
          "POST",
          `/earnings/api/claims/${again.json.claim}/revert`,
        );
        assertEquals(asked.json, {
          result: "requested",
          amount: claimable - 100,
        });
        const list = await platform.call("GET", "/rentalsAdmin/api/reverts");
        assertEquals(list.status, 403, "admins only");
        const [request] = await d.collection("claimReverts").find({
          owner: owner.tenantId,
          status: "pending",
        }).toArray();
        const tooBig = await earnings.decideRevert(
          request._id,
          platform.user,
          { amount: claimable },
        ).then(() => null, (e) => e as Response);
        assertEquals(tooBig?.status, 400);
        const wallet2 = await balance(owner.tenantId);
        await earnings.decideRevert(request._id, platform.user, {
          amount: claimable - 100,
        });
        assertEquals(await balance(owner.tenantId), wallet2 - claimable + 100);
        assertEquals(
          (await earnings.summary(owner.tenantId)).available,
          claimable - 100,
        );
      });

      await t.step(
        "a dispute freezes the machine's money and pays from it",
        async () => {
          const opened = await customer.call(
            "POST",
            `/rentals/api/${rental}/dispute`,
            { reason: "It was down most of the week" },
          );
          assertEquals(opened.status, 200, JSON.stringify(opened.json));
          const frozen = await earnings.summary(owner.tenantId);
          assertEquals(frozen.available, 0);
          assert(frozen.frozen > 0, "its released money is frozen");
          const claim = await owner.call("POST", "/earnings/api/claim", {
            amount: 1,
          });
          assertEquals(claim.status, 400);
          const before = await balance(customer.tenantId);
          const { security } = await earnings.securityOf(m1);
          await disputes.resolve(
            new ObjectId(opened.json.dispute),
            platform.user,
            {
              refund: 50,
              note: "Partly confirmed by the uptime",
            },
          );
          assertEquals(await balance(customer.tenantId), before + 50);
          // Nothing of it waits its 14 days any more: the security pays.
          const [paid] = await rows("dispute");
          assertEquals([paid.bucket, paid.amount], ["security", -50]);
          assertEquals(
            (await earnings.securityOf(m1)).security,
            security - 50,
          );
          assertEquals(
            (await earnings.summary(owner.tenantId)).available,
            claimable - 100,
            "decided: unfrozen",
          );
        },
      );

      await t.step(
        "ratings: after a matured month, weighted by money",
        async () => {
          const rated = await customer.call(
            "POST",
            `/rentals/api/${rental}/rate`,
            {
              stars: 4,
            },
          );
          assertEquals(rated.status, 200, JSON.stringify(rated.json));
          assertEquals((await ratingsOf([m1])).get(String(m1)), {
            stars: 4,
            count: 1,
          });
        },
      );

      await t.step(
        "an agreed move's month is split between the owners",
        async () => {
          // A new month, moved halfway to the owner's other machine at its price.
          await subscriptionPeriodModel.insertOne({
            tenant: customer.tenantId,
            subscription: rental,
            scope: "server",
            plan: (await subscriptionModel.findOne({ _id: rental }))!.plan,
            periodStart: new Date(Date.now() - 30 * DAY),
            periodEnd: new Date(Date.now() - 2_000),
            amount: 2_000,
            currency: "usd",
            limitsSnapshot: (await period()).limitsSnapshot,
            featuresSnapshot: (await period()).featuresSnapshot,
            resourcesSnapshot: (await period()).resourcesSnapshot,
            market: {
              owner: owner.tenantId,
              machine: m1,
              commission: 20,
              split: {
                owner: owner.tenantId,
                machine: m2,
                commission: 20,
                from: new Date(Date.now() - 15 * DAY),
                amount: 1_200,
              },
            },
            kind: "paid",
            createdAt: new Date(),
          });
          const p = (await subscriptionPeriodModel.findOne({
            amount: 2_000,
            subscription: rental,
          }))!;
          await earnings.settle(p._id);
          const settled =
            (await subscriptionPeriodModel.findOne({ _id: p._id }))!;
          // 1 200 to the target (960 after 20 %), 800 to the proposer (640).
          assertEquals(settled.settled!.share, 960 + 640);
          const months = await earningModel.find({ period: p._id }).toArray();
          const of = (m: ObjectId) =>
            months.filter((r) => r.machine!.equals(m))
              .reduce((a, r) => a + r.amount, 0);
          assertEquals([of(m2), of(m1)], [960, 640]);
        },
      );

      await t.step(
        "leaving inside the term forfeits the security",
        async () => {
          const res = await customer.call("POST", "/rentals/api/request", {
            machine: m1,
            vcpu: 0.5,
            memMb: 1024,
            diskGb: 10,
            termMonths: 6,
            waiveWithdrawal: true,
          });
          rental = new ObjectId(res.json.rental);
          await rentals.approve(rental, owner.user, owner.tenantId);
          // Disputes and ratings wait for a paid month to end.
          const early = await customer.call(
            "POST",
            `/rentals/api/${rental}/dispute`,
            { reason: "Too early to tell, really" },
          );
          assertEquals(early.status, 400, JSON.stringify(early.json));
          const { security } = await earnings.securityOf(m1);
          assert(security > 0);
          const before = await balance(customer.tenantId);
          const left = await mature(4 * DAY);
          assertEquals(left.settled!.left, true);
          assertEquals(
            left.settled!.share,
            0,
            "the owner earns nothing that month",
          );
          assertEquals(
            left.settled!.commission,
            left.amount - left.settled!.refund,
          );
          assertEquals((await earnings.securityOf(m1)).security, 0);
          // The downtime back, and the security as compensation.
          assertEquals(
            await balance(customer.tenantId),
            before + left.settled!.refund + security,
          );
        },
      );

      await t.step("the same person on both sides is linked", async () => {
        assertEquals(await linked(customer.tenantId, owner.tenantId), false);
        await d.collection("paymentCards").updateMany(
          { tenant: { $in: [customer.tenantId, owner.tenantId] } },
          { $set: { fingerprint: "same-card" } },
        );
        assertEquals(await linked(customer.tenantId, owner.tenantId), true);
      });
    } finally {
      config.PLATFORM_TENANT = previous;
      Mailer.onSendMail = undefined;
      const tenants = [platform.tenantId, owner.tenantId, customer.tenantId];
      await Promise.all([
        planModel.deleteMany({ allowedTenants: customer.tenantId }),
        d.collection("earnings").deleteMany({ owner: owner.tenantId }),
        d.collection("claimReverts").deleteMany({ owner: owner.tenantId }),
        d.collection("disputes").deleteMany({ owner: owner.tenantId }),
        d.collection("machineRatings").deleteMany({
          machine: { $in: [m1, m2] },
        }),
        ...[
          "subscriptions",
          "subscriptionPeriods",
          "servers",
          "serverLeases",
          "agentCommands",
          "bootstrapSessions",
          "wallets",
          "walletLedgers",
          "tenantUsage",
        ].map((c) => d.collection(c).deleteMany({ tenant: { $in: tenants } })),
      ]);
      await Promise.all([
        platform.cleanup(),
        owner.cleanup(),
        customer.cleanup(),
      ]);
    }
  },
});
