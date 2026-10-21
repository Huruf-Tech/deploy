import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { $streamKind } from "@/schemas/protocol/agent.ts";

/**
 * A live view of data that stays on the agent (PLAN §3.6): logs, metrics,
 * exec output. Ephemeral: removed by TTL, chunks after ~2 minutes.
 */
export const $streamSession = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  server: $objectId.meta({ ref: "servers" }),
  kind: $streamKind,
  params: z.record(z.string(), z.unknown()),
  status: z.enum(["open", "closed"]),
  closedReason: z.string().optional(),
  createdBy: $objectId.meta({ ref: "users" }),
  createdAt: z.date(),
  lastReadAt: z.date(),
  /** Terminals only: last keystroke, for the idle limit (SAFETY_TERMINAL_IDLE_MIN). */
  lastInputAt: z.date().optional(),
  expiresAt: z.date(),
});

export type TStreamSession = z.output<typeof $streamSession>;

export const streamSessionModel = mongodb.db().collection<TStreamSession>(
  "streamSessions",
);

export const $streamChunk = z.object({
  session: $objectId.meta({ ref: "streamSessions" }),
  seq: z.number().int(),
  data: z.string(),
  done: z.boolean().optional(),
  error: z.string().optional(),
  expiresAt: z.date(),
});

export type TStreamChunk = z.output<typeof $streamChunk>;

export const streamChunkModel = mongodb.db().collection<TStreamChunk>(
  "streamChunks",
);

/** Terminal input from the browser, delivered on the agent's next poll (PLAN §3.6). */
export const $streamInput = z.object({
  session: $objectId.meta({ ref: "streamSessions" }),
  /** Agents read input by their own server only; keystrokes can hold passwords. */
  server: $objectId.meta({ ref: "servers" }),
  seq: z.number().int(),
  data: z.string().optional(),
  cols: z.number().int().optional(),
  rows: z.number().int().optional(),
  expiresAt: z.date(),
});

export type TStreamInput = z.output<typeof $streamInput>;

export const streamInputModel = mongodb.db().collection<TStreamInput>(
  "streamInputs",
);
