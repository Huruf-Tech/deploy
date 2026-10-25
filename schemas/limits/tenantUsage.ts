import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/** Per-tenant count-quota counters (PLAN §20.3). Missing fields count as 0. */
export const $tenantUsage = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  servers: z.number().int().optional(),
  projects: z.number().int().optional(),
  members: z.number().int().optional(),
  templates: z.number().int().optional(),
  alertRules: z.number().int().optional(),
  gitIntegrations: z.number().int().optional(),
  registries: z.number().int().optional(),
  domains: z.number().int().optional(),
  managedServers: z.number().int().optional(),
  /** Since when the tenant has had more servers than its plan allows (PLAN §22.5). */
  overLimitSince: z.date().optional(),
});

export type TTenantUsage = z.output<typeof $tenantUsage>;
export type TCountQuota = Exclude<
  keyof TTenantUsage,
  "tenant" | "overLimitSince"
>;

export const tenantUsageModel = mongodb.db().collection<TTenantUsage>(
  "tenantUsage",
);
