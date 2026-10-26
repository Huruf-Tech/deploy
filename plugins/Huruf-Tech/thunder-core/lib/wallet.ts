import z from "zod";
import { walletModel, walletSchema } from "@/schemas/wallet.ts";
import { ClientSession, ObjectId, WithId } from "mongodb";
import { tenantModel } from "@/schemas/tenant.ts";
import { References } from "@/lib/references.ts";
import { mongodb } from "@/database.ts";
import {
  TransactionType,
  walletLedgerModel,
  walletLedgerSchema,
} from "@/schemas/walletLedger.ts";
import { hash } from "ohash";
import { Env } from "@/core/utils/env.ts";
import {
  SETTLEABLE_TOPUP_STATUSES,
  TOPUP_CLAIM_TIMEOUT_MS,
  TopupStatus,
  walletTopupModel,
  walletTopupSchema,
  walletTopupTransferSchema,
} from "@/schemas/walletTopup.ts";
import { isDuplicateKeyError } from "@/database.ts";

export interface IWalletTransferOptions {
  /**
   * An idempotency key makes sure that the same transaction doesn't repeat!
   */
  idempotencyKey?: string;

  /**
   * Custom transaction reference
   */
  reference?: string;

  /**
   * You can optionally pass a foreignRefType and a foreignRef to reference an external object that is linked to this transaction.
   */
  foreignRefType?: string;

  /**
   * You can optionally pass a foreignRefType and a foreignRef to reference an external object that is linked to this transaction.
   */
  foreignRef?: string;

  /**
   * Executer's userId
   */
  user?: ObjectId;

  fromTenant: ObjectId;
  toTenant: ObjectId;
  currency: string;
  amount: number;

  /**
   * Purpose of transaction
   */
  purpose?: string;

  /**
   * Description of the transfer
   */
  description?: string | Record<string, string>;

  /**
   * Check if the wallet exists than make a transaction else throw an error
   */
  checkWalletExist?: boolean;

  /**
   * A negative transaction will be performed in case of insufficient balance
   */
  allowOverdraft?: boolean;

  /**
   * How much negative transaction is allowed?
   */
  overdraftLimit?: number;

  /**
   * Is this transfer a refund?
   */
  isRefund?: boolean;

  /**
   * Tags for the transaction
   * @default []
   */
  tags?: string[];

  /**
   * If this transfer is a refund for an old transfer,
   * this is the original transfer reference.
   */
  refundedReference?: string;

  /**
   * Pass any metadata to the transaction
   */
  metadata?: Record<string, string | number | boolean>;

  /**
   * Deduplicates the *top-up* this transfer may trigger (not the transfer
   * itself — that is `idempotencyKey`). Two attempts carrying the same key
   * reuse one gateway charge instead of opening two.
   *
   * Defaults to a key derived from `idempotencyKey`, so retries of the same
   * logical transfer already share a top-up.
   */
  topupIdempotencyKey?: string;

  /**
   * Pass a database transaction session
   */
  databaseSession?: ClientSession;
}

export type IWalletRefundOptions =
  & Pick<
    IWalletTransferOptions,
    | "idempotencyKey"
    | "foreignRefType"
    | "foreignRef"
    | "reference"
    | "user"
    | "description"
    | "allowOverdraft"
    | "overdraftLimit"
    | "metadata"
    | "databaseSession"
  >
  & {
    refToRefund: string;
  };

export type TWalletFeeOptions = {
  fromTenant: ObjectId;
  toTenant: ObjectId;
  currency?: string;
  amount: number;
};

export type TWalletFeeBreakdown = {
  tenant: ObjectId;
  name: string;
  amount: number;
};

export type TWalletFeeStructure = {
  breakdown: Array<TWalletFeeBreakdown>;
  total: number;
};

/**
 * `reference` and `idempotencyKey` are resolved once per logical transfer so
 * that a retry (or a resume from a webhook) reuses them instead of minting new
 * ones — that is what keeps the retry from double-charging.
 */
type TResolvedTransferOptions = IWalletTransferOptions & {
  reference: string;
  idempotencyKey: string;
};

/** Thrown when the payer's wallet cannot cover a transfer. */
export class InsufficientBalanceError extends Error {
  override readonly name = "InsufficientBalanceError";

  constructor(
    message: string,
    /** Cents the transfer needs. */
    readonly required: number,
    /** Cents spendable right now (balance plus any overdraft room). */
    readonly available: number,
  ) {
    super(message);
  }

  /** Cents that must be added before the transfer can succeed. */
  get shortfall() {
    return this.required - this.available;
  }
}

/**
 * Thrown when `onInsufficientBalance` handed the charge to a gateway that will
 * confirm later. The transfer has NOT happened; it resumes when the webhook
 * calls {@link Wallet.settleTopup}.
 */
export class TopupPendingError extends Error {
  override readonly name = "TopupPendingError";

  constructor(
    readonly topup: ObjectId,
    message =
      "A top-up is pending; the transfer will resume once the payment is confirmed.",
  ) {
    super(message);
  }
}

/** What the low-balance fallback is told about the shortfall. */
export type TWalletTopupRequest = {
  /**
   * The top-up row, written *before* this hook runs. Hand it to your gateway
   * as the idempotency key (Stripe's `idempotencyKey`) or in its metadata:
   * it makes the charge safe to retry, and it lets a webhook find this row
   * even if it arrives before the gateway's own reference is stored.
   */
  topup: ObjectId;
  /**
   * The transfer that could not be completed, as passed to `transfer()`.
   * Absent when the shortfall came from `ensureBalance()`, where no transfer
   * exists yet.
   */
  transfer?: IWalletTransferOptions;
  /** The payer's wallet. */
  wallet: WithId<z.infer<typeof walletSchema>>;
  currency: string;
  /** Cents that are needed. */
  required: number;
  /** Cents spendable right now (balance plus any overdraft room). */
  available: number;
  /** Cents that must be added to cover it. */
  shortfall: number;
};

export type TWalletTopupResult = {
  /**
   * - `completed` — funds are secured now; the wallet is credited and the
   *   transfer is retried before `transfer()` returns.
   * - `pending` — the gateway confirms out of band; the transfer is parked and
   *   `TopupPendingError` is thrown. Settle it from your webhook.
   * - `failed` — give up; the original `InsufficientBalanceError` is rethrown.
   */
  status: "completed" | "pending" | "failed";
  /** Cents to credit. Defaults to the shortfall. */
  amount?: number;
  /** Gateway name, for your own bookkeeping, e.g. "stripe". */
  provider?: string;
  /** The gateway's id for this charge — what the webhook will quote back. */
  providerRef?: string;
};

export type TWalletTransferResult = {
  reference: string;
  idempotencyKey: string;
  /** Ledger entry id of the debit leg. */
  debit: ObjectId;
  /** Ledger entry id of the credit leg. */
  credit: ObjectId;
};

export type TWalletEnsureBalanceResult = {
  /** The wallet, re-read after any top-up. */
  wallet: WithId<z.infer<typeof walletSchema>>;
  /** Cents spendable now (balance plus any overdraft room). */
  available: number;
  /** Cents the gateway was asked to cover; 0 when the balance already sufficed. */
  toppedUp: number;
  /** The settled top-up, when one was needed. */
  topup?: WithId<z.infer<typeof walletTopupSchema>>;
};

export type TWalletTopupSettlement = {
  /** Identify the top-up by its own id, or by the gateway's reference. */
  topup?: ObjectId;
  providerRef?: string;
  status: "completed" | "failed";
  /** Overrides the amount to credit (e.g. the gateway captured less). */
  amount?: number;
  error?: string;
};

/**
 * Every monetary value in this class is an **integer number of minor units**
 * (cents, paisa, fils) - never a decimal currency unit. `$5.00` is `500`.
 *
 * This is not a style preference. Floats cannot represent most decimal
 * fractions exactly, so `0.1 + 0.2 !== 0.3`, and the error compounds over a
 * ledger. Amounts also round-trip through JSON and BSON, which would quietly
 * turn a near-integer into a rounded one. Rejecting non-integers at every
 * entry point keeps the ledger exact by construction.
 *
 * @throws if `amount` is not a whole number, or is below `min`.
 */
export const assertCents = (amount: number, label: string, min = 1) => {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new Error(`${label} must be a number of cents, got ${amount}!`);
  }

  if (!Number.isInteger(amount)) {
    throw new Error(
      `${label} must be a whole number of cents (integer), got ${amount}! ` +
        `Amounts are in minor units - pass 500 for 5.00, not 5.`,
    );
  }

  if (amount < min) {
    throw new Error(
      min > 0
        ? `${label} must be greater than zero, got ${amount}!`
        : `${label} cannot be negative, got ${amount}!`,
    );
  }

  return amount;
};

/**
 * Drops null-valued keys from a stored document.
 *
 * MongoDB persists an `undefined` field as `null`, but Zod's `.optional()`
 * accepts `undefined` and rejects `null`. Anything we write and later feed
 * back into a schema — a parked transfer, a top-up's provider — has to come
 * back through here or it fails to parse.
 */
const withoutNulls = <T extends Record<string, unknown>>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== null),
  ) as T;

export class Wallet {
  static beforeTransferApproval?: (
    opts: {
      fromWallet: WithId<z.infer<typeof walletSchema>>;
      toWallet: WithId<z.infer<typeof walletSchema>>;
      transferOpts: IWalletTransferOptions;
      overdraftApplied: boolean;
      minimumAllowedBalance: number;
    },
  ) => Promise<boolean> | boolean;

  static onCalculateFee?: (
    opts: TWalletFeeOptions,
  ) => TWalletFeeStructure | Promise<TWalletFeeStructure>;

  static async resolve(details: {
    tenant: ObjectId;
    currency: string;
  }, opts?: {
    findOnly?: boolean;
    databaseSession?: ClientSession;
  }) {
    const exec = async (session: ClientSession) => {
      const wallet = await walletModel.findOne({
        currency: details.currency,
        tenant: details.tenant,
      }, { session });

      if (!wallet) {
        if (opts?.findOnly) throw new Error("Wallet not found!");

        const tenant = await tenantModel.findOne({
          _id: details.tenant,
        }, {
          projection: {
            createdBy: 1,
          },
          session,
        });

        if (!tenant) {
          throw new Error(
            "Cannot resolve a wallet for a tenant that doesn't exist!",
          );
        }

        const payload = walletSchema.strictParse({
          currency: details.currency,
          tenant: details.tenant,
          user: tenant.createdBy,
        });

        const { insertedId: _id } = await walletModel.insertOne(payload, {
          session,
        });

        return {
          _id,
          ...payload,
        };
      }

      return wallet;
    };

    if (opts?.databaseSession) {
      return await exec(opts.databaseSession);
    }

    return await mongodb.withSession((session) =>
      session.withTransaction(exec)
    );
  }

  static async calculateFee(
    options: TWalletFeeOptions,
  ): Promise<TWalletFeeStructure> {
    if (typeof this.onCalculateFee !== "function") {
      return {
        total: 0,
        breakdown: [],
      };
    }

    const fee = await this.onCalculateFee(options);

    // `onCalculateFee` is application code, and a percentage fee is exactly
    // where a fractional cent creeps in. Catch it here rather than letting a
    // rounded leg reach the ledger.
    assertCents(fee.total, "Fee total", 0);

    fee.breakdown.forEach((leg) =>
      assertCents(leg.amount, `Fee "${leg.name}"`, 0)
    );

    return fee;
  }

  /**
   * Optional fallback for a transfer the payer cannot afford.
   *
   * Set it once at boot (it is global to the process) and charge the customer
   * through your payment gateway inside it. Return `completed` once the funds
   * are secured, or `pending` when the gateway confirms via webhook. The wallet
   * is credited and the transfer retried for you - do not call `transfer()`
   * yourself from in here.
   *
   * Runs OUTSIDE any database transaction, so awaiting a network call is safe.
   * It is skipped entirely when the transfer was given a `databaseSession`:
   * we must not do slow I/O inside a caller's transaction, nor retry writes it
   * has already rolled back.
   */
  static onInsufficientBalance?: (
    request: TWalletTopupRequest,
  ) => TWalletTopupResult | void | Promise<TWalletTopupResult | void>;

  /**
   * Parses a gateway webhook into a settlement. Receives the untouched
   * `Request`, so the raw body is still available for signature verification.
   *
   * Return nothing to acknowledge an event you do not care about. Wired up by
   * `routes/walletTopups.ts`.
   */
  static onTopupWebhook?: (
    req: Request,
  ) => TWalletTopupSettlement | void | Promise<TWalletTopupSettlement | void>;

  /**
   * The tenant that funds top-ups - your gateway's settlement account. Its
   * wallet is the external-money source, so it is expected to run negative:
   * that balance is what customers have paid in through the gateway.
   */
  static async resolveTopupTenant() {
    const configured = await Env.get("WALLET_TOPUP_TENANT", true);

    if (!configured || !ObjectId.isValid(configured)) {
      throw new Error(
        "Set WALLET_TOPUP_TENANT to the tenant id that funds wallet top-ups!",
      );
    }

    return new ObjectId(configured);
  }

  static async transfer(
    opts: IWalletTransferOptions,
  ): Promise<TWalletTransferResult> {
    assertCents(opts.amount, "Transfer amount");

    if (opts.foreignRefType && !opts.foreignRef) {
      throw new Error(
        `Please provide foreign ref!`,
      );
    }

    if (opts.isRefund && !opts.refundedReference) {
      throw new Error(
        `Please provide the original transaction reference for the refund!`,
      );
    }

    if (opts.fromTenant.equals(opts.toTenant)) {
      throw new Error(`Cannot transfer to the same wallet!`);
    }

    const reference = opts.reference ??
      await References.inc("walletTransferRef", "TX");

    // A unique index on idempotencyKey, and wallet will prevent duplicate transactions
    const idempotencyKey = opts.idempotencyKey ?? hash({
      currency: opts.currency,
      amount: opts.amount,
      currentMinute: new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
        timeZone: "UTC",
      }).format(new Date()),
      from: opts.fromTenant.toString(),
      to: opts.toTenant.toString(),
      description: opts.description,
      foreignRefType: opts.foreignRefType,
      foreignRef: opts.foreignRef,
    });

    const resolved: TResolvedTransferOptions = {
      ...opts,
      reference,
      idempotencyKey,
      // Retries of the same logical transfer share one gateway charge.
      topupIdempotencyKey: opts.topupIdempotencyKey ??
        hash({ type: "topup-for", transfer: idempotencyKey }),
    };

    try {
      return await this.execute(resolved);
    } catch (error) {
      if (!(error instanceof InsufficientBalanceError)) throw error;

      // Never reach for a gateway from inside someone else's transaction: the
      // charge would outlive a rollback, and its failed writes are already gone.
      if (opts.databaseSession || !Wallet.onInsufficientBalance) throw error;

      const funded = await this.raiseFunds({
        tenant: opts.fromTenant,
        currency: opts.currency,
        amount: error.shortfall,
        required: error.required,
        available: error.available,
        idempotencyKey: resolved.topupIdempotencyKey,
        transfer: resolved,
      });

      // The fallback declined to cover it.
      if (!funded) throw error;

      // settleTopup replays the parked transfer itself. When it did not (we
      // reused a top-up that had already settled) the funds are there, so
      // run it now — its own idempotency key guards against a repeat.
      return funded.transfer ?? await this.execute(resolved);
    }
  }

  /**
   * The ledger pair a previous run of this idempotency key wrote, if any.
   *
   * Both legs are inserted in one transaction, so a half-written pair cannot
   * be observed; seeing only one means the pair is not committed yet.
   */
  protected static async findTransferByKey(
    idempotencyKey: string,
  ): Promise<TWalletTransferResult | null> {
    const entries = await walletLedgerModel.find({ idempotencyKey }).toArray();

    const debit = entries.find((entry) => entry.type === TransactionType.Debit);
    const credit = entries.find((entry) =>
      entry.type === TransactionType.Credit
    );

    if (!debit || !credit) return null;

    return {
      reference: debit.reference,
      idempotencyKey,
      debit: debit._id,
      credit: credit._id,
    };
  }

  /**
   * One attempt at the transfer. Re-reads both wallets every time, so a retry
   * after a top-up sees the new balance.
   *
   * Replaying a transfer that already ran returns the original result instead
   * of throwing on the ledger's unique index. That is what makes settling a
   * top-up safe to re-run, which recovery depends on.
   */
  protected static async execute(
    opts: TResolvedTransferOptions,
  ): Promise<TWalletTransferResult> {
    const { reference, idempotencyKey } = opts;

    const already = await this.findTransferByKey(idempotencyKey);

    if (already) return already;

    const walletA = await this.resolve({
      tenant: opts.fromTenant,
      currency: opts.currency,
    }, {
      findOnly: opts.checkWalletExist,
    });

    const walletB = await this.resolve({
      tenant: opts.toTenant,
      currency: opts.currency,
    }, {
      findOnly: opts.checkWalletExist,
    });

    const negativeAt = (
      wallet: Awaited<ReturnType<typeof this.resolve>>,
      postBalance: number,
    ) => {
      if (postBalance >= 0) return null;

      return wallet.negativeAt ?? new Date();
    };

    const makeTransfer = async (session: ClientSession) => {
      const postTxnBalanceA = walletA.balance - opts.amount;
      const postTxnBalanceB = walletB.balance + opts.amount;

      const rawOverdraftLimit = opts.allowOverdraft
        ? opts.overdraftLimit ?? walletA.overdraftLimit ?? 0
        : 0;

      assertCents(rawOverdraftLimit, "Overdraft limit", 0);

      const minimumAllowedBalance = -rawOverdraftLimit;
      const minimumBalanceBeforeDebit = opts.amount + minimumAllowedBalance;

      const insufficient = () =>
        new InsufficientBalanceError(
          opts.allowOverdraft
            ? "Your balance is too low!"
            : "Insufficient balance!",
          opts.amount,
          walletA.balance - minimumAllowedBalance,
        );

      if (postTxnBalanceA < minimumAllowedBalance) throw insufficient();

      // Pass through approval step
      const allowed = await Wallet.beforeTransferApproval?.({
        fromWallet: walletA,
        toWallet: walletB,
        transferOpts: opts,
        overdraftApplied: postTxnBalanceA < 0,
        minimumAllowedBalance,
      });

      if (allowed === false) {
        throw new Error("Transfer has been rejected!");
      }

      const { modifiedCount: debitModified } = await walletModel.updateOne(
        {
          _id: walletA._id,
          balance: {
            $gte: minimumBalanceBeforeDebit,
          },
        },
        {
          $set: {
            previousBalance: walletA.balance,
            lastRef: reference,
            negativeAt: negativeAt(walletA, postTxnBalanceA),
            updatedAt: new Date(),
          },
          $inc: {
            balance: -opts.amount,
          },
        },
        { session },
      );

      if (!debitModified) throw insufficient();

      // Credit transaction
      const { modifiedCount: creditModified } = await walletModel.updateOne({
        _id: walletB._id,
      }, {
        $set: {
          previousBalance: walletB.balance,
          lastRef: reference,
          negativeAt: negativeAt(walletB, postTxnBalanceB),
          updatedAt: new Date(),
        },
        $inc: {
          balance: opts.amount,
        },
      }, { session });

      if (!creditModified) throw new Error("Credit transaction failed!");

      const txnMetadata = {
        idempotencyKey,
        reference,
        description: opts.description,
        purpose: opts.purpose,
        foreignRefType: opts.foreignRefType,
        foreignRef: opts.foreignRef,
        isRefund: opts.isRefund,
        refundedReference: opts.refundedReference,
        currency: opts.currency,
        executorUser: opts.user,
        metadata: opts.metadata,
      };

      // Debit ledger entry
      const { insertedId: debit } = await walletLedgerModel.insertOne(
        walletLedgerSchema.strictParse({
          type: TransactionType.Debit,
          tenant: walletA.tenant,
          wallet: walletA._id,
          oppositeTenant: walletB.tenant,
          oppositeWallet: walletB._id,
          amount: -opts.amount,
          previousBalance: walletA.balance,
          tags: opts.tags ?? [],

          ...txnMetadata,
        }),
        { session },
      );

      // Credit ledger entry
      const { insertedId: credit } = await walletLedgerModel.insertOne(
        walletLedgerSchema.strictParse({
          type: TransactionType.Credit,
          tenant: walletB.tenant,
          wallet: walletB._id,
          oppositeTenant: walletA.tenant,
          oppositeWallet: walletA._id,
          amount: opts.amount,
          previousBalance: walletB.balance,
          tags: opts.tags ?? [],
          ...txnMetadata,
        }),
        { session },
      );

      return {
        reference,
        idempotencyKey,
        debit,
        credit,
      };
    };

    // Inside a caller's transaction the pre-check above is the only safe
    // guard: swallowing a duplicate-key error here would leave their session
    // aborted while we pretended to succeed.
    if (opts.databaseSession) return await makeTransfer(opts.databaseSession);

    try {
      return await mongodb.withSession((_) => _.withTransaction(makeTransfer));
    } catch (error) {
      // Lost a race with a concurrent run of the same key; its result stands.
      if (isDuplicateKeyError(error)) {
        const settled = await this.findTransferByKey(idempotencyKey);

        if (settled) return settled;
      }

      throw error;
    }
  }

  /**
   * Opens a gateway charge for `amount`, recording it before the money moves.
   *
   * The row is written **first**, in `initiated`, and its `_id` is handed to
   * the fallback. Charging first and recording afterwards would lose the
   * customer's money whenever the insert failed, and would let a fast gateway
   * webhook arrive before any row existed for it to settle.
   *
   * When `transfer` is given it is parked on the row so a webhook can replay
   * it; `ensureBalance`/`addBalance` pass nothing. Returns null when no
   * fallback is configured.
   */
  protected static async openTopup(details: {
    tenant: ObjectId;
    currency: string;
    /** Cents to raise from the gateway. */
    amount: number;
    /** What the wallet must cover afterwards — context for the hook. */
    required: number;
    available: number;
    idempotencyKey?: string;
    transfer?: TResolvedTransferOptions;
  }): Promise<WithId<z.infer<typeof walletTopupSchema>> | null> {
    if (!Wallet.onInsufficientBalance) return null;

    const amount = assertCents(details.amount, "Top-up amount");

    const byKey = details.idempotencyKey
      ? { idempotencyKey: details.idempotencyKey }
      : undefined;

    // Reuse before charging: two tabs, a retry after TopupPendingError, or two
    // concurrent renewals must not open two charges for the same need.
    if (byKey) {
      const existing = await walletTopupModel.findOne(byKey);

      if (existing) return existing;
    }

    const wallet = await this.resolve({
      tenant: details.tenant,
      currency: details.currency,
    });

    const payload = walletTopupSchema.strictParse({
      status: TopupStatus.Initiated,
      tenant: details.tenant,
      currency: details.currency,
      amount,
      idempotencyKey: details.idempotencyKey,
      transfer: details.transfer &&
        walletTopupTransferSchema.strictParse(details.transfer),
    });

    let _id: ObjectId;

    try {
      ({ insertedId: _id } = await walletTopupModel.insertOne(payload));
    } catch (error) {
      // Lost the race on the unique key — the winner's row is the real one.
      if (byKey && isDuplicateKeyError(error)) {
        const existing = await walletTopupModel.findOne(byKey);

        if (existing) return existing;
      }

      throw error;
    }

    let result: TWalletTopupResult | void;

    try {
      result = await Wallet.onInsufficientBalance({
        topup: _id,
        transfer: details.transfer,
        wallet,
        currency: details.currency,
        required: details.required,
        available: details.available,
        shortfall: amount,
      });
    } catch (error) {
      // The charge may or may not have gone through. Leave the row
      // `initiated` rather than failing it: a webhook carrying this id can
      // still settle it, and an operator can see it needs a decision.
      await walletTopupModel.updateOne({ _id }, {
        $set: {
          error: error instanceof Error ? error.message : String(error),
          updatedAt: new Date(),
        },
      });

      throw error;
    }

    const status = !result || result.status === "failed"
      ? TopupStatus.Failed
      : result.status === "completed"
      ? TopupStatus.Paid
      : TopupStatus.Pending;

    // Only advance the row we ourselves wrote. A webhook can settle an
    // `initiated` row by id — that is the recommended setup — so a fast
    // gateway may finish this top-up while the hook above is still returning.
    // An unconditional write would roll `completed` back to `paid`, and the
    // re-settle would then die on the ledger's unique index.
    const opened = await walletTopupModel.findOneAndUpdate({
      _id,
      status: TopupStatus.Initiated,
    }, {
      $set: {
        status,
        amount: result?.amount
          ? assertCents(result.amount, "Top-up amount")
          : amount,
        provider: result?.provider,
        providerRef: result?.providerRef,
        updatedAt: new Date(),
      },
    }, { returnDocument: "after" });

    if (opened) return opened;

    // Settled underneath us: whatever it is now is the truth.
    return await walletTopupModel.findOne({ _id }) ??
      { ...payload, _id, status };
  }

  /**
   * Opens a top-up and drives it as far as it can go in one call.
   *
   * Returns null when no fallback is configured or it declined; throws
   * {@link TopupPendingError} when the gateway will confirm out of band.
   */
  protected static async raiseFunds(details: {
    tenant: ObjectId;
    currency: string;
    amount: number;
    required: number;
    available: number;
    idempotencyKey?: string;
    transfer?: TResolvedTransferOptions;
  }): Promise<
    {
      topup: WithId<z.infer<typeof walletTopupSchema>>;
      transfer?: TWalletTransferResult;
    } | null
  > {
    const topup = await this.openTopup(details);

    if (!topup || topup.status === TopupStatus.Failed) return null;

    // Already settled — reusing a key whose charge completed earlier.
    if (topup.status === TopupStatus.Completed) return { topup };

    // Paid but not credited: settle it now. This is also how a reused row
    // left behind by an earlier credit failure gets another chance.
    if (topup.status === TopupStatus.Paid) {
      return await this.settleTopup({
        topup: topup._id,
        status: "completed",
      });
    }

    // initiated / pending / processing — the money is not confirmed in yet.
    throw new TopupPendingError(topup._id);
  }

  /**
   * Makes sure a tenant can afford `amount` before you spend it, topping up
   * through the gateway if it cannot. Nothing is transferred and nothing is
   * reserved - on return, the wallet simply holds enough.
   *
   * Use it to keep a gateway charge out of your transaction: ensure the funds
   * first, then open one transaction that does `transfer()` and whatever else
   * must succeed or fail with it.
   *
   * ```typescript
   * await Wallet.ensureBalance({ tenant, currency: "usd", amount: 500 });
   *
   * await mongodb.withSession((s) =>
   *   s.withTransaction(async (session) => {
   *     await Wallet.transfer({ ...opts, databaseSession: session });
   *     await orderModel.insertOne(order, { session });
   *   })
   * );
   * ```
   *
   * Throws `InsufficientBalanceError` if no fallback is configured or it
   * declines, and `TopupPendingError` if the gateway confirms out of band -
   * in that case the funds land when the webhook settles, and the caller
   * retries then.
   *
   * This is a check, not a lock: a concurrent debit can still spend the
   * balance before your transfer runs. `transfer()` re-checks atomically, so
   * the worst case is the failure you would have had anyway.
   */
  static async ensureBalance(opts: {
    tenant: ObjectId;
    currency: string;
    amount: number;
    allowOverdraft?: boolean;
    overdraftLimit?: number;
    /**
     * Makes repeat calls reuse one gateway charge instead of opening another.
     * Strongly recommended anywhere this runs on more than one request — a
     * lazy renewal, a retry after `TopupPendingError`, a double-clicked
     * button. Without it, every call that finds the balance short charges
     * again.
     */
    idempotencyKey?: string;
  }): Promise<TWalletEnsureBalanceResult> {
    assertCents(opts.amount, "Required amount");

    const spendable = (wallet: WithId<z.infer<typeof walletSchema>>) => {
      const room = opts.allowOverdraft
        ? opts.overdraftLimit ?? wallet.overdraftLimit ?? 0
        : 0;

      return wallet.balance + assertCents(room, "Overdraft limit", 0);
    };

    const wallet = await this.resolve({
      tenant: opts.tenant,
      currency: opts.currency,
    });

    const available = spendable(wallet);

    if (available >= opts.amount) {
      return { wallet, available, toppedUp: 0 };
    }

    const error = new InsufficientBalanceError(
      opts.allowOverdraft
        ? "Your balance is too low!"
        : "Insufficient balance!",
      opts.amount,
      available,
    );

    const settled = await this.raiseFunds({
      tenant: opts.tenant,
      currency: opts.currency,
      amount: opts.amount - available,
      required: opts.amount,
      available,
      idempotencyKey: opts.idempotencyKey,
    });

    // No fallback configured, or it declined to cover the shortfall.
    if (!settled) throw error;

    const funded = await this.resolve({
      tenant: opts.tenant,
      currency: opts.currency,
    });

    const fundedAvailable = spendable(funded);

    // The gateway may have covered less than was asked for.
    if (fundedAvailable < opts.amount) {
      throw new InsufficientBalanceError(
        error.message,
        opts.amount,
        fundedAvailable,
      );
    }

    return {
      wallet: funded,
      available: fundedAvailable,
      toppedUp: settled.topup.amount,
      topup: settled.topup,
    };
  }

  /**
   * Charges the customer for `amount` and credits it, whatever the balance is.
   *
   * The deliberate top-up: `ensureBalance` raises only what a payment is
   * short by, this raises exactly what you ask for. Use it for a "add funds"
   * button, a manual admin credit, or pre-loading an account.
   *
   * Goes through the same `onInsufficientBalance` fallback, which sees
   * `shortfall === amount` and no `transfer`. Nothing is parked for resume —
   * once the charge settles the money is simply in the wallet.
   *
   * ```typescript
   * await Wallet.addBalance({
   *   tenant,
   *   currency: "usd",
   *   amount: 2000,                       // $20.00, in cents
   *   idempotencyKey: `topup:${requestId}`,
   * });
   * ```
   *
   * Throws {@link TopupPendingError} when the gateway confirms out of band;
   * the funds land when your webhook settles it.
   */
  static async addBalance(opts: {
    tenant: ObjectId;
    currency: string;
    /** Cents to add. Not capped by, or related to, the current balance. */
    amount: number;
    /** Makes a repeat call reuse one gateway charge. See `ensureBalance`. */
    idempotencyKey?: string;
  }): Promise<TWalletEnsureBalanceResult> {
    assertCents(opts.amount, "Top-up amount");

    if (!Wallet.onInsufficientBalance) {
      throw new Error(
        "Set Wallet.onInsufficientBalance to add balance through a payment gateway!",
      );
    }

    const wallet = await this.resolve({
      tenant: opts.tenant,
      currency: opts.currency,
    });

    const settled = await this.raiseFunds({
      tenant: opts.tenant,
      currency: opts.currency,
      amount: opts.amount,
      // No shortfall here: the target is simply "whatever is there, plus this".
      required: wallet.balance + opts.amount,
      available: wallet.balance,
      idempotencyKey: opts.idempotencyKey,
    });

    if (!settled) {
      throw new Error(`The payment fallback declined to add balance!`);
    }

    const funded = await this.resolve({
      tenant: opts.tenant,
      currency: opts.currency,
    });

    return {
      wallet: funded,
      available: funded.balance,
      toppedUp: settled.topup.amount,
      topup: settled.topup,
    };
  }

  /**
   * Releases a top-up's idempotency key so a fresh charge can be opened under
   * the same key, and closes the row.
   *
   * A key is otherwise bound to its row for good: once a charge is `failed`,
   * reusing that key returns the failure rather than retrying, and an
   * `initiated` row whose charge never reached the gateway holds its key
   * until someone intervenes. This is the intervention.
   *
   * Only `initiated` and `failed` rows can be abandoned. **Confirm with the
   * gateway that no charge landed first** — an abandoned row is `failed`, and
   * `failed` is not settleable, so a payment that did go through could no
   * longer be credited by its webhook.
   */
  static async abandonTopup(details: {
    topup?: ObjectId;
    providerRef?: string;
    reason?: string;
  }) {
    if (!details.topup && !details.providerRef) {
      throw new Error(
        `Provide either a top-up id or a providerRef to abandon!`,
      );
    }

    const query = details.topup
      ? { _id: details.topup }
      : { providerRef: details.providerRef };

    const abandoned = await walletTopupModel.findOneAndUpdate({
      ...query,
      status: { $in: [TopupStatus.Initiated, TopupStatus.Failed] },
    }, {
      $set: {
        status: TopupStatus.Failed,
        error: details.reason ?? "Abandoned by an operator.",
        updatedAt: new Date(),
      },
      // Frees the key for a new attempt. The index is sparse, so several
      // abandoned rows can coexist.
      $unset: { idempotencyKey: "" },
    }, { returnDocument: "after" });

    if (!abandoned) {
      throw new Error(
        `Only an initiated or failed top-up can be abandoned!`,
      );
    }

    return abandoned;
  }

  /**
   * Credits a confirmed top-up and resumes the transfer that triggered it.
   *
   * Call this from your gateway webhook (or let `routes/walletTopups.ts` do it
   * via {@link Wallet.onTopupWebhook}). Safe against duplicate deliveries: the
   * row is claimed atomically, and a replay returns the stored outcome instead
   * of crediting twice.
   *
   * Safe to re-run against a row stuck in `paid` — that is the state a failed
   * credit leaves behind, and re-running is how it is recovered.
   */
  static async settleTopup(settlement: TWalletTopupSettlement): Promise<{
    topup: WithId<z.infer<typeof walletTopupSchema>>;
    transfer?: TWalletTransferResult;
  }> {
    if (!settlement.topup && !settlement.providerRef) {
      throw new Error(
        `Provide either a top-up id or a providerRef to settle!`,
      );
    }

    const query = settlement.topup
      ? { _id: settlement.topup }
      : { providerRef: settlement.providerRef };

    // Claim the row. A second webhook for the same charge finds nothing to
    // claim and falls through to the already-settled branch below.
    //
    // `initiated` is claimable because the charge may have gone through
    // before we learned its outcome, and `paid` because a credit that failed
    // leaves the row there to be retried.
    const topup = await walletTopupModel.findOneAndUpdate({
      ...query,
      $or: [
        { status: { $in: SETTLEABLE_TOPUP_STATUSES } },
        // A claim whose process never came back. Taking it over is safe:
        // re-crediting returns the existing ledger pair rather than
        // double-paying.
        {
          status: TopupStatus.Processing,
          updatedAt: {
            $lt: new Date(Date.now() - TOPUP_CLAIM_TIMEOUT_MS),
          },
        },
      ],
    }, {
      $set: {
        status: TopupStatus.Processing,
        updatedAt: new Date(),
      },
    }, { returnDocument: "before" });

    if (!topup) {
      const settled = await walletTopupModel.findOne(query);

      if (!settled) throw new Error(`Top-up not found!`);

      return { topup: settled, transfer: undefined };
    }

    if (settlement.status === "failed") {
      const message = settlement.error ?? "The gateway charge failed.";

      // A failure arriving for a row we already recorded as paid is a
      // contradiction. Failing it is still the safer side — crediting a
      // wallet for money that never arrived cannot be undone by an operator
      // — but it must not pass silently.
      const contradicts = topup.status === TopupStatus.Paid;

      const failed = await walletTopupModel.findOneAndUpdate({
        _id: topup._id,
      }, {
        $set: {
          status: TopupStatus.Failed,
          error: contradicts
            ? `${message} (was already recorded as paid — reconcile by hand)`
            : message,
          updatedAt: new Date(),
        },
      }, { returnDocument: "after" });

      return { topup: failed ?? topup, transfer: undefined };
    }

    const amount = assertCents(
      settlement.amount ?? topup.amount,
      "Settlement amount",
    );
    const reason = (error: unknown) =>
      error instanceof Error ? error.message : String(error);

    let credit: TWalletTransferResult;

    // `transfer` rejects a foreignRefType without a foreignRef, so these two
    // travel together or not at all.
    const foreignRef = topup.providerRef ?? undefined;
    const foreignRefType = foreignRef ? topup.provider ?? "gateway" : undefined;

    try {
      // Double-entry: the funding tenant is the external-money source, so it
      // is allowed to go arbitrarily negative.
      credit = await this.transfer({
        fromTenant: await this.resolveTopupTenant(),
        toTenant: topup.tenant,
        currency: topup.currency,
        amount,
        purpose: "wallet_topup",
        description: `Wallet top-up via ${topup.provider ?? "gateway"}`,
        foreignRefType,
        foreignRef,
        idempotencyKey: hash({ type: "topup", topup: topup._id.toString() }),
        allowOverdraft: true,
        overdraftLimit: Number.MAX_SAFE_INTEGER,
      });
    } catch (error) {
      // The customer has paid; only our side of the credit failed (an unset
      // WALLET_TOPUP_TENANT being the likely cause). Park the row in `paid`,
      // NOT `failed`: `paid` is claimable, so a redelivered webhook or an
      // operator re-running settleTopup finishes the job once the cause is
      // fixed. Marking it failed would strand the money.
      await walletTopupModel.updateOne({ _id: topup._id }, {
        $set: {
          status: TopupStatus.Paid,
          error: reason(error),
          updatedAt: new Date(),
        },
      });

      throw error;
    }

    // Past this point the customer's money is in their wallet, so the top-up
    // itself succeeded even if replaying the original transfer does not. We
    // record why rather than throwing: throwing here would tell the gateway to
    // retry a webhook that has already been honoured.
    let transfer: TWalletTransferResult | undefined;
    let resumeError: string | undefined;

    try {
      // Reuses the original reference and idempotency key, so a duplicate
      // settlement cannot run the transfer twice.
      if (topup.transfer) {
        transfer = await this.execute(withoutNulls(topup.transfer));
      }
    } catch (error) {
      resumeError = reason(error);
    }

    const completed = await walletTopupModel.findOneAndUpdate({
      _id: topup._id,
    }, {
      $set: {
        status: TopupStatus.Completed,
        amount,
        topupReference: credit.reference,
        resumedReference: transfer?.reference,
        // Drops any error left by an earlier attempt that we just recovered.
        error: resumeError,
        updatedAt: new Date(),
      },
    }, { returnDocument: "after" });

    return { topup: completed ?? topup, transfer };
  }

  static async refund(opts: IWalletRefundOptions) {
    const makeRefund = async (session: ClientSession) => {
      const refundIdempotencyKey = opts.idempotencyKey ?? hash({
        type: "refund",
        reference: opts.refToRefund,
      });

      const debit = await walletLedgerModel.findOneAndUpdate({
        type: TransactionType.Debit,
        reference: opts.refToRefund,
        isRefunded: { $ne: true },
        isRefund: { $ne: true },
      }, {
        $set: {
          isRefunded: true,
          updatedAt: new Date(),
        },
      }, { session });

      if (!debit) {
        throw new Error("Original transaction not found or already refunded!");
      }

      const refund = await this.transfer({
        ...opts,
        idempotencyKey: refundIdempotencyKey,
        fromTenant: debit.oppositeTenant,
        toTenant: debit.tenant,
        currency: debit.currency,
        amount: -debit.amount,
        isRefund: true,
        refundedReference: debit.reference,
        description: opts.description ??
          `Refund for transaction ${debit.reference}`,
        databaseSession: session,
      });

      await walletLedgerModel.updateMany(
        {
          reference: opts.refToRefund,
        },
        {
          $set: {
            isRefunded: true,
            refundReference: refund.reference,
            updatedAt: new Date(),
          },
        },
        { session },
      );

      return refund;
    };

    if (opts.databaseSession) return await makeRefund(opts.databaseSession);

    return await mongodb.withSession((_) => _.withTransaction(makeRefund));
  }
}
