import z from "zod";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/** Metrics a rule can watch (PLAN §13); the first four are evaluated on the agent. */
export const $alertMetric = z.enum([
  "cpu",
  "memory",
  "disk",
  "room",
  "agentOffline",
  "deployFailed",
  // The control plane itself (platform admins' rules).
  "cpCpu",
  "cpMemory",
  "cpPollLatency",
  "cpErrorRate",
  "cpPollsMissing",
]);
export const AGENT_METRICS = ["cpu", "memory", "disk", "room"] as const;

/** Which metrics each target kind supports. */
export const METRICS_BY_TARGET = {
  server: ["cpu", "memory", "disk", "room", "agentOffline"],
  project: ["cpu", "memory", "deployFailed"],
  controlPlane: [
    "cpCpu",
    "cpMemory",
    "cpPollLatency",
    "cpErrorRate",
    "cpPollsMissing",
  ],
} as const;

/**
 * Owner of the control plane's rules and alerts: not a workspace, so no
 * workspace ever lists them; channel secrets are sealed under it.
 */
export const PLATFORM_OWNER = new ObjectId("000000000000000000000000");

export const $alertChannelType = z.enum(["email", "webhook", "slack"]);

export const $alertChannel = z.object({
  type: $alertChannelType,
  target: z.string().max(500).describe(
    "The email address; for webhooks a masked URL (the real one is encrypted)",
  ),
  secretEnc: z.string().optional(),
});

export const $alertRule = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  name: z.string().min(1).max(80),
  target: z.object({
    kind: z.enum(["server", "project", "controlPlane"]),
    ref: $objectId.optional().describe("Every server (or project) when absent"),
  }),
  metric: $alertMetric,
  threshold: z.number().describe(
    "Percent for cpu/memory/disk (above fires); MiB of room (below fires); control plane: see METRICS_BY_TARGET",
  ),
  forSec: z.number().int().min(0).max(86_400),
  channels: z.array($alertChannel).min(1).max(10),
  enabled: z.boolean(),
  createdBy: $objectId.meta({ ref: "users" }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TAlertRule = z.output<typeof $alertRule>;
export type TAlertChannel = z.output<typeof $alertChannel>;

export const alertRuleModel = mongodb.db().collection<TAlertRule>(
  "alertRules",
);

/**
 * One episode of a rule breaching, plus its delivery outbox (PLAN §3.4): the
 * notice due next is claimed by a request with `claimedUntil` and retried
 * with backoff.
 */
export const $alertEvent = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  rule: $objectId.meta({ ref: "alertRules" }),
  ruleName: z.string(),
  metric: $alertMetric,
  threshold: z.number(),
  server: $objectId.meta({ ref: "servers" }).optional(),
  project: $objectId.meta({ ref: "projects" }).optional(),
  /** A control plane instance ("host (id)"), or "all" for fleet-wide rules. */
  instance: z.string().max(200).optional(),
  /** rule:subject; unique among open events, so a repeat never fires twice. */
  key: z.string(),
  open: z.literal(true).optional(),
  firedAt: z.date(),
  resolvedAt: z.date().optional(),
  value: z.number().optional(),
  detail: z.string().max(500).optional(),
  /** Channel indexes the current notice reached. */
  deliveredChannels: z.array(z.number().int()),
  delivery: z.object({
    notice: z.enum(["fired", "resolved"]),
    status: z.enum(["pending", "sent", "failed"]),
    attempts: z.number().int(),
    nextAttemptAt: z.date(),
    claimedUntil: z.date().optional(),
    error: z.string().max(500).optional(),
  }),
});

export type TAlertEvent = z.output<typeof $alertEvent>;

export const alertEventModel = mongodb.db().collection<TAlertEvent>(
  "alertEvents",
);
