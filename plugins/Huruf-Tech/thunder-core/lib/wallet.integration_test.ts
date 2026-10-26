/**
 * Integration tests for the wallet top-up state machine.
 *
 * These hit a real MongoDB because that is where the behaviour lives: atomic
 * claims, unique indexes and transactions. Mocking them would test the mocks.
 *
 * Running them:
 *
 * ```bash
 * docker run -d --name thunder-wallet-test-mongo -p 27018:27017 \
 *   mongo:7 --replSet rs0 --bind_ip_all
 * docker exec thunder-wallet-test-mongo mongosh --quiet --eval 'rs.initiate()'
 *
 * echo 'DATABASE_URL=mongodb://127.0.0.1:27018/thunder_wallet_test?replicaSet=rs0&directConnection=true' > .env.test
 * deno task test:integration
 * ```
 *
 * A replica set is required: the wallet writes its ledger pairs in
 * transactions. `.env.test` is gitignored.
 *
 * They SKIP unless `ENV_TYPE=test` and the resolved `DATABASE_URL` points at
 * localhost. That guard is deliberate — these tests delete collections, and
 * the project's `.env` points at a shared cluster.
 */
import assert from "node:assert/strict";
import { ObjectId } from "mongodb";
import { Env } from "@/core/utils/env.ts";

const databaseUrl = Env.getSync("DATABASE_URL", true) ?? "";
const isLocal = /(127\.0\.0\.1|localhost)/.test(databaseUrl);
const enabled = Env.getType() === "test" && isLocal;

if (!enabled) {
  console.warn(
    `%cwallet integration tests skipped%c - need ENV_TYPE=test and a localhost DATABASE_URL (see this file's header).`,
    "color: yellow",
    "",
  );
}

/**
 * Imported lazily: the models bind to `mongodb.db()` at import time, so this
 * must not run until we know we are pointed at a throwaway database.
 */
const load = async () => {
  // Patches ZodType.prototype.strictParse, which the schemas rely on.
  await import("@/core/bootstrap.ts");

  const [lib, wallet, topup, ledger, tenant, db] = await Promise.all([
    import("@/lib/wallet.ts"),
    import("@/schemas/wallet.ts"),
    import("@/schemas/walletTopup.ts"),
    import("@/schemas/walletLedger.ts"),
    import("@/schemas/tenant.ts"),
    import("@/database.ts"),
  ]);

  return { ...lib, ...wallet, ...topup, ...ledger, ...tenant, ...db };
};

type Loaded = Awaited<ReturnType<typeof load>>;

let mod: Loaded;

const CURRENCY = "usd";

/** A tenant with a wallet, so transfers have somewhere to go. */
const makeTenant = async (balance = 0) => {
  const user = new ObjectId();

  const { insertedId: tenant } = await mod.tenantModel.insertOne({
    name: `t-${crypto.randomUUID()}`,
    createdBy: user,
    createdAt: new Date(),
  });

  await mod.walletModel.insertOne(mod.walletSchema.strictParse({
    currency: CURRENCY,
    tenant,
    user,
    balance,
  }));

  return tenant;
};

const balanceOf = async (tenant: ObjectId) =>
  (await mod.walletModel.findOne({ tenant, currency: CURRENCY }))?.balance ?? 0;

const reset = async () => {
  await Promise.all([
    mod.walletTopupModel.deleteMany({}),
    mod.walletLedgerModel.deleteMany({}),
    mod.walletModel.deleteMany({}),
    mod.tenantModel.deleteMany({}),
  ]);

  mod.Wallet.onInsufficientBalance = undefined;
};

/**
 * Points top-up funding at a tenant, or makes it fail the way an unset
 * `WALLET_TOPUP_TENANT` does.
 *
 * `Env` snapshots the process environment once and lets `.env` win over it,
 * so the variable cannot be changed per test. The resolver is the seam.
 */
const setFunding = (funding: ObjectId | null) => {
  mod.Wallet.resolveTopupTenant = funding
    ? () => Promise.resolve(funding)
    : () =>
      Promise.reject(
        new Error(
          "Set WALLET_TOPUP_TENANT to the tenant id that funds wallet top-ups!",
        ),
      );
};

/** Wraps a test with setup/teardown and the fallback reset. */
const test = (name: string, fn: () => Promise<void>) =>
  Deno.test({
    name,
    ignore: !enabled,
    sanitizeOps: false,
    sanitizeResources: false,
    async fn() {
      mod ??= await load();

      await reset();

      // The funding tenant has to exist before anything can settle.
      setFunding(await makeTenant());

      try {
        await fn();
      } finally {
        mod.Wallet.onInsufficientBalance = undefined;
        mod.Wallet.onCalculateFee = undefined;
      }
    },
  });

test("a short transfer is covered by the gateway and then completes", async () => {
  const payer = await makeTenant(100);
  const payee = await makeTenant();

  let charged = 0;

  mod.Wallet.onInsufficientBalance = ({ shortfall }) => {
    charged = shortfall;

    return {
      status: "completed",
      provider: "test",
      providerRef: `pi_${charged}`,
    };
  };

  const result = await mod.Wallet.transfer({
    fromTenant: payer,
    toTenant: payee,
    currency: CURRENCY,
    amount: 500,
  });

  assert.equal(charged, 400, "should charge only the shortfall");
  assert.ok(result.reference);

  assert.equal(await balanceOf(payer), 0, "100 + 400 topped up - 500 spent");
  assert.equal(await balanceOf(payee), 500);

  const topup = await mod.walletTopupModel.findOne({});
  assert.equal(topup?.status, mod.TopupStatus.Completed);
  assert.ok(topup?.resumedReference, "the parked transfer was replayed");
});

test("the top-up row exists before the gateway is called", async () => {
  const payer = await makeTenant(0);
  const payee = await makeTenant();

  let seen: string | undefined;

  mod.Wallet.onInsufficientBalance = async ({ topup }) => {
    // Whatever the gateway does next, this row is already on disk - that is
    // what lets a webhook settle a charge we never got to record.
    const row = await mod.walletTopupModel.findOne({ _id: topup });

    seen = row?.status;

    return { status: "completed", providerRef: "pi_recorded" };
  };

  await mod.Wallet.transfer({
    fromTenant: payer,
    toTenant: payee,
    currency: CURRENCY,
    amount: 250,
  });

  assert.equal(
    seen,
    mod.TopupStatus.Initiated,
    "the row must be readable from inside the hook, in `initiated`",
  );
});

test("a webhook that settles while the hook is still running is not rolled back", async () => {
  const payer = await makeTenant(0);
  const payee = await makeTenant();

  // The exact race from the review: a fast gateway settles the `initiated`
  // row by id before the hook returns. The hook's own status write must not
  // drag `completed` back to `paid`.
  mod.Wallet.onInsufficientBalance = async ({ topup }) => {
    await mod.Wallet.settleTopup({ topup, status: "completed" });

    return { status: "completed", providerRef: "pi_race" };
  };

  const result = await mod.Wallet.transfer({
    fromTenant: payer,
    toTenant: payee,
    currency: CURRENCY,
    amount: 300,
  });

  const topup = await mod.walletTopupModel.findOne({});

  assert.equal(topup?.status, mod.TopupStatus.Completed, "must stay completed");
  assert.equal(await balanceOf(payer), 0, "credited 300, spent 300");
  assert.equal(await balanceOf(payee), 300);
  assert.ok(result.reference);

  // Exactly one credit reached the ledger for the top-up.
  const credits = await mod.walletLedgerModel.countDocuments({
    purpose: "wallet_topup",
    type: mod.TransactionType.Credit,
  });

  assert.equal(credits, 1, "the wallet must not be credited twice");
});

test("a duplicate webhook does not credit twice", async () => {
  const tenant = await makeTenant(0);

  mod.Wallet.onInsufficientBalance = () => ({
    status: "pending",
    providerRef: "pi_dup",
  });

  await assert.rejects(
    () => mod.Wallet.addBalance({ tenant, currency: CURRENCY, amount: 1000 }),
    (error: Error) => error.name === "TopupPendingError",
  );

  const first = await mod.Wallet.settleTopup({
    providerRef: "pi_dup",
    status: "completed",
  });
  const second = await mod.Wallet.settleTopup({
    providerRef: "pi_dup",
    status: "completed",
  });

  assert.equal(first.topup.status, mod.TopupStatus.Completed);
  assert.equal(second.topup.status, mod.TopupStatus.Completed);
  assert.equal(await balanceOf(tenant), 1000, "credited once, not twice");
});

test("a credit that fails leaves the row recoverable, not failed", async () => {
  const tenant = await makeTenant(0);

  mod.Wallet.onInsufficientBalance = () => ({
    status: "completed",
    providerRef: "pi_broken",
  });

  // The documented cause: no funding tenant configured.
  setFunding(null);

  await assert.rejects(() =>
    mod.Wallet.addBalance({ tenant, currency: CURRENCY, amount: 700 })
  );

  const parked = await mod.walletTopupModel.findOne({});

  assert.equal(parked?.status, mod.TopupStatus.Paid, "must not be `failed`");
  assert.ok(parked?.error, "the reason is recorded");
  assert.equal(await balanceOf(tenant), 0);

  // Fix the cause and re-run: the customer's money arrives.
  setFunding(await makeTenant());

  const settled = await mod.Wallet.settleTopup({
    providerRef: "pi_broken",
    status: "completed",
  });

  assert.equal(settled.topup.status, mod.TopupStatus.Completed);
  assert.equal(await balanceOf(tenant), 700);
});

test("an idempotency key reuses one charge instead of opening two", async () => {
  const tenant = await makeTenant(0);

  let charges = 0;

  mod.Wallet.onInsufficientBalance = () => {
    charges += 1;

    return { status: "pending", providerRef: `pi_key_${charges}` };
  };

  const call = () =>
    mod.Wallet.addBalance({
      tenant,
      currency: CURRENCY,
      amount: 900,
      idempotencyKey: "renew:sub_1:2026-01",
    });

  await assert.rejects(
    call,
    (error: Error) => error.name === "TopupPendingError",
  );
  await assert.rejects(
    call,
    (error: Error) => error.name === "TopupPendingError",
  );

  assert.equal(charges, 1, "the gateway must be hit once");
  assert.equal(await mod.walletTopupModel.countDocuments({}), 1);
});

test("a dead `processing` claim can be taken over once it is stale", async () => {
  const tenant = await makeTenant(0);

  mod.Wallet.onInsufficientBalance = () => ({
    status: "pending",
    providerRef: "pi_stale",
  });

  await assert.rejects(
    () => mod.Wallet.addBalance({ tenant, currency: CURRENCY, amount: 400 }),
    (error: Error) => error.name === "TopupPendingError",
  );

  // Simulate a process that claimed the row and never came back.
  await mod.walletTopupModel.updateOne({ providerRef: "pi_stale" }, {
    $set: {
      status: mod.TopupStatus.Processing,
      updatedAt: new Date(Date.now() - mod.TOPUP_CLAIM_TIMEOUT_MS - 1000),
    },
  });

  const recovered = await mod.Wallet.settleTopup({
    providerRef: "pi_stale",
    status: "completed",
  });

  assert.equal(recovered.topup.status, mod.TopupStatus.Completed);
  assert.equal(await balanceOf(tenant), 400);
});

test("a fresh `processing` claim is left alone", async () => {
  const tenant = await makeTenant(0);

  mod.Wallet.onInsufficientBalance = () => ({
    status: "pending",
    providerRef: "pi_fresh",
  });

  await assert.rejects(
    () => mod.Wallet.addBalance({ tenant, currency: CURRENCY, amount: 400 }),
    (error: Error) => error.name === "TopupPendingError",
  );

  await mod.walletTopupModel.updateOne({ providerRef: "pi_fresh" }, {
    $set: { status: mod.TopupStatus.Processing, updatedAt: new Date() },
  });

  const blocked = await mod.Wallet.settleTopup({
    providerRef: "pi_fresh",
    status: "completed",
  });

  assert.equal(blocked.topup.status, mod.TopupStatus.Processing);
  assert.equal(await balanceOf(tenant), 0, "another attempt still holds it");
});

test("replaying a transfer returns the original instead of throwing", async () => {
  const payer = await makeTenant(1000);
  const payee = await makeTenant();

  const opts = {
    fromTenant: payer,
    toTenant: payee,
    currency: CURRENCY,
    amount: 250,
    idempotencyKey: "invoice_7",
  };

  const first = await mod.Wallet.transfer(opts);
  const second = await mod.Wallet.transfer(opts);

  assert.deepEqual(second, first, "the same ledger pair comes back");
  assert.equal(await balanceOf(payer), 750, "debited once");
  assert.equal(await balanceOf(payee), 250);
});

test("abandoning a top-up frees its key for a new charge", async () => {
  const tenant = await makeTenant(0);

  let charges = 0;

  mod.Wallet.onInsufficientBalance = () => {
    charges += 1;

    return charges === 1
      ? { status: "failed" }
      : { status: "completed", providerRef: "pi_second" };
  };

  const key = "renew:sub_2:2026-01";

  await assert.rejects(() =>
    mod.Wallet.addBalance({
      tenant,
      currency: CURRENCY,
      amount: 600,
      idempotencyKey: key,
    })
  );

  const failed = await mod.walletTopupModel.findOne({ idempotencyKey: key });
  assert.equal(failed?.status, mod.TopupStatus.Failed);

  // Without abandoning, the key keeps returning the stored failure.
  await assert.rejects(() =>
    mod.Wallet.addBalance({
      tenant,
      currency: CURRENCY,
      amount: 600,
      idempotencyKey: key,
    })
  );
  assert.equal(charges, 1, "the gateway was not hit again");

  await mod.Wallet.abandonTopup({ topup: failed!._id, reason: "card fixed" });

  await mod.Wallet.addBalance({
    tenant,
    currency: CURRENCY,
    amount: 600,
    idempotencyKey: key,
  });

  assert.equal(charges, 2, "the freed key opened a new charge");
  assert.equal(await balanceOf(tenant), 600);
});
