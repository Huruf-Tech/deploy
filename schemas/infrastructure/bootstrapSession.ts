import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * One SSH wizard install (PLAN §4.3). SSH credentials are never stored: only
 * the target address, progress, and the hash of the one-time join token.
 */
export const $bootstrapSession = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  createdBy: $objectId.meta({ ref: "users" }),
  host: z.string(),
  port: z.number().int(),
  username: z.string(),
  status: z.enum(["installing", "registered", "failed"]),
  tokenHash: z.string(),
  server: $objectId.meta({ ref: "servers" }).optional(),
  /** A rented partition (PLAN §26): the server it creates is `rented`, named so. */
  rental: z.object({
    host: $objectId.meta({ ref: "servers" }),
    subscription: $objectId.meta({ ref: "subscriptions" }),
    name: z.string(),
  }).optional(),
  steps: z.array(z.object({ at: z.date(), message: z.string() })),
  error: z.string().optional(),
  createdAt: z.date(),
  expiresAt: z.date(),
});

export type TBootstrapSession = z.output<typeof $bootstrapSession>;

export const bootstrapSessionModel = mongodb.db().collection<
  TBootstrapSession
>("bootstrapSessions");
