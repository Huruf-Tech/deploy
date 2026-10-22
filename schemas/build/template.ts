import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

const $identifier = z.string().min(1).max(64).regex(
  /^[A-Za-z_][A-Za-z0-9_]*$/,
  "Letters, digits and underscores; must not start with a digit",
);

/** A value the user fills in when creating a project from the template. */
export const $templateInput = z.object({
  key: $identifier,
  label: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  type: z.enum(["string", "number", "boolean", "select", "secret"]),
  default: z.union([z.string().max(1_000), z.number(), z.boolean()])
    .optional(),
  required: z.boolean().default(false),
  options: z.array(z.string().max(100)).max(50).optional(),
  /** Filled automatically when empty; generated secrets become project secret variables. */
  generate: z.enum(["password"]).optional(),
});

export const $templateDefaults = z.object({
  port: z.number().int().min(1).max(65_535).optional(),
  healthcheckPath: z.string().max(200).optional(),
  startCommand: z.string().max(1_000).optional(),
  buildCommand: z.string().max(1_000).optional(),
  cpuLimit: z.number().positive().max(256).optional(),
  memLimitMb: z.number().int().positive().max(1_048_576).optional(),
});

/** One immutable version's content (PLAN §9.1). */
export const $templateContent = z.object({
  /** Handlebars; `kind: app`. */
  dockerfile: z.string().max(100_000).optional(),
  /** Handlebars; `kind: service`. */
  compose: z.string().max(100_000).optional(),
  inputs: z.array($templateInput).max(50).default([]),
  defaults: $templateDefaults.default({}),
  /** Package-manager download stores mounted as BuildKit caches. */
  cachePaths: z.array(z.string().min(1).max(200)).max(20).default([]),
  changelog: z.string().max(1_000).optional(),
});

export const $templateKind = z.enum(["app", "service"]);

export const $templateMeta = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  /** A Tabler icon name or an image URL. */
  icon: z.string().max(300).optional(),
});

export const $template = $templateMeta.extend({
  scope: z.enum(["system", "tenant"]),
  tenant: $objectId.meta({ ref: "tenants" }).optional(),
  kind: $templateKind,
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  clonedFrom: z.object({
    template: $objectId.meta({ ref: "templates" }),
    version: z.number().int(),
  }).optional(),
  latestVersion: z.number().int(),
  /** System templates are hidden from tenants until published. */
  isPublished: z.boolean().default(true),
  createdBy: $objectId.meta({ ref: "users" }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const $templateVersion = $templateContent.extend({
  template: $objectId.meta({ ref: "templates" }),
  version: z.number().int(),
  createdBy: $objectId.meta({ ref: "users" }).optional(),
  createdAt: z.date(),
});

export type TTemplateInput = z.output<typeof $templateInput>;
export type TTemplateContent = z.output<typeof $templateContent>;
export type TTemplate = z.output<typeof $template>;
export type TTemplateVersion = z.output<typeof $templateVersion>;

export const templateModel = mongodb.db().collection<TTemplate>("templates");
export const templateVersionModel = mongodb.db().collection<TTemplateVersion>(
  "templateVersions",
);
