import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { $commandType } from "@/schemas/protocol/agent.ts";

export const $agentCommand = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  server: $objectId.meta({ ref: "servers" }),
  seq: z.number().int().min(1),
  type: $commandType,
  payload: z.record(z.string(), z.unknown()),
  status: z.enum(["pending", "delivered", "done", "failed"]),
  result: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  createdBy: $objectId.meta({ ref: "users" }).optional(),
  createdAt: z.date(),
  finishedAt: z.date().optional(),
  expiresAt: z.date(),
});

export type TAgentCommand = z.output<typeof $agentCommand>;

export const agentCommandModel = mongodb.db().collection<TAgentCommand>(
  "agentCommands",
);

/** Idempotency records for agent events (unique per server + id, short TTL). */
export const $agentEventRecord = z.object({
  server: $objectId,
  eventId: z.string(),
  expiresAt: z.date(),
});

export const agentEventModel = mongodb.db().collection<
  z.output<typeof $agentEventRecord>
>("agentEvents");

export const $sweepShard = z.object({
  _id: z.number().int(),
  nextRunAt: z.date(),
});

export const sweepShardModel = mongodb.db().collection<
  z.output<typeof $sweepShard>
>("sweepShards");
