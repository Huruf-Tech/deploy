import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/** Where the code (or image) comes from (PLAN D20). */
export const $projectSource = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("github"),
    gitIntegration: $objectId.meta({ ref: "gitIntegrations" }),
    installation: z.number().int(),
    repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/).describe("owner/name"),
    branch: z.string().min(1).max(255),
  }),
  z.object({
    type: z.literal("git"),
    url: z.string().min(1).max(500).describe(
      "https://… for public repos, or git@host:owner/repo.git with the deploy key",
    ),
    branch: z.string().min(1).max(255),
  }),
  z.object({
    type: z.literal("image"),
    image: z.string().min(1).max(300),
  }),
  z.object({
    type: z.literal("template").describe(
      "One-click service: everything comes from the template",
    ),
  }),
  z.object({
    type: z.literal("compose").describe(
      "A compose file pasted by the user (stored encrypted)",
    ),
  }),
]);

/** How the image is made: a template's Dockerfile, the repo's own, or a compose file. */
export const $projectBuild = z.object({
  mode: z.enum(["template", "dockerfile", "compose", "none"]),
  rootDir: z.string().max(200).default("."),
  dockerfilePath: z.string().max(200).default("Dockerfile"),
  composePath: z.string().max(200).default("compose.yaml"),
});

export const $projectRuntime = z.object({
  port: z.number().int().min(1).max(65_535).optional().describe(
    "Port the app listens on inside the container",
  ),
  healthcheckPath: z.string().max(200).optional(),
  command: z.array(z.string().max(1_000)).max(32).optional(),
  cpuLimit: z.number().positive().max(256).optional(),
  memLimitMb: z.number().int().positive().max(1_048_576).optional(),
  /** Reserved per replica for placement (PLAN §7). */
  cpuReserve: z.number().min(0).max(256).default(0.1),
  memReserveMb: z.number().int().min(0).max(1_048_576).default(128),
  healthTimeoutSec: z.number().int().min(10).max(1_800).default(120),
});

/** A local Docker volume, or a path in an S3 bucket when `storage` is set (PLAN §11). */
export const $projectVolume = z.object({
  name: z.string().regex(/^[a-z0-9][a-z0-9-]{0,40}$/),
  mountPath: z.string().regex(/^\/[^:]*$/).max(200),
  storage: $objectId.meta({ ref: "storages" }).optional().describe(
    "S3 storage connection; the volume is local when absent",
  ),
  path: z.string().regex(/^[\w.\/-]*$/).max(200)
    .refine((p) => !p.split("/").includes(".."), "No `..` in the path")
    .optional().describe(
      "Folder in the bucket; <project-slug>/<volume> when empty",
    ),
});

/** Local volumes pin a project to one server; S3 ones don't. */
export const hasLocalVolumes = (volumes: { storage?: unknown }[]) =>
  volumes.some((v) => !v.storage);

export const $deployStrategy = z.enum(["rolling", "allAtOnce", "stopFirst"]);

/** Agent-local autoscaling (PLAN §10): replicas per server within min..max. */
export const $projectAutoscale = z.object({
  min: z.number().int().min(1).max(20),
  max: z.number().int().min(1).max(20),
  cpuPercent: z.number().int().min(10).max(100).optional().describe(
    "Target CPU per replica, as a percent of its CPU limit (else reservation)",
  ),
  memPercent: z.number().int().min(10).max(100).optional().describe(
    "Target memory per replica, as a percent of its memory limit (else reservation)",
  ),
  cooldownSec: z.number().int().min(30).max(3_600).default(120),
}).refine((a) => a.min <= a.max, "min must not exceed max")
  .refine((a) => a.cpuPercent || a.memPercent, "Set a CPU or memory target");

export const $project = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  group: $objectId.meta({ ref: "projectGroups" }).optional(),
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,38}$/),
  kind: z.enum(["app", "service"]),
  source: $projectSource,
  build: $projectBuild,
  template: z.object({
    template: $objectId.meta({ ref: "templates" }),
    version: z.number().int(),
  }).optional(),
  /** Non-secret template inputs; secret ones are project variables. */
  templateInputs: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  )
    .default({}),
  runtime: $projectRuntime,
  /** Where the next deploy places it (PLAN §7). */
  servers: z.array($objectId.meta({ ref: "servers" })).min(1).max(50),
  /** Where the active release runs now; becomes `servers` when a deploy completes. */
  placedOn: z.array($objectId.meta({ ref: "servers" })).default([]),
  replicasPerServer: z.number().int().min(0).max(20).default(1),
  autoscale: $projectAutoscale.optional(),
  /** Latest autoscaler change per server, as reported by its agent. */
  autoscaled: z.array(z.object({
    server: $objectId.meta({ ref: "servers" }),
    replicas: z.number().int(),
    reason: z.string(),
    at: z.date(),
  })).optional(),
  publicPort: z.number().int().min(1).max(65_535).optional(),
  volumes: z.array($projectVolume).max(10).default([]),
  deployStrategy: $deployStrategy,
  autoDeploy: z.boolean().default(true),
  /** Reaches projects on other servers: warn when the mesh can't connect them (PLAN §8.2). */
  needsPrivateNetwork: z.boolean().default(false),
  distribution: z.enum(["auto", "perServer", "registry"]).default("auto"),
  registry: $objectId.meta({ ref: "registries" }).optional(),
  /** Generic Git over SSH: the private half of the deploy key, encrypted. */
  deployKeyEnc: z.string().optional(),
  /** Pasted compose file, encrypted: it often holds passwords. */
  composeEnc: z.string().optional(),
  deployKeyPublic: z.string().optional(),
  activeRelease: $objectId.meta({ ref: "releases" }).optional(),
  releaseCounter: z.number().int().default(0),
  /** Part of the BuildKit cache id; bumped by "clear build cache" (PLAN §9.2). */
  cacheEpoch: z.number().int().default(0),
  noCacheNext: z.boolean().optional(),
  status: z.enum(["new", "deploying", "running", "failed"]),
  createdBy: $objectId.meta({ ref: "users" }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TProject = z.output<typeof $project>;
export type TProjectSource = z.output<typeof $projectSource>;

export const projectModel = mongodb.db().collection<TProject>("projects");

export const $projectGroup = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  name: z.string().min(1).max(80).meta({ canFilter: true }),
  description: z.string().max(500).optional().meta({ canFilter: true }),
});

export const projectGroupModel = mongodb.db().collection<
  z.output<typeof $projectGroup>
>("projectGroups");

/** What a user sends to create a project; the server fills in the rest. */
export const $projectInput = z.object({
  name: $project.shape.name,
  slug: $project.shape.slug,
  group: $objectId.optional(),
  source: $projectSource,
  build: $projectBuild.partial().optional(),
  template: z.object({
    template: $objectId,
    version: z.number().int().optional().describe("Latest when omitted"),
  }).optional(),
  inputs: z.record(z.string(), z.unknown()).default({}).describe(
    "Template inputs; secret ones become project secret variables",
  ),
  compose: z.string().max(100_000).optional().describe(
    "The compose file, for the `compose` source",
  ),
  variables: z.array(z.object({
    key: z.string().min(1).max(128).regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
    value: z.string().max(65_536),
    isSecret: z.boolean().default(false),
  })).max(200).default([]).describe(
    "Project variables to create with it (e.g. a pasted .env)",
  ),
  runtime: $projectRuntime.partial().optional(),
  servers: $project.shape.servers,
  replicasPerServer: z.number().int().min(0).max(20).default(1),
  autoscale: $projectAutoscale.optional(),
  publicPort: $project.shape.publicPort,
  volumes: z.array($projectVolume).max(10).default([]),
  deployStrategy: $deployStrategy.optional(),
  autoDeploy: z.boolean().default(true),
  needsPrivateNetwork: z.boolean().default(false),
  distribution: $project.shape.distribution,
  registry: $objectId.optional(),
  acknowledgeVolumeRisk: z.boolean().optional().describe(
    "Required for rolling or all-at-once with local volumes (PLAN §10)",
  ),
  deployNow: z.boolean().default(false).describe(
    "Start the first deploy right away. Not the same as autoDeploy (deploy on every push). A generic Git source waits for its deploy key either way.",
  ),
});

export const $projectUpdate = z.object({
  name: $project.shape.name,
  group: $objectId.nullable(),
  runtime: $projectRuntime.partial(),
  servers: $project.shape.servers,
  replicasPerServer: z.number().int().min(0).max(20),
  autoscale: $projectAutoscale.nullable(),
  publicPort: z.number().int().min(1).max(65_535).nullable(),
  deployStrategy: $deployStrategy,
  autoDeploy: z.boolean(),
  needsPrivateNetwork: z.boolean(),
  distribution: $project.shape.distribution,
  registry: $objectId.nullable(),
  branch: z.string().min(1).max(255),
  templateVersion: z.number().int().min(1),
  /** Another visible template of the same kind (e.g. a tenant copy with a fix). */
  template: $objectId,
  inputs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  compose: z.string().min(1).max(100_000),
  volumes: z.array($projectVolume).max(10),
  acknowledgeVolumeRisk: z.boolean(),
}).partial();

export type TProjectInput = z.output<typeof $projectInput>;
export type TProjectUpdate = z.output<typeof $projectUpdate>;
