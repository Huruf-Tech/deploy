import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

export const $variableScope = z.enum(["global", "tenant", "project"]);

const $isSecret = z.boolean();
/** `file` is mounted read-only at /run/secrets/<KEY>. */
const $kind = z.enum(["env", "file"]);
const $stage = z.enum(["build", "runtime", "both"]);
const $description = z.string().max(500);

/** What a user may set on a variable; the value itself is only ever stored encrypted. */
export const $variableSettings = z.object({
  isSecret: $isSecret.default(false),
  kind: $kind.default("env"),
  stage: $stage.default("runtime"),
  description: $description.optional(),
});

/** The same settings for a PATCH: no defaults, so unsent fields stay as they are. */
export const $variableSettingsUpdate = z.object({
  isSecret: $isSecret,
  kind: $kind,
  stage: $stage,
  description: $description,
}).partial();

export const $variableKey = z.string().min(1).max(128).regex(
  /^[A-Za-z_][A-Za-z0-9_]*$/,
  "Letters, digits and underscores; must not start with a digit",
);

/** 64 KiB: room for certificates and small config files. */
export const $variableValue = z.string().max(65_536);

export const $variable = $variableSettings.extend({
  scope: $variableScope,
  /** Owner of a global variable. */
  user: $objectId.meta({ ref: "users" }).optional(),
  tenant: $objectId.meta({ ref: "tenants" }).optional(),
  project: $objectId.meta({ ref: "projects" }).optional(),
  key: $variableKey,
  /** AES-256-GCM, bound to the owner and this document's _id (PLAN §12). */
  valueEnc: z.string(),
  version: z.number().int(),
  updatedBy: $objectId.meta({ ref: "users" }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TVariable = z.output<typeof $variable>;

export const variableModel = mongodb.db().collection<TVariable>("variables");
