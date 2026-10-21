import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

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
  managedServers: z.number().int().min(0).default(0),
});

export const $planFeatures = z.object({
  blueGreen: z.boolean().default(true),
  autoscale: z.boolean().default(true),
  privateNetwork: z.boolean().default(true),
  backups: z.boolean().default(true),
  managedServers: z.boolean().default(false),
});

export const $plan = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  visibility: z.enum(["public", "private"]).default("public"),
  allowedTenants: z.array($objectId.meta({ ref: "tenants" })).default([]),
  price: z.object({
    amount: z.number().int().min(0),
    currency: z.string().min(3).max(3),
    interval: z.enum(["month", "year"]),
  }),
  limits: $planLimits.default($planLimits.parse({})),
  features: $planFeatures.default($planFeatures.parse({})),
  isFree: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  createdAt: z.date().default(() => new Date()),
});

export type TPlanLimits = z.output<typeof $planLimits>;
export type TPlanFeatures = z.output<typeof $planFeatures>;
export type TPlan = z.output<typeof $plan>;

export const planModel = mongodb.db().collection<TPlan>("plans");
