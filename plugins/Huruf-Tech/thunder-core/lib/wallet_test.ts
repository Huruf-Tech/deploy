import assert from "node:assert/strict";
import { assertCents, InsufficientBalanceError } from "./wallet.ts";
import {
  SETTLEABLE_TOPUP_STATUSES,
  TopupStatus,
} from "@/schemas/walletTopup.ts";

// The shortfall is what the fallback charges the customer's card, so the
// arithmetic matters more than most.
Deno.test("shortfall is what the wallet is missing", () => {
  const error = new InsufficientBalanceError("Insufficient balance!", 500, 100);

  assert.equal(error.shortfall, 400);
});

Deno.test("overdraft room counts as available", () => {
  // balance 100 + overdraftLimit 300 => 400 spendable against a 500 charge.
  const error = new InsufficientBalanceError(
    "Your balance is too low!",
    500,
    400,
  );

  assert.equal(error.shortfall, 100);
});

Deno.test("an already-overdrawn wallet needs its deficit covered too", () => {
  // balance -50, overdraftLimit 100 => 50 spendable against a 200 charge.
  const error = new InsufficientBalanceError(
    "Your balance is too low!",
    200,
    50,
  );

  assert.equal(error.shortfall, 150);
});

// assertCents is the one place the integer-cents rule is defined, so every
// money entry point in the class inherits whatever this does.
Deno.test("assertCents accepts whole cents", () => {
  assert.equal(assertCents(500, "Amount"), 500);
  assert.equal(assertCents(1, "Amount"), 1);
});

Deno.test("assertCents rejects decimal currency units", () => {
  // The classic mistake: passing 5.00 dollars where 500 cents is meant.
  assert.throws(() => assertCents(5.5, "Amount"), /whole number of cents/);
  assert.throws(
    () => assertCents(0.1 + 0.2, "Amount"),
    /whole number of cents/,
  );
});

Deno.test("assertCents rejects non-finite values", () => {
  assert.throws(() => assertCents(NaN, "Amount"), /must be a number of cents/);
  assert.throws(
    () => assertCents(Infinity, "Amount"),
    /must be a number of cents/,
  );
});

Deno.test("assertCents enforces the floor", () => {
  // Default floor is 1: a zero-value transfer is not a transfer.
  assert.throws(() => assertCents(0, "Amount"), /greater than zero/);

  // A floor of 0 is for limits, where zero is meaningful but negative is not.
  assert.equal(assertCents(0, "Overdraft limit", 0), 0);
  assert.throws(
    () => assertCents(-1, "Overdraft limit", 0),
    /cannot be negative/,
  );
});

// A top-up only reaches `paid` once the customer's money is in. If `paid`
// ever stops being claimable, a credit that failed can never be retried and
// the money strands — so pin the list down.
Deno.test("every state holding unspent customer money is settleable", () => {
  for (const status of [TopupStatus.Initiated, TopupStatus.Paid]) {
    assert.ok(
      SETTLEABLE_TOPUP_STATUSES.includes(status),
      `${status} must stay claimable or paid-for top-ups cannot be recovered`,
    );
  }

  assert.ok(SETTLEABLE_TOPUP_STATUSES.includes(TopupStatus.Pending));
});

Deno.test("settled and in-flight states are not re-claimable", () => {
  // Completed would double-credit; Failed never took money; Processing is
  // another attempt's claim.
  for (
    const status of [
      TopupStatus.Completed,
      TopupStatus.Failed,
      TopupStatus.Processing,
    ]
  ) {
    assert.equal(SETTLEABLE_TOPUP_STATUSES.includes(status), false, status);
  }
});
