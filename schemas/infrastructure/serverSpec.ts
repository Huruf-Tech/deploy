import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * The latest desired state per server (PLAN §4.4), computed when something
 * changes and sealed to the agent; the poll path only reads it.
 */
export const $serverSpec = z.object({
  _id: $objectId.meta({ ref: "servers" }),
  tenant: $objectId.meta({ ref: "tenants" }),
  version: z.number().int(),
  sealed: z.string(),
  /** Of the unsealed spec without its version: unchanged specs aren't re-sent. */
  hash: z.string(),
  updatedAt: z.date(),
});

export type TServerSpec = z.output<typeof $serverSpec>;

export const serverSpecModel = mongodb.db().collection<TServerSpec>(
  "serverSpecs",
);

/** External registries (PLAN §8.4): one builder pushes, the other servers pull. */
export const $registry = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  name: z.string().min(1).max(80),
  kind: z.enum(["dockerhub", "generic"]),
  url: z.string().max(300).optional().describe(
    "Generic registries: host, e.g. ghcr.io",
  ),
  namespace: z.string().min(1).max(200).describe(
    "Where images go, e.g. your Docker Hub user or ghcr.io/<org>",
  ),
  username: z.string().min(1).max(200),
  secretEnc: z.string(),
  isDefault: z.boolean().default(false),
  createdBy: $objectId.meta({ ref: "users" }),
  createdAt: z.date(),
});

export type TRegistry = z.output<typeof $registry>;

export const registryModel = mongodb.db().collection<TRegistry>("registries");
