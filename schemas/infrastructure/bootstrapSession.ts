import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { $partitionSize } from "@/schemas/protocol/agent.ts";

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
  /** A partition's agent (PLAN §27): the machine and the partition's name. */
  partition: z.object({
    host: $objectId.meta({ ref: "servers" }),
    name: z.string(),
    /** The server's name in the dashboard. */
    label: z.string().optional(),
    /** What it takes on its machine until the machine reports it. */
    size: $partitionSize.optional(),
    /** The machine's `partition.create`: its result says how creating went. */
    command: $objectId.meta({ ref: "agentCommands" }).optional(),
  }).optional(),
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
