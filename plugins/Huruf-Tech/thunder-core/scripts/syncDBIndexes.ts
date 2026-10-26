import { accessControlModel } from "../schemas/accessControl.ts";
import { accessControlPolicyModel } from "../schemas/accessControlPolicy.ts";
import { tenantInviteModel } from "../schemas/tenantInvite.ts";
import { tenantMemberModel } from "../schemas/tenantMember.ts";
import { envModel } from "../schemas/env.ts";
import { oauthConsentModel } from "../schemas/oauthConsent.ts";
import { apiKeyModel } from "@/schemas/apiKey.ts";
import { walletModel } from "@/schemas/wallet.ts";
import { walletLedgerModel } from "@/schemas/walletLedger.ts";
import { walletTopupModel } from "@/schemas/walletTopup.ts";

export const syncDBIndexes = async () => {
  await Promise.allSettled([
    envModel.createIndex({
      key: 1,
    }, {
      name: "key",
      background: true,
      unique: true,
    }),
    tenantInviteModel.createIndex({
      email: 1,
      tenant: 1,
    }, {
      name: "uniqueInvite",
      background: true,
      unique: true,
    }),
    tenantMemberModel.createIndex({
      tenant: 1,
      user: 1,
    }, {
      name: "uniqueMember",
      background: true,
      unique: true,
    }),
    oauthConsentModel.createIndex({
      client: 1,
      createdBy: 1,
    }, {
      name: "uniqueConsentPerClient",
      background: true,
      unique: true,
    }),
    accessControlModel.createIndex({
      role: 1,
    }, {
      name: "uniqueAC",
      background: true,
      unique: true,
    }),
    accessControlPolicyModel.createIndex({
      name: 1,
    }, {
      name: "uniquePolicy",
      background: true,
      unique: true,
    }),
    apiKeyModel.createIndex({
      secret: 1,
    }, {
      name: "findBySecret",
      background: true,
    }),
    walletModel.createIndex(
      { tenant: 1, currency: 1 },
      {
        name: "uniqueWallet",
        background: true,
        unique: true,
      },
    ),
    walletLedgerModel.createIndex(
      { idempotencyKey: 1, type: 1 },
      {
        name: "uniqueIdempotencyKey",
        background: true,
        unique: true,
      },
    ),
    walletLedgerModel.createIndex(
      { reference: 1, type: 1 },
      {
        name: "uniqueReference",
        background: true,
        unique: true,
      },
    ),
    // A gateway webhook finds its top-up by providerRef; a duplicate would
    // make settlement ambiguous.
    walletTopupModel.createIndex(
      { providerRef: 1 },
      {
        name: "uniqueProviderRef",
        background: true,
        unique: true,
        sparse: true,
      },
    ),
    walletTopupModel.createIndex(
      { tenant: 1, status: 1 },
      {
        name: "topupsByTenant",
        background: true,
      },
    ),
    // Makes "reuse instead of charging again" race-proof: a second concurrent
    // attempt loses the insert and reads the winner's row.
    walletTopupModel.createIndex(
      { idempotencyKey: 1 },
      {
        name: "uniqueTopupIdempotencyKey",
        background: true,
        unique: true,
        sparse: true,
      },
    ),
  ]);
};

if (import.meta.main) {
  await syncDBIndexes();

  Deno.exit();
}
