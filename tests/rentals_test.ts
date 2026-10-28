import { assert, assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { Env } from "@/core/utils/env.ts";
import { Mailer } from "@/plugins/Huruf-Tech/thunder-core/lib/mailer.ts";
import { Wallet } from "@/plugins/Huruf-Tech/thunder-core/lib/wallet.ts";
import { billing, rentals } from "@/lib/services.ts";
import { counterDelta, overageOf } from "@/lib/rentals/rentals.ts";
import { hourlyOf, monthlyOf } from "@/lib/market/pricing.ts";
import { openSealed } from "@/lib/agents/sealing.ts";
import { registerAgent } from "@/lib/agents/servers.ts";
import { planModel } from "@/schemas/billing/plan.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";
import { seedKeys } from "./sealing_test.ts";
import { MOVE_PORT } from "@/schemas/protocol/agent.ts";
import { testSession } from "./_session.ts";

// Rentals (PLAN §26, §30): requests on a machine of the market, the owner's
// acceptance, the rented server, traffic, renewal with overage, resize,
// moving between machines, capacity and uptime, suspension and release, and
// a machine that leaves.

const DAY = 86_400_000;
// The launch "Shared CPU" rate card, by the hour (PLAN §30.3).
const prices = {
  vcpu: 800 / 730,
  memGb: 400 / 730,
  diskGb: 12 / 730,
  trafficGb: 10,
};
const priceOf = (vcpu: number, memMb: number, diskGb: number) =>
  monthlyOf(hourlyOf(prices, { vcpu, memMb, diskGb }, 128));
const SMALL = priceOf(1, 2048, 25);

Deno.test("rentals: price, overage and counters", () => {
  // 1 vCPU $8 + 2.125 GB × $4 + 25 GB × $0.12 = $19.50 a month.
  assertEquals(SMALL, 1_950);
  assertEquals(monthlyOf(1.5), 1_095, "730 hours, cents rounded up");
  assertEquals(overageOf(99e9, 100, 10), null);
  assertEquals(overageOf(105.2e9, 100, 10), { gb: 6, amount: 60 });
  assertEquals(
    counterDelta(undefined, 500),
    0,
    "the first reading is a baseline",
  );
  assertEquals(counterDelta(500, 800), 300);
  assertEquals(counterDelta(800, 50), 50, "a reset counts from 0");
});

Deno.test({
  name:
    "rentals: request, approve, join, traffic, renew, suspend, release, resize",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const platform = await testSession("rentals-platform");
    const customer = await testSession("rentals-customer");
    const tenant = customer.tenantId;
    const config = Env.getAll<Record<string, string>>();
    const previous = config.PLATFORM_TENANT;
    config.PLATFORM_TENANT = platform.tenantId.toHexString();
    const mails: { subject?: string }[] = [];
    Mailer.onSendMail = (mail) => void mails.push(mail);
    const { privateKey, publicKey } = await seedKeys();
    const d = mongodb.db();
    const balance = async () =>
      (await d.collection("wallets").findOne({ tenant, currency: "usd" }))
        ?.balance ?? 0;
    const fund = (amount: number) =>
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
    const commands = (type: string) =>
      agentCommandModel.find({ server: host, type: type as never }, {
        sort: { seq: 1 },
      }).toArray();
    // Owner emails go out in the background.
    const mailed = async (subject: RegExp) => {
      for (
        let i = 0;
        i < 40 && !mails.some((m) => subject.test(m.subject ?? ""));
        i++
      ) {
        await new Promise((r) => setTimeout(r, 50));
      }
      assert(
        mails.some((m) => subject.test(m.subject ?? "")),
        `no mail ${subject}`,
      );
    };
    const refused = (fn: () => Promise<unknown>) =>
      fn().then(() => null, (e) => e as Response);

    const rent = { enabled: true, autoAccept: false, prices };
    const small = {
      vcpu: 1,
      memMb: 2048,
      diskGb: 25,
      termMonths: 1,
      waiveWithdrawal: true,
    };
    const host = new ObjectId();
    await serverModel.insertOne({
      _id: host,
      tenant: platform.tenantId,
      name: "pool-1",
      status: "active",
      identity: {
        signPublicKey: "x",
        boxPublicKey: publicKey,
        fingerprint: `pool-${host}`,
      },
      provider: { kind: "machine" },
      createdAt: new Date(),
      pool: {
        status: "ready",
        rent,
        allocatable: { cpus: 2, memMb: 8192, diskGb: 100 },
        updatedAt: new Date(),
      },
      // deno-lint-ignore no-explicit-any
    } as any);
    await serverLeaseModel.insertOne({
      _id: host,
      tenant: platform.tenantId,
      status: "active",
      aliveUntil: new Date(),
      offline: false,
      shard: 0,
      desiredVersion: 0,
      commandSeq: 0,
      deliveredSeq: 0,
    });
    let rental: ObjectId;
    // A project on the rented server, gone with the rental.
    let onRental = "";
    const sub = async () => (await subscriptionModel.findOne({ _id: rental }))!;
    // Ends the rental's current period, as if a month had passed.
    const endPeriod = async (extra: object = {}) => {
      const past = new Date(Date.now() - 1_000);
      await subscriptionPeriodModel.updateMany(
        { subscription: rental, periodEnd: { $gt: past } },
        { $set: { periodEnd: past } },
      );
      await subscriptionModel.updateOne({ _id: rental }, {
        $set: { currentPeriodEnd: past, ...extra },
        $unset: { nextRenewalAttemptAt: "" },
      });
    };

    try {
      await t.step("the market and a quote", async () => {
        const { json } = await customer.call("GET", "/market/api/machines");
        const listed = json.find((m: { _id: string }) =>
          m._id === String(host)
        );
        assert(listed, JSON.stringify(json));
        assertEquals(
          [listed.official, listed.yours, listed.newArrival, listed.free.cpus],
          [true, false, true, 2],
        );
        const quote = await customer.call(
          "GET",
          `/market/api/quote?machine=${host}&vcpu=1.5&memMb=3072&diskGb=40`,
        );
        assertEquals(quote.status, 200, JSON.stringify(quote.json));
        assertEquals(quote.json.price, priceOf(1.5, 3072, 40));
        assertEquals(quote.json.fits, true);
        const odd = await customer.call(
          "GET",
          `/market/api/quote?machine=${host}&vcpu=1.3&memMb=3072&diskGb=40`,
        );
        assertEquals(odd.status, 400);
        // The owner can't rent their own machine.
        const own = await platform.call("POST", "/rentals/api/request", {
          machine: host,
          ...small,
        });
        assertEquals(own.status, 403, JSON.stringify(own.json));
      });

      await t.step("a request is funded, not charged", async () => {
        await fund(10_000);
        const unwaived = await customer.call("POST", "/rentals/api/request", {
          machine: host,
          ...small,
          waiveWithdrawal: false,
        });
        assertEquals(unwaived.status, 400, "it starts at once: agreed first");
        const res = await customer.call("POST", "/rentals/api/request", {
          machine: host,
          ...small,
        });
        assertEquals(res.status, 200, JSON.stringify(res.json));
        assertEquals(res.json.result, "requested");
        rental = new ObjectId(res.json.rental);
        assertEquals((await sub()).status, "requested");
        assertEquals((await sub()).rental!.size, {
          cpus: 1,
          memMb: 2048 + 128,
          diskGb: 25,
        });
        assert((await sub()).rental!.owner!.equals(platform.tenantId));
        assertEquals(await balance(), 10_000, "the money waits in the wallet");
        await mailed(/a rental request/);
        // The machine's owner sees it; the customer can't accept it.
        const theirs = await customer.call(
          "POST",
          `/hosting/api/${rental}/accept`,
        );
        assertEquals(theirs.status, 404);
        const queue = await platform.call("GET", "/hosting/api/requests");
        assert(
          queue.json.some((r: { _id: string }) => r._id === String(rental)),
          JSON.stringify(queue.json),
        );
      });

      await t.step(
        "the owner's acceptance charges, starts the term, creates the partition",
        async () => {
          assertEquals((await rentals.placement(rental)).fits, true);
          const accepted = await platform.call(
            "POST",
            `/hosting/api/${rental}/accept`,
          );
          assertEquals(accepted.status, 200, JSON.stringify(accepted.json));
          assertEquals((await sub()).status, "active");
          assert((await sub()).rental!.term!.until! > new Date());
          assertEquals(await balance(), 10_000 - SMALL);
          const [create] = await commands("partition.create");
          const payload = JSON.parse(
            await openSealed(
              privateKey,
              publicKey,
              (create.payload as { sealed: string }).sealed,
            ),
          );
          assertEquals(payload.size, { cpus: 1, memMb: 2176, diskGb: 25 });
          assertEquals(payload.isolated, true, "a rental is kept apart");
          assertEquals(payload.install.tenant, String(tenant));

          // The partition's agent joins with its token: a rented server, no quota.
          const used = (await tenantUsageModel.findOne({ tenant }))?.servers ??
            0;
          const hello = await registerAgent(
            {
              tenant: String(tenant),
              signPublicKey: `sign-${rental}`,
              boxPublicKey: publicKey,
              joinToken: payload.install.joinToken,
              inventory: {
                hostname: payload.name,
                os: "Ubuntu 24.04",
                arch: "amd64",
                cpuCores: 1,
                memory: 2176 * 2 ** 20,
                disk: 25 * 2 ** 30,
                agentVersion: "0.0.21",
              },
            },
            `fp-${rental}`,
            null,
          );
          assertEquals(hello.status, "active");
          const server =
            (await serverModel.findOne({ _id: new ObjectId(hello.server) }))!;
          assertEquals(server.provider.kind, "rented");
          assert(server.provider.host!.equals(host));
          assertEquals(server.name, "Huruf · 1 vCPU · 2 GB");
          // Up: its lease is current, so no downtime is refunded.
          await serverLeaseModel.updateOne({ _id: server._id }, {
            $set: { aliveUntil: new Date(Date.now() + 365 * DAY) },
          });
          assert((await sub()).server!.equals(server._id));
          assertEquals(
            (await tenantUsageModel.findOne({ tenant }))?.servers ?? 0,
            used,
          );
          // It can't be deleted like an own server.
          const del = await customer.call(
            "DELETE",
            `/servers/api/${server._id}`,
          );
          assertEquals(del.status, 400, JSON.stringify(del.json));
          // Its ports are the pool machine's: custom domains only.
          const exposed = await customer.call("POST", "/projects/api", {
            name: "web",
            slug: "web",
            source: { type: "image", image: "nginx:1.27" },
            runtime: { port: 80 },
            publicPort: 8080,
            servers: [server._id.toString()],
          });
          assertEquals(exposed.status, 400, JSON.stringify(exposed.json));
          assert(JSON.stringify(exposed.json).includes("custom domain"));
          const kept = await customer.call("POST", "/projects/api", {
            name: "api",
            slug: "api",
            source: { type: "image", image: "nginx:1.27" },
            runtime: { port: 80 },
            servers: [server._id.toString()],
          });
          assertEquals(kept.status, 200, JSON.stringify(kept.json));
          onRental = kept.json._id;
        },
      );

      await t.step("traffic goes to the current period", async () => {
        const name = (await sub()).rental!.partition!;
        const usage = (rx: number, tx: number) =>
          rentals.recordUsage(host, [{
            name,
            state: "running",
            size: { cpus: 1, memMb: 2176, diskGb: 25 },
            cpuMicros: 0,
            memUsed: 0,
            diskUsed: 0,
            rxBytes: rx,
            txBytes: tx,
          }]);
        const traffic = async () =>
          (await subscriptionPeriodModel.findOne({ subscription: rental }, {
            sort: { periodStart: -1 },
          }))!
            .usage!.trafficBytes;
        await usage(1_000, 500); // baseline
        assertEquals(await traffic(), 0);
        await usage(3e9 + 1_000, 500);
        assertEquals(await traffic(), 3e9);
        await usage(2e9, 0); // the agent rebooted: counters restarted
        assertEquals(await traffic(), 5e9);
        // Past its allowance (100 GB): renewal charges 6 GB more.
        await subscriptionPeriodModel.updateOne(
          { subscription: rental },
          { $set: { "usage.trafficBytes": 105.2e9 } },
        );
        await endPeriod();
        const before = await balance();
        await billing.renewIfDue(tenant);
        assertEquals(await balance(), before - SMALL - 60);
        const renewed = await subscriptionPeriodModel.findOne(
          { subscription: rental },
          { sort: { periodStart: -1 } },
        );
        assertEquals(renewed!.overage, { gb: 6, amount: 60 });
        assertEquals((await sub()).status, "active");
      });

      await t.step(
        "a bigger size, approved, is prorated and applied live",
        async () => {
          const res = await customer.call(
            "POST",
            `/rentals/api/${rental}/resize`,
            { vcpu: 2, memMb: 4096, diskGb: 50 },
          );
          assertEquals(res.status, 200, JSON.stringify(res.json));
          assert((await sub()).rental!.pendingChange);
          const before = await balance();
          // Not taking new rentals doesn't stop the ones there from growing.
          await serverModel.updateOne({ _id: host }, {
            $set: { "pool.accepting": false },
          });
          await rentals.approveResize(rental, platform.user);
          await serverModel.updateOne({ _id: host }, {
            $unset: { "pool.accepting": "" },
          });
          const plan = await planModel.findOne({ _id: (await sub()).plan });
          assertEquals(plan!.resources!.vcpu, 2);
          assertEquals(plan!.price.amount, priceOf(2, 4096, 50));
          assert(await balance() < before, "charged");
          assert(
            before - await balance() < priceOf(2, 4096, 50),
            "with the unused Small month credited",
          );
          const [resize] = await commands("partition.resize");
          assertEquals((resize.payload as { size: unknown }).size, {
            cpus: 2,
            memMb: 4096 + 128,
            diskGb: 50,
          });
          assertEquals((await sub()).rental!.pendingChange, undefined);
        },
      );

      await t.step(
        "moving to another machine, capacity, draining and uptime",
        async () => {
          const host2 = new ObjectId();
          await serverModel.insertOne({
            _id: host2,
            tenant: platform.tenantId,
            name: "pool-2",
            status: "active",
            inventory: { publicIp: "203.0.113.31" },
            identity: {
              signPublicKey: "x",
              boxPublicKey: publicKey,
              fingerprint: `pool-${host2}`,
            },
            provider: { kind: "machine" },
            createdAt: new Date(),
            pool: {
              status: "ready",
              rent,
              allocatable: { cpus: 2, memMb: 8192, diskGb: 100 },
              updatedAt: new Date(),
            },
            // deno-lint-ignore no-explicit-any
          } as any);
          await serverLeaseModel.insertOne({
            _id: host2,
            tenant: platform.tenantId,
            status: "active",
            aliveUntil: new Date(),
            offline: false,
            shard: 0,
            desiredVersion: 0,
            commandSeq: 0,
            deliveredSeq: 0,
          });
          const name = (await sub()).rental!.partition!;
          const opened = async (server: ObjectId, type: string) => {
            const [last] = await agentCommandModel.find(
              { server, type: type as never },
              { sort: { seq: -1 }, limit: 1 },
            ).toArray();
            return {
              _id: last._id,
              ...JSON.parse(
                await openSealed(
                  privateKey,
                  publicKey,
                  (last.payload as { sealed: string }).sealed,
                ),
              ),
            };
          };

          // Its machine has no address to move from yet: no move.
          await serverModel.updateOne({ _id: host }, {
            $unset: { "inventory.publicIp": "", "inventory.privateIp": "" },
          });
          let targets = await rentals.moveTargets(rental);
          assertEquals(targets.targets.map((m) => m.reachable), [false]);
          assert(targets.downtimeSec >= 60);
          await serverModel.updateOne({ _id: host }, {
            $set: { "inventory.publicIp": "203.0.113.30" },
          });
          targets = await rentals.moveTargets(rental);
          assertEquals(
            targets.targets.map((m) => [m.name, m.fits, m.reachable]),
            [["pool-2", true, true]],
          );

          // Capacity per machine for rent, and a machine with rentals can't go.
          const { machines } = await rentals.capacity();
          const row = machines.find((m) => m._id === String(host))!;
          assertEquals(
            [row.forRent, row.rentals, row.rentedMemMb, row.freeMemMb],
            [true, 1, 4096 + 128, 8192 - 4224],
          );
          assert(machines.some((m) => m._id === String(host2)));
          // The platform's own partitions on a machine take its room too.
          await serverModel.updateOne({ _id: host2 }, {
            $set: {
              "resources.partitions": [{
                name: "pown",
                state: "running",
                size: { cpus: 1, memMb: 2048, diskGb: 20 },
                cpuMicros: 0,
                memUsed: 0,
                diskUsed: 0,
                rxBytes: 0,
                txBytes: 0,
              }],
            },
          });
          const roomy = (await rentals.moveTargets(rental)).targets[0];
          assertEquals(roomy.free, { memMb: 8192 - 2048, diskGb: 80 });
          await serverModel.updateOne({ _id: host2 }, {
            $unset: { "resources.partitions": "" },
          });
          const del = await platform.call("DELETE", `/servers/api/${host}`);
          assertEquals(del.status, 400, JSON.stringify(del.json));
          assert(JSON.stringify(del.json).includes("move them"));

          // Moved: the target pulls from the source's address, encrypted.
          await rentals.move(rental, host2, platform.user);
          assertEquals(
            (await refused(() => rentals.move(rental, host2, platform.user)))
              ?.status,
            400,
            "one move at a time",
          );
          const receive = await opened(host2, "partition.receive");
          const send = await opened(host, "partition.send");
          assertEquals(send.listen, `:${MOVE_PORT}`);
          assertEquals(
            [receive.name, receive.from, receive.token, receive.size],
            [
              name,
              `203.0.113.30:${MOVE_PORT}`,
              send.token,
              (await sub()).rental!.size,
            ],
          );
          assertEquals(receive.key, send.key, "one key for the move");
          assertEquals(atob(send.key).length, 32);
          const listed = await customer.call("GET", "/rentals/api");
          assertEquals(listed.json[0].moving, true);
          await rentals.moveFinished(receive._id, { ok: true });
          const server = (await sub()).server!;
          assert((await sub()).rental!.host!.equals(host2));
          assertEquals((await sub()).rental!.move, undefined);
          assert(
            (await serverModel.findOne({ _id: server }))!.provider.host!.equals(
              host2,
            ),
          );
          assertEquals(
            (await agentCommandModel.findOne({
              server: host,
              type: "partition.remove",
            }))?.payload,
            { name },
          );

          // A failed move starts it again where it was.
          await rentals.move(rental, host, platform.user);
          const failed = await opened(host, "partition.receive");
          await rentals.moveFinished(failed._id, {
            ok: false,
            error: "connection reset",
          });
          assert((await sub()).rental!.host!.equals(host2));
          assertEquals(
            (await sub()).rental!.lastMove!.error,
            "connection reset",
          );
          assertEquals(
            (await agentCommandModel.findOne({
              server: host2,
              type: "partition.start",
            }))?.payload,
            { name },
          );

          // A canceled one too, and the target's copy goes; a late result changes nothing.
          await rentals.move(rental, host, platform.user);
          const stuck = await opened(host, "partition.receive");
          await rentals.cancelMove(rental);
          assertEquals((await sub()).rental!.lastMove!.error, "Canceled");
          await rentals.moveFinished(stuck._id, { ok: true });
          assert((await sub()).rental!.host!.equals(host2));

          // And back, for the steps that follow.
          await rentals.move(rental, host, platform.user);
          await rentals.moveFinished(
            (await opened(host, "partition.receive"))._id,
            { ok: true },
          );
          assert((await sub()).rental!.host!.equals(host));

          // Downtime counts against the period's uptime.
          const now = new Date();
          await serverLeaseModel.updateOne({ _id: server }, {
            $set: { aliveUntil: new Date(now.getTime() + 365 * DAY) },
          });
          // A day into the period (an outage before it counted in the last one).
          await subscriptionPeriodModel.updateOne(
            { subscription: rental, periodEnd: { $gt: now } },
            { $set: { periodStart: new Date(now.getTime() - DAY) } },
          );
          await rentals.recordDowntime(
            server,
            new Date(now.getTime() - 60_000),
            now,
          );
          const period = await subscriptionPeriodModel.findOne({
            subscription: rental,
            periodEnd: { $gt: now },
          });
          assertEquals(period!.usage!.downtimeMs, 60_000);
          // A minute down in a day: 99.93 %; its lease is current again.
          await serverLeaseModel.updateOne({ _id: server }, {
            $set: { aliveUntil: new Date(now.getTime() + 60_000) },
          });
          await subscriptionPeriodModel.updateOne({ _id: period!._id }, {
            $set: { periodStart: new Date(now.getTime() - DAY) },
          });
          const uptime = (await rentals.uptimes([await sub()])).get(
            String(rental),
          )!;
          assertEquals(Math.round(uptime * 100) / 100, 99.93);
        },
      );

      await t.step(
        "an admin suspends and resumes it; it isn't renewed meanwhile",
        async () => {
          const stops = (await commands("partition.stop")).length;
          const starts = (await commands("partition.start")).length;
          assertEquals(
            (await customer.call(
              "POST",
              `/rentalsAdmin/api/${rental}/suspend`,
              {},
            ))
              .status,
            403,
            "admins only",
          );
          await rentals.hold(rental, platform.user, "Abuse report");
          const held = await sub();
          assertEquals([held.status, held.rental!.held?.status], [
            "suspended",
            "active",
          ]);
          assertEquals((await commands("partition.stop")).length, stops + 1);
          await mailed(/stopped by Huruf/);
          // Its period ends meanwhile: not charged, still held.
          const before = await balance();
          await endPeriod();
          await billing.renewIfDue(tenant);
          assertEquals([(await sub()).status, await balance()], [
            "suspended",
            before,
          ]);
          const list = await customer.call("GET", "/rentals/api/");
          assertEquals(
            list.json.find((r: { _id: string }) => r._id === String(rental))
              .held,
            true,
          );
          await rentals.resume(rental);
          assertEquals((await sub()).status, "active");
          assertEquals((await sub()).rental!.held, undefined);
          assertEquals((await commands("partition.start")).length, starts + 1);
          // The ended period renews now.
          await fund(10_000);
          const funded = await balance();
          await billing.renewIfDue(tenant);
          assert(await balance() < funded);
          assert((await sub()).currentPeriodEnd! > new Date());
        },
      );

      await t.step(
        "unpaid: past due, suspended after 3 days, paid and resumed",
        async () => {
          const stops = (await commands("partition.stop")).length;
          const starts = (await commands("partition.start")).length;
          // Empty the wallet; there's no billing account, so no card is charged.
          const empty = await balance();
          if (await balance() > 0) {
            await Wallet.transfer({
              fromTenant: tenant,
              toTenant: platform.tenantId,
              amount: empty,
              currency: "usd",
              description: "test drain",
              idempotencyKey: crypto.randomUUID(),
            });
          }
          await endPeriod();
          await billing.renewIfDue(tenant);
          assertEquals((await sub()).status, "pastDue");
          // Three days later the partition is stopped.
          await subscriptionModel.updateOne({ _id: rental }, {
            $set: { pastDueSince: new Date(Date.now() - 3.1 * DAY) },
            $unset: { nextRenewalAttemptAt: "" },
          });
          await billing.renewIfDue(tenant);
          assertEquals((await sub()).status, "suspended");
          assertEquals((await commands("partition.stop")).length, stops + 1);
          await mailed(/stopped/);
          // Paying resumes it.
          await fund(10_000);
          await subscriptionModel.updateOne({ _id: rental }, {
            $unset: { nextRenewalAttemptAt: "" },
          });
          await billing.renewIfDue(tenant);
          assertEquals((await sub()).status, "active");
          assertEquals((await commands("partition.start")).length, starts + 1);
        },
      );

      await t.step(
        "suspended past the retention: warned, then released",
        async () => {
          const drain = await balance();
          if (await balance() > 0) {
            await Wallet.transfer({
              fromTenant: tenant,
              toTenant: platform.tenantId,
              amount: drain,
              currency: "usd",
              description: "test drain",
              idempotencyKey: crypto.randomUUID(),
            });
          }
          await endPeriod();
          await billing.renewIfDue(tenant);
          await subscriptionModel.updateOne({ _id: rental }, {
            $set: { pastDueSince: new Date(Date.now() - 4 * DAY) },
            $unset: { nextRenewalAttemptAt: "" },
          });
          await billing.renewIfDue(tenant);
          assertEquals((await sub()).status, "suspended");
          // 8 days suspended: the 7-day warning.
          await subscriptionModel.updateOne({ _id: rental }, {
            $set: { "rental.suspendedAt": new Date(Date.now() - 8 * DAY) },
            $unset: { nextRenewalAttemptAt: "" },
          });
          await billing.renewIfDue(tenant);
          await mailed(/deleted in \d+ day/);
          assertEquals((await sub()).rental!.warned, [7]);
          // 14 days: released.
          const server = (await sub()).server!;
          const removes = (await commands("partition.remove")).length;
          await subscriptionModel.updateOne({ _id: rental }, {
            $set: { "rental.suspendedAt": new Date(Date.now() - 14.1 * DAY) },
            $unset: { nextRenewalAttemptAt: "" },
          });
          await billing.renewIfDue(tenant);
          assertEquals((await sub()).status, "released");
          assertEquals(
            (await commands("partition.remove")).length,
            removes + 1,
          );
          assertEquals(await serverModel.countDocuments({ _id: server }), 0);
          assertEquals(
            await mongodb.db().collection("projects").countDocuments({
              _id: new ObjectId(onRental),
            }),
            0,
            "its projects went with it",
          );
          await mailed(/was deleted/);
        },
      );

      await t.step("a request can be withdrawn or rejected", async () => {
        await fund(10_000);
        const ask = async (body: object = {}) => {
          const res = await customer.call("POST", "/rentals/api/request", {
            machine: host,
            ...small,
            ...body,
          });
          assertEquals(res.status, 200, JSON.stringify(res.json));
          return res.json.rental;
        };
        const a = await ask();
        assertEquals(
          (await customer.call("POST", `/rentals/api/${a}/withdraw`)).status,
          200,
        );
        assertEquals(
          (await subscriptionModel.findOne({ _id: new ObjectId(a) }))!.status,
          "canceled",
        );
        const b = await ask({ vcpu: 0.5, memMb: 1024, diskGb: 10 });
        const declined = await platform.call(
          "POST",
          `/hosting/api/${b}/decline`,
          { reason: "No capacity in that class this week" },
        );
        assertEquals(declined.status, 200, JSON.stringify(declined.json));
        const rejected =
          (await subscriptionModel.findOne({ _id: new ObjectId(b) }))!;
        assertEquals([rejected.status, rejected.rental!.rejectedReason], [
          "rejected",
          "No capacity in that class this week",
        ]);
        assertEquals(
          (await refused(() => rentals.approve(new ObjectId(b), platform.user)))
            ?.status,
          404,
          "nothing left to approve",
        );
        // Accepted twice at once: charged and created once.
        const c = await ask();
        const creates = (await commands("partition.create")).length;
        const charged = await balance();
        const approvals = await Promise.allSettled([
          rentals.approve(new ObjectId(c), platform.user),
          rentals.approve(new ObjectId(c), platform.user),
        ]);
        assertEquals(
          approvals.filter((a) => a.status === "fulfilled").length,
          1,
        );
        assertEquals((await commands("partition.create")).length, creates + 1);
        assertEquals(await balance(), charged - SMALL);
        // An admin deletes an approved rental now.
        const removes = (await commands("partition.remove")).length;
        await rentals.terminate(new ObjectId(c), "Terms violation");
        assertEquals(
          (await subscriptionModel.findOne({ _id: new ObjectId(c) }))!.status,
          "canceled",
        );
        assertEquals((await commands("partition.remove")).length, removes + 1);
        await mailed(/deleted by Huruf/);

        // A rental whose partition failed: listed with why, created again,
        // or refunded in full.
        const e = new ObjectId(await ask());
        await rentals.approve(e, platform.user);
        const failed = (await commands("partition.create")).at(-1)!;
        await agentCommandModel.updateOne({ _id: failed._id }, {
          $set: { status: "failed", error: "No space left on device" },
        });
        const stuck = (await rentals.waiting()).find((w) =>
          w.sub._id.equals(e)
        );
        assertEquals(stuck?.error, "No space left on device");
        const before = (await commands("partition.create")).length;
        await rentals.recreate(e, platform.user);
        assertEquals((await commands("partition.create")).length, before + 1);
        assertEquals(
          (await rentals.waiting()).find((w) => w.sub._id.equals(e))?.error,
          undefined,
          "being set up again",
        );
        const paid = await balance();
        assertEquals((await rentals.refund(e, platform.user)).amount, SMALL);
        assertEquals(await balance(), paid + SMALL);
        assertEquals(
          (await subscriptionModel.findOne({ _id: e }))!.status,
          "canceled",
        );
        assertEquals(
          (await refused(() => rentals.refund(e, platform.user)))?.status,
          404,
          "refunded once",
        );
        assertEquals(await balance(), paid + SMALL);
        await mailed(/was refunded/);

        // Not accepted in 72 hours: declined, nothing charged.
        const f = new ObjectId(await ask());
        await subscriptionModel.updateOne({ _id: f }, {
          $set: { startedAt: new Date(Date.now() - 73 * 3_600_000) },
        });
        await rentals.queue(platform.tenantId);
        const expired = (await subscriptionModel.findOne({ _id: f }))!;
        assertEquals([expired.status, expired.rental!.rejectedReason], [
          "rejected",
          "Not accepted in time",
        ]);

        // Auto-accept: running at once.
        await serverModel.updateOne({ _id: host }, {
          $set: { "pool.rent.autoAccept": true },
        });
        const auto = await customer.call("POST", "/rentals/api/request", {
          machine: host,
          ...small,
        });
        assertEquals(auto.json.result, "active", JSON.stringify(auto.json));
        await serverModel.updateOne({ _id: host }, {
          $set: { "pool.rent.autoAccept": false },
        });
        const g = new ObjectId(auto.json.rental);

        // The owner stops renting it out: it ends with its term and month.
        const ended = await platform.call("POST", `/hosting/api/${g}/end`);
        assertEquals(ended.status, 200, JSON.stringify(ended.json));
        await subscriptionModel.updateOne({ _id: g }, {
          $set: {
            currentPeriodEnd: new Date(Date.now() - 1_000),
            "rental.endAt": new Date(Date.now() - 2_000),
          },
        });
        await subscriptionPeriodModel.updateMany({ subscription: g }, {
          $set: { periodEnd: new Date(Date.now() - 1_000) },
        });
        const kept = await balance();
        await billing.renewIfDue(tenant);
        assertEquals(
          (await subscriptionModel.findOne({ _id: g }))!.status,
          "canceled",
        );
        assert(await balance() >= kept, "not charged again");

        // Its machine down for over 72 hours: it left, the rental ends
        // without another charge.
        const h = new ObjectId(await ask());
        await rentals.approve(h, platform.user);
        const lostServer = new ObjectId();
        await subscriptionModel.updateOne({ _id: h }, {
          $set: {
            server: lostServer,
            currentPeriodEnd: new Date(Date.now() - 1_000),
          },
        });
        await subscriptionPeriodModel.updateMany({ subscription: h }, {
          $set: {
            periodStart: new Date(Date.now() - 30 * DAY),
            periodEnd: new Date(Date.now() - 1_000),
          },
        });
        await serverLeaseModel.insertOne({
          _id: lostServer,
          tenant,
          status: "active",
          aliveUntil: new Date(Date.now() - 4 * DAY),
          offline: true,
          shard: 0,
          desiredVersion: 0,
          commandSeq: 0,
          deliveredSeq: 0,
        });
        const beforeLost = await balance();
        await billing.renewIfDue(tenant);
        const lost = (await subscriptionModel.findOne({ _id: h }))!;
        assertEquals(lost.status, "canceled");
        assert(lost.rental!.lostAt);
        assert(await balance() > beforeLost, "its downtime came back");
        await mailed(/machine is gone/);
      });
    } finally {
      config.PLATFORM_TENANT = previous;
      Mailer.onSendMail = undefined;
      const tenants = [platform.tenantId, tenant];
      await Promise.all([
        planModel.deleteMany({ allowedTenants: tenant }),
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
        ]
          .map((c) => d.collection(c).deleteMany({ tenant: { $in: tenants } })),
      ]);
      await Promise.all([platform.cleanup(), customer.cleanup()]);
    }
  },
});
