import z from "zod";

/**
 * Agent ↔ control plane protocol (PLAN §3.3, §4). The single source of truth:
 * the control plane validates with these, and agents are generated from them.
 */

export const PROTOCOL_VERSION = 1;

export const AGENT_HEADERS = {
  key: "X-Agent-Key",
  timestamp: "X-Agent-Timestamp",
  signature: "X-Agent-Signature",
  protocol: "X-Agent-Protocol",
} as const;

export const $inventory = z.object({
  hostname: z.string().max(255),
  os: z.string().max(100),
  arch: z.enum(["amd64", "arm64"]),
  cpuCores: z.number().int().min(1),
  memory: z.number().int().min(0).describe("Bytes"),
  disk: z.number().int().min(0).describe("Bytes"),
  publicIp: z.string().max(64).optional(),
  privateIp: z.string().max(64).optional(),
  dockerVersion: z.string().max(50).optional(),
  agentVersion: z.string().max(50),
});

export const $resourceSummary = z.object({
  cpu: z.number().min(0).max(1).describe("Used fraction"),
  memFree: z.number().int().min(0),
  diskFree: z.number().int().min(0),
});

export const $helloRequest = z.object({
  tenant: z.string().regex(/^[a-f0-9]{24}$/),
  signPublicKey: z.string().max(100).describe("Ed25519, raw, base64url"),
  boxPublicKey: z.string().max(100).describe("X25519, raw, base64url"),
  inventory: $inventory,
  joinToken: z.string().max(100).optional().describe(
    "One-time token from the SSH wizard: activates the server without pairing",
  ),
});

export const $serverStatus = z.enum(["pending", "active", "rejected"]);

/**
 * Runtime behaviour decided by the control plane. Agents must not hardcode
 * any of it; the only built-in value is a retry delay for when the control
 * plane itself is unreachable.
 */
export const $agentConfig = z.object({
  poll: z.object({
    idleMs: z.number().int(),
    activeMs: z.number().int(),
    terminalMs: z.number().int(),
  }),
  jitterPercent: z.number().min(0).max(50),
  summaryIntervalMs: z.number().int(),
  maxBackoffMs: z.number().int(),
});

export const $agentConfigResponse = z.object({
  version: z.string(),
  config: $agentConfig,
});

export const $helloResponse = $agentConfigResponse.extend({
  server: z.string(),
  status: $serverStatus,
  pairingCode: z.string().optional(),
  pairingExpiresAt: z.string().optional(),
  nextPollMs: z.number().int(),
});

export const $commandType = z.enum(["ping", "docker.ensure"]);

/** `docker.ensure` payload: host setup values decided by the control plane. */
export const $dockerEnsurePayload = z.object({
  logMaxSize: z.string().describe("Per-container log file size, e.g. 10m"),
  logMaxFile: z.number().int().min(1),
  edgeImage: z.string().describe("Caddy image for the edge proxy"),
  network: z.string().describe("Local Docker network for projects"),
});

/** One host preflight result, reported by `docker.ensure`. */
export const $hostCheck = z.object({
  name: z.string(),
  ok: z.boolean(),
  detail: z.string(),
});

export const $command = z.object({
  seq: z.number().int().min(1),
  type: $commandType,
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const $pollRequest = z.object({
  commandCursor: z.number().int().min(0),
  appliedVersion: z.number().int().min(0).default(0),
  summary: $resourceSummary.optional().describe(
    "Sent at most every 60 s, or on a >10% change",
  ),
});

export const $pollResponse = z.object({
  nextPollMs: z.number().int(),
  /** Refetch `POST /agents/api/config` when this differs from the agent's copy. */
  configVersion: z.string(),
  commands: z.array($command),
});

/** Returned with 403 when the server cannot poll; agents stop on `rejected`. */
export const $pollRefusal = z.object({
  status: z.enum(["pending", "rejected", "unknown"]),
  nextPollMs: z.number().int(),
  configVersion: z.string(),
});

export const $commandResultEvent = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("command.result"),
  data: z.object({
    seq: z.number().int().min(1),
    ok: z.boolean(),
    result: z.record(z.string(), z.unknown()).optional(),
    error: z.string().max(500).optional(),
  }),
});

export const $agentEvent = z.discriminatedUnion("type", [$commandResultEvent]);

export const $eventsRequest = z.object({
  events: z.array($agentEvent).min(1).max(64),
});

export type TAgentConfig = z.output<typeof $agentConfig>;
export type TInventory = z.output<typeof $inventory>;
export type THelloRequest = z.input<typeof $helloRequest>;
export type THelloResponse = z.output<typeof $helloResponse>;
export type TPollRequest = z.input<typeof $pollRequest>;
export type TPollResponse = z.output<typeof $pollResponse>;
export type TCommand = z.output<typeof $command>;
export type TAgentEvent = z.output<typeof $agentEvent>;
