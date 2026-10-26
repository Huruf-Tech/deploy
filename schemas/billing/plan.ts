import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * A quota this high means "no limit" (the built-in Unlimited plan); the
 * dashboard shows it as Unlimited. Keep in step with public/app/src/lib/plans.ts.
 */
export const UNLIMITED = 1_000_000;

/** Plan quotas (PLAN §20.3 A). The defaults are the Free plan. */
export const $planLimits = z.object({
  servers: z.number().int().min(0).default(5),
  projects: z.number().int().min(0).default(20),
  members: z.number().int().min(0).default(3),
  releasesKept: z.number().int().min(1).default(5),
  variablesPerScope: z.number().int().min(0).default(200),
  deploysPerHour: z.number().int().min(0).default(30),
  concurrentTerminals: z.number().int().min(0).default(1),
  concurrentStreams: z.number().int().min(0).default(3),
  variableApiReadsPerMinute: z.number().int().min(0).default(60),
  templates: z.number().int().min(0).default(10),
  alertRules: z.number().int().min(0).default(10),
  gitIntegrations: z.number().int().min(0).default(10),
  registries: z.number().int().min(0).default(10),
  domains: z.number().int().min(0).default(3),
  /** AI template assistant calls per calendar month (UTC), with `aiAssistant`. */
  aiRequestsPerMonth: z.number().int().min(0).default(50),
});

export const $planFeatures = z.object({
  blueGreen: z.boolean().default(true),
  autoscale: z.boolean().default(true),
  privateNetwork: z.boolean().default(true),
  backups: z.boolean().default(true),
  /** The AI template assistant (Phase 12): off unless a plan turns it on. */
  aiAssistant: z.boolean().default(false),
});

/** What a rentable server size gives (PLAN §26.6 A); `kind: "server"` plans only. */
export const $planResources = z.object({
  vcpu: z.number().min(0.25).max(64),
  memMb: z.number().int().min(256),
  diskGb: z.number().int().min(5),
  /** Traffic included per period; beyond it is charged per GB. */
  trafficGb: z.number().int().min(0),
});

export const $planInput = z.object({
  name: z.string().min(1).max(50).meta({ canFilter: true }),
  /**
   * `workspace`: the tenant's plan (quotas and features). `server`: a rentable
   * size of a pool machine (PLAN §26), with `resources`.
   */
  kind: z.enum(["workspace", "server"]).default("workspace").meta({
    canFilter: true,
  }),
  resources: $planResources.optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).meta({
    canFilter: true,
  }),
  description: z.string().max(500).optional(),
  visibility: z.enum(["public", "private"]).default("public").meta({
    canFilter: true,
  }),
  allowedTenants: z.array($objectId.meta({ ref: "tenants" })).default([]),
  price: z.object({
    amount: z.number().int().min(0),
    currency: z.string().min(3).max(3),
    interval: z.enum(["month", "year"]),
  }),
  limits: $planLimits.default($planLimits.parse({})),
  features: $planFeatures.default($planFeatures.parse({})),
  isFree: z.boolean().default(false).meta({ canFilter: true }),
  active: z.boolean().default(true).meta({ canFilter: true }),
  sortOrder: z.number().int().default(0),
});

/**
 * Updates are partial, and Zod fills `.default()`s even for absent keys: with
 * $planInput, renaming a plan would reset its limits, features and visibility.
 */
export const $planUpdate = $planInput.extend({
  kind: $planInput.shape.kind.unwrap(),
  visibility: $planInput.shape.visibility.unwrap(),
  allowedTenants: $planInput.shape.allowedTenants.unwrap(),
  limits: $planLimits,
  features: $planFeatures,
  isFree: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int(),
}).partial();

export const $plan = $planInput.extend({
  createdAt: z.date().default(() => new Date()).meta({ canFilter: true }),
  updatedAt: z.date().default(() => new Date()).meta({ canFilter: true }),
});

export type TPlanLimits = z.output<typeof $planLimits>;
export type TPlanFeatures = z.output<typeof $planFeatures>;
export type TPlanResources = z.output<typeof $planResources>;
export type TPlan = z.output<typeof $plan>;

export const planModel = mongodb.db().collection<TPlan>("plans");
