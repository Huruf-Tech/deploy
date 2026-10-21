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

    return await mongodb.withSession((session) => session.withTransaction(exec));

  }

  static async calculateFee(
    options: TWalletFeeOptions,
  ): Promise<TWalletFeeStructure> {
    if (typeof this.onCalculateFee === "function") {
      return await this.onCalculateFee(options);
    }

    return {
      total: 0,
      breakdown: [],
    };
  }

  static async transfer(opts: IWalletTransferOptions) {
    if (
      typeof opts.amount !== "number" || !Number.isInteger(opts.amount) ||
      opts.amount <= 0
    ) {
      throw new Error(
        `Please provide a valid non-zero positive integer in cents!`,
      );
    }

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

    if (opts.fromTenant.equals(opts.toTenant)) {
      throw new Error(`Cannot transfer to the same wallet!`);
    }

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

      if (!Number.isInteger(rawOverdraftLimit) || rawOverdraftLimit < 0) {
        throw new Error("Invalid overdraft limit!");
      }

      const minimumAllowedBalance = -rawOverdraftLimit;
      const minimumBalanceBeforeDebit = opts.amount + minimumAllowedBalance;

      if (postTxnBalanceA < minimumAllowedBalance) {
        throw new Error(
          opts.allowOverdraft
            ? "Your balance is too low!"
            : "Insufficient balance!",
        );
      }

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

      if (!debitModified) {
        throw new Error(
          opts.allowOverdraft
            ? "Your balance is too low!"
            : "Insufficient balance!",
        );
      }

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

    if (opts.databaseSession) return await makeTransfer(opts.databaseSession);

    return await mongodb.withSession((_) => _.withTransaction(makeTransfer));
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
