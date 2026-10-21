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

export const $commandType = z.enum([
  "ping",
  "docker.ensure",
  "stream.open",
  "stream.close",
]);

export const $streamKind = z.enum(["logs", "metrics", "exec", "terminal"]);

/** Browser → terminal: keystrokes, or a resize. Ordered by `seq` per session. */
export const $terminalInput = z.object({
  seq: z.number().int().min(1),
  data: z.string().max(16 * 1024).optional(),
  cols: z.number().int().min(10).max(1_000).optional(),
  rows: z.number().int().min(5).max(500).optional(),
});

/** `stream.open` payload (PLAN §3.6). Output comes back as `stream.chunk` events. */
export const $streamOpenPayload = z.object({
  session: z.string(),
  kind: $streamKind,
  params: z.record(z.string(), z.unknown()),
  maxBytesPerSec: z.number().int().min(1024).describe(
    "Output above this rate is dropped and marked as truncated",
  ),
});

export const $streamClosePayload = z.object({ session: z.string() });

/** One metrics point; `metrics` stream chunks carry a JSON array of these. */
export const $metricsSample = z.object({
  t: z.number().int().describe("Unix time in milliseconds"),
  cpu: z.number().describe("Used fraction, 0..1"),
  memUsed: z.number().int(),
  memTotal: z.number().int(),
  diskUsed: z.number().int(),
  diskTotal: z.number().int(),
  netRx: z.number().describe("Bytes per second"),
  netTx: z.number().describe("Bytes per second"),
  containers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    image: z.string(),
    state: z.string(),
    cpu: z.number().describe("Used fraction of one host, 0..1"),
    mem: z.number().int(),
  })).optional().describe("Live samples only; history points omit it"),
});

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
  streams: z.record(z.string(), z.number().int().min(0)).optional().describe(
    "Open terminals: session -> highest input seq applied. Only sent while one is open",
  ),
});

export const $pollResponse = z.object({
  nextPollMs: z.number().int(),
  /** Refetch `POST /agents/api/config` when this differs from the agent's copy. */
  configVersion: z.string(),
  commands: z.array($command),
  streamInput: z.record(z.string(), z.array($terminalInput)).optional()
    .describe("New terminal input per session, after the cursors in `streams`"),
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

export const $streamChunkEvent = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("stream.chunk"),
  data: z.object({
    session: z.string(),
    seq: z.number().int().min(1),
    data: z.string().max(64 * 1024),
    done: z.boolean().optional().describe("The stream ended (exec finished)"),
    error: z.string().max(500).optional(),
  }),
});

export const $agentEvent = z.discriminatedUnion("type", [
  $commandResultEvent,
  $streamChunkEvent,
]);

export const $eventsRequest = z.object({
  events: z.array($agentEvent).min(1).max(64),
});

export const $eventsResponse = z.object({
  applied: z.number().int(),
  close: z.array(z.string()).describe(
    "Stream sessions nobody is watching any more: stop them",
  ),
});

export type TAgentConfig = z.output<typeof $agentConfig>;
export type TInventory = z.output<typeof $inventory>;
export type THelloRequest = z.input<typeof $helloRequest>;
export type THelloResponse = z.output<typeof $helloResponse>;
export type TPollRequest = z.input<typeof $pollRequest>;
export type TPollResponse = z.output<typeof $pollResponse>;
export type TCommand = z.output<typeof $command>;
export type TAgentEvent = z.output<typeof $agentEvent>;
