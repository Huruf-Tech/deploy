import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import {
  $hostCheck,
  $inventory,
  $resourceSummary,
} from "@/schemas/protocol/agent.ts";

/** Cold server document (PLAN §6): agent polls never write it. */
export const $serverUpdate = z.object({
  name: z.string().min(1).max(60).meta({ canFilter: true }),
  labels: z.record(z.string().max(40), z.string().max(80)).default({}).meta({
    description: "Free-form key/value tags, e.g. region=eu, builder=true",
  }),
});

export const $server = $serverUpdate.extend({
  tenant: $objectId.meta({ ref: "tenants" }),
  status: z.enum(["pending", "active", "rejected"]).meta({ canFilter: true }),
  identity: z.object({
    signPublicKey: z.string(),
    boxPublicKey: z.string(),
    fingerprint: z.string(),
  }),
  pairingCode: z.string().optional(),
  pairingExpiresAt: z.date().optional(),
  installMethod: z.enum(["manual", "ssh"]).default("manual").meta({
    canFilter: true,
  }),
  provider: z.object({ kind: z.enum(["byo", "managed"]) }).default({
    kind: "byo",
  }),
  // The dashboard's list filters (the agent protocol schema stays as is).
  inventory: $inventory.extend({
    hostname: $inventory.shape.hostname.meta({ canFilter: true }),
    os: $inventory.shape.os.meta({ canFilter: true }),
    arch: $inventory.shape.arch.meta({ canFilter: true }),
    publicIp: $inventory.shape.publicIp.meta({ canFilter: true }),
    agentVersion: $inventory.shape.agentVersion.meta({ canFilter: true }),
  }),
  resources: $resourceSummary.extend({ reportedAt: z.date() }).optional(),
  /** Host preparation by `docker.ensure` (PLAN §16 Phase 2). */
  setup: z.object({
    status: z.enum(["pending", "ready", "failed"]),
    dockerVersion: z.string().optional(),
    checks: z.array($hostCheck).optional(),
    /** What setup did or left for later, e.g. "Docker settings reloaded". */
    notes: z.array(z.string()).optional(),
    error: z.string().optional(),
    updatedAt: z.date(),
  }).optional(),
  /** Private network membership (PLAN §8.2). */
  mesh: z.object({
    index: z.number().int().min(1),
    enabled: z.boolean().default(true),
    publicKey: z.string().optional(),
    /** host:port override when the public/private IP isn't how peers reach it. */
    endpoint: z.string().optional(),
    /** Reachability from this server: peer id → recent WireGuard handshake. */
    peers: z.record(z.string(), z.boolean()).optional(),
    error: z.string().optional(),
    reportedAt: z.date().optional(),
  }).optional(),
  acceptedBy: $objectId.meta({ ref: "users" }).optional(),
  acceptedAt: z.date().optional(),
  createdAt: z.date().meta({ canFilter: true }),
});

export type TServer = z.output<typeof $server>;

export const serverModel = mongodb.db().collection<TServer>("servers");
