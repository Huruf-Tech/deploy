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
  agentSha256: z.string().max(64).optional().describe(
    "SHA-256 of the running agent binary: compared with the published one for updates",
  ),
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
    waitMs: z.number().int().min(0).optional().describe(
      "Long polling (PLAN Phase 13): how long the control plane may hold a poll that sends `wait`; 0 or absent = don't send it",
    ),
  }),
  jitterPercent: z.number().min(0).max(50),
  summaryIntervalMs: z.number().int(),
  maxBackoffMs: z.number().int(),
  reconcileIntervalMs: z.number().int().describe(
    "How often the agent re-checks its workloads against the desired state (self-healing)",
  ),
  monitorIntervalMs: z.number().int().describe(
    "How often the agent samples usage for alerts, autoscaling and footprints",
  ),
  capacity: z.object({
    headroomPercent: z.number().min(0).max(90).describe(
      "Kept free for the OS, agent and proxy when computing room (PLAN §7.1)",
    ),
    retentionDays: z.number().int().min(7).max(366).describe(
      "Daily peaks kept on the agent",
    ),
  }),
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
  "build.run",
  "server.prune",
  "agent.update",
  "registry.delete",
  "host.cleanup",
]);

/**
 * `registry.delete`, for the server running the built-in registry: these
 * repo:tag images belong to releases that are gone. Their space is freed by
 * garbage collection; a digest another tag still uses is kept.
 */
export const $registryDeletePayload = z.object({
  tags: z.array(z.string().max(300)).min(1).max(500),
});

/**
 * `host.cleanup`: what uninstalling would remove and keep (a dry run), or, with
 * `dryRun: false`, the same plan after scheduling `huruf-deploy-agent uninstall`
 * outside the agent. Project data volumes go only with `purgeData`.
 */
export const $hostCleanupPayload = z.object({
  dryRun: z.boolean(),
  purgeData: z.boolean(),
  /** Step ids to keep although planned, and to remove although kept. */
  keep: z.array(z.string().max(40)).max(50).optional(),
  remove: z.array(z.string().max(40)).max(50).optional(),
});

/** `agent.update`: replace the binary with a verified download, then restart. */
export const $agentUpdatePayload = z.object({
  url: z.string().describe("The binary for this server's architecture"),
  sha256: z.string().length(64),
});

export const $streamKind = z.enum([
  "logs",
  "metrics",
  "exec",
  "terminal",
  "build",
  "capacity",
]);

/** Payloads with secrets travel sealed to the agent's X25519 key (PLAN §4.2). */
export const $sealedPayload = z.object({
  sealed: z.string().describe(
    "lib/agents/sealing.ts format; the agent opens it",
  ),
});

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
  subnet: z.string().optional().describe(
    "The network's subnet, unique in the tenant (e.g. 10.210.3.0/24), so container IPs route over the mesh",
  ),
  meshCidr: z.string().optional().describe(
    "Mesh addresses (e.g. 10.209.0.0/16): trusted as an insecure registry (traffic is WireGuard-encrypted)",
  ),
});

/** One host preflight result, reported by `docker.ensure`. */
export const $hostCheck = z.object({
  name: z.string(),
  ok: z.boolean(),
  detail: z.string(),
});

/** `build.run` (PLAN §9.3), always sealed: it carries the repo token and build variables. */
export const $buildRunPayload = z.object({
  deployment: z.string(),
  project: z.string(),
  release: z.number().int().min(1),
  repo: z.object({
    url: z.string(),
    token: z.string().optional().describe(
      "HTTPS token (GitHub installation token)",
    ),
    sshKey: z.string().optional().describe(
      "Deploy key for generic Git over SSH",
    ),
    ref: z.string().describe("Commit SHA, or a branch the builder resolves"),
  }),
  rootDir: z.string().describe("Build context inside the repo"),
  dockerfile: z.string().optional().describe(
    "Rendered template; otherwise dockerfilePath inside the repo",
  ),
  dockerfilePath: z.string().optional(),
  image: z.string().describe("Local tag to build"),
  labels: z.record(z.string(), z.string()),
  buildEnv: z.record(z.string(), z.string()).describe(
    "Build-stage variables, mounted as the `huruf-env` BuildKit secret (shell `export` lines)",
  ),
  noCache: z.boolean(),
  timeoutSec: z.number().int().min(60),
  gitImage: z.string().describe("Image that runs git, so hosts need no git"),
  push: z.object({
    image: z.string(),
    registry: z.string(),
    username: z.string(),
    password: z.string(),
  }).optional().describe("Registry modes: push the built image here"),
});

export const $registryAuth = z.object({
  registry: z.string(),
  username: z.string(),
  password: z.string(),
});

export const $healthcheck = z.object({
  path: z.string().optional().describe(
    "HTTP GET on the port; any status below 500 counts as up. Without a path, a TCP connect",
  ),
  command: z.string().max(1_000).optional().describe(
    "A shell command run inside the container (compose `healthcheck`); healthy once it passes",
  ),
  timeoutSec: z.number().int().min(5),
});

/** One release of a workload on this server. During a rollout a workload has two. */
export const $workloadRelease = z.object({
  release: z.number().int().min(1),
  image: z.string(),
  routed: z.boolean().describe(
    "Receives traffic (public port and .internal DNS) once healthy",
  ),
  replicas: z.number().int().min(0).max(50),
  env: z.record(z.string(), z.string()),
  files: z.record(z.string(), z.string()).describe(
    "Mounted read-only at /run/secrets/<KEY>, from tmpfs",
  ),
  command: z.array(z.string()).optional(),
  port: z.number().int().min(1).max(65_535).optional(),
  healthcheck: $healthcheck,
  cpus: z.number().positive().optional(),
  memoryMb: z.number().int().positive().optional(),
  volumes: z.array(z.object({
    name: z.string(),
    mountPath: z.string(),
    s3: z.object({
      provider: z.string().describe(
        "rclone's s3-provider, e.g. AWS, Cloudflare, Minio, Other",
      ),
      endpoint: z.string().optional(),
      region: z.string(),
      bucket: z.string(),
      path: z.string(),
      accessKeyId: z.string(),
      secretAccessKey: z.string(),
    }).optional().describe(
      "Mount a bucket folder through the rclone volume plugin instead of a local volume",
    ),
  })),
  pull: $registryAuth.optional().describe(
    "Pull the image from this registry when it isn't local",
  ),
});

/** Agent-local autoscaling (PLAN §10): replicas per server within min..max. */
export const $autoscale = z.object({
  min: z.number().int().min(1).max(50),
  max: z.number().int().min(1).max(50),
  cpuPercent: z.number().int().min(1).max(100).optional().describe(
    "Target average CPU per replica, as a percent of `base.cpu`",
  ),
  memPercent: z.number().int().min(1).max(100).optional().describe(
    "Target average memory per replica, as a percent of `base.memMb`",
  ),
  cooldownSec: z.number().int().min(10),
});

export const $workload = z.object({
  project: z.string(),
  name: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).describe(
    "Container name prefix and status key, unique on the server",
  ),
  dnsNames: z.array(z.string()).describe("e.g. shop.internal"),
  strategy: z.enum(["rolling", "allAtOnce", "stopFirst"]),
  publicPort: z.number().int().min(1).max(65_535).optional(),
  ingress: z.boolean().optional().describe(
    "Served on the ingress listener to requests whose X-Huruf-Project is this project (custom domains, PLAN §14)",
  ),
  releases: z.array($workloadRelease).max(2),
  reserve: z.object({
    cpu: z.number().min(0),
    memMb: z.number().int().min(0),
  }).describe(
    "Reserved per replica; with limits, the base for autoscale targets and the capacity room",
  ),
  base: z.object({ cpu: z.number().positive(), memMb: z.number().positive() })
    .describe("Per-replica limit, else reservation: 100% for usage percents"),
  autoscale: $autoscale.optional(),
});

/** A metric alert rule evaluated on the agent (PLAN §13). */
export const $alertSpec = z.object({
  rule: z.string(),
  metric: z.enum(["cpu", "memory", "disk", "room"]),
  project: z.string().optional().describe(
    "Project rules average its replicas here; server rules use the host",
  ),
  threshold: z.number().describe(
    "Percent for cpu/memory/disk (above fires); MiB of memory room for room (below fires)",
  ),
  forSec: z.number().int().min(0),
});

/** WireGuard peers (PLAN §8.2): mesh address plus container subnet each. */
export const $meshSpec = z.object({
  address: z.string().describe(
    "This server's mesh address with prefix, e.g. 10.209.0.3/16",
  ),
  listenPort: z.number().int(),
  subnet: z.string().describe("This server's container subnet"),
  peers: z.array(z.object({
    server: z.string(),
    publicKey: z.string(),
    endpoint: z.string().optional().describe(
      "host:port; absent when unknown (NAT)",
    ),
    meshIp: z.string(),
    subnet: z.string(),
  })),
});

/** Everything this server should run (PLAN §4.4). Precomputed and sealed when it changes. */
export const $desiredSpec = z.object({
  version: z.number().int().min(1),
  network: z.string(),
  drainMs: z.number().int().min(0).describe(
    "Wait after removing a container from routing, before stopping it",
  ),
  workloads: z.array($workload),
  keepImages: z.array(z.string()).describe(
    "Images of kept releases (local and registry tags), for rollbacks; other images we built are removed",
  ),
  mesh: $meshSpec.optional().describe(
    "The private network (PLAN §8.2); absent means this server isn't in it",
  ),
  alerts: z.array($alertSpec).default([]),
  registry: z.object({
    listen: z.string().describe("Mesh address and port, e.g. 10.209.0.1:5000"),
    username: z.string(),
    password: z.string().describe(
      "Hashed on the server with the edge proxy's `caddy hash-password` (bcrypt)",
    ),
    image: z.string(),
  }).optional().describe(
    "Run the tenant's built-in registry here (primary server)",
  ),
  ingress: z.object({
    user: z.string().describe("This server's id, its tunnel login"),
    token: z.string().describe("Tunnel login token"),
    tunnelPort: z.number().int().min(1).max(65_535).describe(
      "Port the tunnel opens on each control plane instance",
    ),
    servers: z.array(z.string()).min(1).describe(
      "frps addresses (host:port), one per control plane instance",
    ),
    ca: z.string().describe("PEM certificate frps' TLS is checked against"),
    serverName: z.string(),
    image: z.string().describe("frpc image"),
  }).optional().describe(
    "Reverse tunnels from this server's ingress listener to the control plane (PLAN §14); absent means none",
  ),
});

export const $command = z.object({
  seq: z.number().int().min(1),
  type: $commandType,
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const $pollRequest = z.object({
  commandCursor: z.number().int().min(0),
  wait: z.boolean().optional().describe(
    "Hold this poll until there's something for the agent (up to `waitMs`); then `nextPollMs` 0 means poll again now",
  ),
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
  resetCommands: z.boolean().optional().describe(
    "The agent's cursor is ahead of this server's commands (state from an earlier registration): forget received commands and the stored desired state",
  ),
  desired: z.object({
    version: z.number().int(),
    sealed: z.string().describe(
      "The DesiredSpec as JSON, sealed to this agent",
    ),
  }).optional().describe("Only when the version is newer than appliedVersion"),
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

/** Progress of one workload release after a spec was applied (PLAN §10). */
export const $workloadStatusEvent = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("workload.status"),
  data: z.object({
    version: z.number().int().describe("Desired-state version being applied"),
    project: z.string(),
    workload: z.string(),
    release: z.number().int(),
    state: z.enum(["starting", "healthy", "failed"]),
    error: z.string().max(500).optional(),
  }),
});

/** The agent's WireGuard key and which peers it has a recent handshake with. */
export const $meshStatusEvent = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("mesh.status"),
  data: z.object({
    publicKey: z.string().max(64),
    peers: z.record(z.string(), z.boolean()).describe(
      "server -> reachable (a WireGuard handshake in the last 3 minutes)",
    ),
    error: z.string().max(500).optional(),
  }),
});

/** A metric rule started or stopped breaching for its `forSec` (PLAN §13). */
export const $alertEvent = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(["alert.fired", "alert.resolved"]),
  data: z.object({
    rule: z.string(),
    value: z.number(),
    firedAt: z.number().int().describe("Unix ms; identifies the episode"),
  }),
});

/** The agent changed a workload's replicas (PLAN §10). */
export const $autoscaleEvent = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("autoscale.changed"),
  data: z.object({
    project: z.string(),
    workload: z.string(),
    from: z.number().int(),
    to: z.number().int(),
    reason: z.string().max(200),
  }),
});

export const $agentEvent = z.discriminatedUnion("type", [
  $commandResultEvent,
  $streamChunkEvent,
  $workloadStatusEvent,
  $meshStatusEvent,
  $alertEvent,
  $autoscaleEvent,
]);

/** Usage rollup of one workload's replicas (PLAN §7.1); cores and bytes per replica. */
export const $footprint = z.object({
  cpuP95: z.number(),
  cpuPeak: z.number(),
  memP95: z.number().int(),
  memPeak: z.number().int(),
});

/** The `capacity` stream's single chunk: footprints and trends, kept on the agent. */
export const $capacityReport = z.object({
  at: z.number().int(),
  host: z.object({
    cpuCores: z.number().int(),
    memTotal: z.number().int(),
    diskTotal: z.number().int(),
    headroomPercent: z.number(),
    day: $footprint.extend({ diskPeak: z.number().int() }).optional()
      .describe("Host usage over the last 24 h"),
  }),
  workloads: z.array(z.object({
    project: z.string(),
    workload: z.string(),
    replicas: z.number().int(),
    maxReplicas: z.number().int().describe("Autoscale max, else replicas"),
    reserve: z.object({ cpu: z.number(), memMb: z.number().int() }),
    disk: z.number().int().describe("Image plus volumes, bytes"),
    day: $footprint.optional(),
    week: $footprint.optional(),
  })),
  daily: z.array(z.object({
    day: z.string().describe("YYYY-MM-DD, UTC"),
    memPeak: z.number().int(),
    cpuP95: z.number(),
    diskPeak: z.number().int(),
    workloads: z.record(z.string(), z.number().int()).describe(
      "workload -> memory peak per replica",
    ),
  })),
});

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
export type TBuildRunPayload = z.output<typeof $buildRunPayload>;
export type TDesiredSpec = z.output<typeof $desiredSpec>;
export type TWorkload = z.output<typeof $workload>;
export type TWorkloadRelease = z.output<typeof $workloadRelease>;
export type TMeshSpec = z.output<typeof $meshSpec>;
export type TAlertSpec = z.output<typeof $alertSpec>;
export type TCapacityReport = z.output<typeof $capacityReport>;
