import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import {
  $hostCheck,
  $inventory,
  $partitionSize,
  $resourceSummary,
} from "@/schemas/protocol/agent.ts";

/**
 * A machine's prices (PLAN §30.3), cents per hour (fractions allowed): per
 * vCPU, GB of memory, GB of disk, and the whole machine (Dedicated). A month
 * is 730 hours. Traffic beyond the allowance: cents per GB.
 */
export const $rentPrices = z.object({
  vcpu: z.number().min(0).max(1_000),
  memGb: z.number().min(0).max(1_000),
  diskGb: z.number().min(0).max(100),
  /** 0 or absent: the sum of the parts (saved as absent). */
  whole: z.number().min(0).max(100_000).optional(),
  trafficGb: z.number().int().min(0).max(1_000).default(0),
});

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
  /**
   * PLAN §27: `machine`: where our agent runs as a host, with no projects of
   * its own. `partition`: one of a machine's partitions (`host`), where
   * projects run. `rented`: a partition on one of the platform's machines,
   * paid by `subscription` (§26, §28).
   */
  provider: z.object({
    kind: z.enum(["machine", "partition", "rented"]),
    host: $objectId.meta({ ref: "servers", canFilter: true }).optional(),
    /** The partition's name on its machine (`p` + 11 hex). */
    partition: z.string().optional(),
    /** The machine's UDP port forwarded to its private-network port. */
    meshPort: z.number().int().min(1).max(65_535).optional(),
    // No ref: core resolves refs as modules, and subscriptions have none.
    subscription: $objectId.optional(),
  }).default({ kind: "machine" }),
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
  /** Machines (PLAN §27.3): what host setup (`pool.ensure`) reported. */
  pool: z.object({
    status: z.enum(["pending", "ready", "failed"]),
    /** What partitions may use in all, after the machine's reserve. */
    allocatable: $partitionSize.optional(),
    error: z.string().optional(),
    updatedAt: z.date(),
    /** For rent in the market (PLAN §30.3), set by the machine's owner. */
    rent: z.object({
      enabled: z.boolean(),
      /** Requests start at once, without the owner. */
      autoAccept: z.boolean().default(false),
      prices: $rentPrices,
    }).optional(),
    /** Takes new rentals (false: drains, its rentals stay). */
    accepting: z.boolean().optional(),
    /** What the machine costs its owner a month (cents), for cost vs revenue. */
    monthlyCost: z.number().int().min(0).optional(),
  }).optional(),
  /** The country of its public address (PLAN §30.3), looked up, never typed. */
  region: z.object({
    /** Absent while the lookup fails (tried again monthly). */
    country: z.string().max(2).optional(),
    ip: z.string(),
    at: z.date(),
  }).optional(),
  /** Its reverse tunnel's port on every control plane instance (PLAN §14). */
  tunnelPort: z.number().int().min(1).max(65_535).optional(),
  acceptedBy: $objectId.meta({ ref: "users" }).optional(),
  acceptedAt: z.date().optional(),
  createdAt: z.date().meta({ canFilter: true }),
});

export type TServer = z.output<typeof $server>;

/** The servers that take a plan slot (PLAN §27.2): partitions; machines and rentals don't. */
export const SLOT_SERVERS = {
  status: "active",
  "provider.kind": "partition",
} as const;

export const serverModel = mongodb.db().collection<TServer>("servers");
