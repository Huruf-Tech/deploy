import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { $deployStrategy } from "@/schemas/applications/project.ts";

export const $commit = z.object({
  sha: z.string(),
  message: z.string().optional(),
  author: z.string().optional(),
});

/** One service of a release: what every replica of it runs. */
export const $serviceSpec = z.object({
  name: z.string().describe("Service name; the app itself is `app`"),
  image: z.string(),
  env: z.record(z.string(), z.string()),
  files: z.record(z.string(), z.string()),
  command: z.array(z.string()).optional(),
  port: z.number().int().optional(),
  healthcheckPath: z.string().optional(),
  healthcheckCommand: z.string().optional(),
  volumes: z.array(z.object({ name: z.string(), mountPath: z.string() })),
});

/**
 * Immutable output of a deploy (PLAN §5): image plus the resolved runtime,
 * variables included, so the spec is encrypted. Rollbacks reuse it as is.
 */
export const $release = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  project: $objectId.meta({ ref: "projects" }),
  number: z.number().int().min(1),
  image: z.string().optional().describe("Built image tag, when built"),
  pushedImage: z.string().optional().describe(
    "Registry copy, in registry mode",
  ),
  registry: $objectId.meta({ ref: "registries" }).optional(),
  /** Pushed to the tenant's built-in registry (on the primary server, over the mesh). */
  builtinRegistry: z.boolean().optional(),
  /** The builders that have the image locally (per-server builds). */
  builtOn: z.array($objectId.meta({ ref: "servers" })).default([]),
  commit: $commit.optional(),
  /** Encrypted JSON array of service specs (tenant key, bound to this release). */
  specEnc: z.string(),
  services: z.array(z.string()).describe("Service names, for status tracking"),
  deployment: $objectId.meta({ ref: "deployments" }),
  createdBy: $objectId.meta({ ref: "users" }).optional(),
  createdAt: z.date(),
});

export const $rolloutServer = z.object({
  server: $objectId.meta({ ref: "servers" }),
  state: z.enum(["pending", "applying", "healthy", "failed"]),
  /** Statuses for older specs are ignored. */
  specVersion: z.number().int().optional(),
  healthy: z.array(z.string()).default([]).describe(
    "Services reported healthy",
  ),
  error: z.string().optional(),
});

export const $deployment = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  project: $objectId.meta({ ref: "projects" }),
  release: $objectId.meta({ ref: "releases" }).optional(),
  releaseNumber: z.number().int().optional(),
  trigger: z.enum(["manual", "push", "rollback"]),
  strategy: $deployStrategy,
  distribution: z.enum(["local", "perServer", "registry", "builtin"])
    .optional(),
  status: z.enum([
    "queued",
    "building",
    "deploying",
    "healthy",
    "failed",
    "cancelled",
  ]).meta({ canFilter: true }),
  servers: z.array($objectId.meta({ ref: "servers" })),
  /** Set while building or deploying; a unique partial index allows one per project. */
  active: z.literal(true).optional(),
  builds: z.array(z.object({
    server: $objectId.meta({ ref: "servers" }),
    seq: z.number().int(),
    status: z.enum(["running", "done", "failed"]),
    error: z.string().optional(),
    durationMs: z.number().int().optional(),
  })).default([]),
  rollout: z.object({
    phase: z.enum(["rolling", "prepare", "switch"]),
    servers: z.array($rolloutServer),
  }).optional(),
  /** Requested ref (push SHA or branch); the release carries the resolved commit. */
  ref: z.string().optional(),
  commit: $commit.optional(),
  noCache: z.boolean().default(false),
  triggeredBy: $objectId.meta({ ref: "users" }).optional(),
  createdAt: z.date(),
  startedAt: z.date().optional(),
  finishedAt: z.date().optional(),
  durationMs: z.number().int().optional(),
  /** Builds and rollouts fail past this; checked whenever the deployment is read. */
  deadlineAt: z.date().optional(),
  errorSummary: z.string().max(500).optional(),
});

export type TRelease = z.output<typeof $release>;
export type TServiceSpec = z.output<typeof $serviceSpec>;
export type TDeployment = z.output<typeof $deployment>;

export const releaseModel = mongodb.db().collection<TRelease>("releases");
export const deploymentModel = mongodb.db().collection<TDeployment>(
  "deployments",
);
