import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

export const $githubAccount = z.object({
  login: z.string(),
  type: z.string(),
});

export const $installation = z.object({
  id: z.number().int(),
  account: $githubAccount,
  repositorySelection: z.enum(["all", "selected"]).optional(),
  suspended: z.boolean().default(false),
});

/** A GitHub App created on the user's account or org (PLAN D19, §6). */
export const $gitIntegration = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  owner: $objectId.meta({ ref: "users" }),
  provider: z.literal("github"),
  appId: z.number().int(),
  appSlug: z.string(),
  appName: z.string(),
  htmlUrl: z.string(),
  clientId: z.string(),
  /** Encrypted with the tenant's data key; never returned by the API. */
  clientSecretEnc: z.string(),
  privateKeyEnc: z.string(),
  webhookSecretEnc: z.string(),
  account: $githubAccount,
  installations: z.array($installation).default([]),
  sharedWithTenant: z.boolean().default(false),
  createdAt: z.date(),
});

export type TInstallation = z.output<typeof $installation>;
export type TGitIntegration = z.output<typeof $gitIntegration>;

/** Fields that must never leave the server. */
export const secretFields = {
  clientSecretEnc: 0,
  privateKeyEnc: 0,
  webhookSecretEnc: 0,
} as const;

export const gitIntegrationModel = mongodb.db().collection<TGitIntegration>(
  "gitIntegrations",
);
