import os from "node:os";
import process from "node:process";
import { Logger } from "@/core/utils/logger.ts";
import { mongodb } from "@/database.ts";
import { getAgentConfig } from "@/lib/agents/config.ts";
import {
  controlPlaneSampleModel,
  LATENCY_BUCKETS,
  type TControlPlaneSample,
} from "@/schemas/monitoring/controlPlane.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import {
  evaluateControlPlane,
  instanceLabel,
} from "@/lib/monitoring/controlPlaneAlerts.ts";

/**
 * Control plane metrics: each instance counts its requests and database
 * operations in memory and writes one sample a minute (no background job: the
 * write rides on a request). Admins read them to know when to scale.
 */

const WINDOW_MS = 60_000;
const RETENTION_MS = 8 * 24 * 60 * 60_000;
const SLOW_MS = 100;
const MAX_SLOW = 10;
// Driver chatter, not the application's queries.
const IGNORED = new Set([
  "hello",
  "isMaster",
  "ismaster",
  "ping",
  "endSessions",
  "saslStart",
  "saslContinue",
]);

export const INSTANCE = crypto.randomUUID().slice(0, 8);
const HOST = (() => {
  try {
    return Deno.hostname();
  } catch {
    return "unknown";
  }
})();
const STARTED = Date.now();

type TRoute = { count: number; errors: number; totalMs: number; maxMs: number };

const histogram = () => new Array(LATENCY_BUCKETS.length + 1).fill(0);
const bucket = (ms: number) => {
  const i = LATENCY_BUCKETS.findIndex((b) => ms <= b);
  return i < 0 ? LATENCY_BUCKETS.length : i;
};

const fresh = () => ({
  start: Date.now(),
  requests: 0,
  errors: 0,
  latency: histogram(),
  polls: 0,
  pollLatency: histogram(),
  routes: new Map<string, TRoute>(),
  db: {
    ops: 0,
    failed: 0,
    totalMs: 0,
    latency: histogram(),
    poolCheckouts: 0,
    poolWaitMaxMs: 0,
    slow: [] as { command: string; collection?: string; ms: number }[],
  },
});

let window = fresh();
let poolSize = 0;
let cpu = {
  at: performance.now(),
  usage: process.cpuUsage(),
  host: hostTimes(),
};

/** Called for every request by the metrics hook, after the response. */
export function recordRequest(route: string, status: number, ms: number) {
  const w = window;
  w.requests++;
  w.latency[bucket(ms)]++;
  if (status >= 500) w.errors++;
  if (route === "agents.poll") {
    w.polls++;
    w.pollLatency[bucket(ms)]++;
  }
  // Routes are a fixed set (router.handler names), so this map stays small.
  const r = w.routes.get(route) ??
    { count: 0, errors: 0, totalMs: 0, maxMs: 0 };
  r.count++;
  r.totalMs += ms;
  r.maxMs = Math.max(r.maxMs, ms);
  if (status >= 500) r.errors++;
  w.routes.set(route, r);
  if (Date.now() - w.start >= WINDOW_MS) flush();
}

// Command monitoring has to be on before the first connection; this module
// loads with the hooks, before any request.
// The setter exists at runtime; the typings leave it out.
(mongodb as unknown as { monitorCommands: boolean }).monitorCommands = true;
const collections = new Map<number, string>();
/** Change streams' getMores: held by MongoDB up to ~1 s when idle, by design. */
const waits = new Set<number>();
mongodb.on("commandStarted", (e) => {
  if (IGNORED.has(e.commandName)) return;
  if (collections.size > 5_000) collections.clear(); // never-finished commands
  if (waits.size > 5_000) waits.clear();
  // getMore names its cursor first; the collection is a field of its own.
  const target = e.commandName === "getMore"
    ? e.command?.collection
    : e.command?.[e.commandName];
  // A database-wide change stream (long polling's wakes, PLAN Phase 13) reads
  // from `$cmd.aggregate`: its getMores wait, they don't work.
  if (e.commandName === "getMore" && target === "$cmd.aggregate") {
    waits.add(e.requestId);
    return;
  }
  if (typeof target === "string") collections.set(e.requestId, target);
});
const finished = (
  e: { requestId: number; commandName: string; duration: number },
  ok: boolean,
) => {
  if (IGNORED.has(e.commandName) || waits.delete(e.requestId)) return;
  const collection = collections.get(e.requestId);
  collections.delete(e.requestId);
  const db = window.db;
  db.ops++;
  if (!ok) db.failed++;
  db.totalMs += e.duration;
  db.latency[bucket(e.duration)]++;
  if (e.duration >= SLOW_MS) {
    db.slow.push({
      command: e.commandName,
      collection,
      ms: Math.round(e.duration),
    });
    db.slow.sort((a, b) => b.ms - a.ms);
    db.slow.length = Math.min(db.slow.length, MAX_SLOW);
  }
};
mongodb.on("commandSucceeded", (e) => finished(e, true));
mongodb.on("commandFailed", (e) => finished(e, false));
mongodb.on("connectionCheckedOut", (e) => {
  window.db.poolCheckouts++;
  const wait = (e as { durationMS?: number }).durationMS ?? 0;
  window.db.poolWaitMaxMs = Math.max(window.db.poolWaitMaxMs, wait);
});
mongodb.on("connectionCreated", () => poolSize++);
mongodb.on("connectionClosed", () => poolSize = Math.max(0, poolSize - 1));

function hostTimes() {
  let idle = 0, total = 0;
  for (const c of os.cpus()) {
    const t = c.times;
    idle += t.idle;
    total += t.user + t.nice + t.sys + t.idle + t.irq;
  }
  return { idle, total };
}

const mb = (bytes: number) => Math.round(bytes / 1_048_576);

function resources(): Pick<TControlPlaneSample, "process" | "system"> {
  const now = performance.now();
  const usage = process.cpuUsage();
  const host = hostTimes();
  const elapsedUs = (now - cpu.at) * 1_000;
  const used = usage.user - cpu.usage.user + usage.system - cpu.usage.system;
  const hostTotal = host.total - cpu.host.total;
  const hostIdle = host.idle - cpu.host.idle;
  cpu = { at: now, usage, host };

  const memory = Deno.memoryUsage();
  let system: TControlPlaneSample["system"];
  try {
    const info = Deno.systemMemoryInfo();
    const [load1, load5, load15] = Deno.loadavg();
    system = {
      cpus: os.cpus().length,
      cpuPct: hostTotal > 0 ? round(100 * (1 - hostIdle / hostTotal)) : 0,
      memTotalMb: mb(info.total),
      // Windows reports no `available`; `free` is the closest there.
      memAvailableMb: mb(info.available || info.free),
      load1: round(load1),
      load5: round(load5),
      load15: round(load15),
    };
  } catch {
    system = undefined; // not exposed here (e.g. serverless)
  }
  return {
    process: {
      rssMb: mb(memory.rss),
      heapUsedMb: mb(memory.heapUsed),
      heapTotalMb: mb(memory.heapTotal),
      // Of one core: 200 means two cores busy.
      cpuPct: elapsedUs > 0 ? round((100 * used) / elapsedUs) : 0,
      uptimeS: Math.round((Date.now() - STARTED) / 1_000),
    },
    system,
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Writes this instance's window and starts the next. Never throws. */
export function flush() {
  const w = window;
  window = fresh();
  const now = Date.now();
  const sample: TControlPlaneSample = {
    instance: INSTANCE,
    host: HOST,
    at: new Date(w.start),
    windowS: Math.round((now - w.start) / 1_000),
    requests: w.requests,
    errors: w.errors,
    latency: w.latency,
    polls: w.polls,
    pollLatency: w.pollLatency,
    routes: [...w.routes].map(([route, r]) => ({
      route,
      ...r,
      totalMs: Math.round(r.totalMs),
      maxMs: Math.round(r.maxMs),
    })),
    db: { ...w.db, totalMs: Math.round(w.db.totalMs), poolSize },
    ...resources(),
    expiresAt: new Date(now + RETENTION_MS),
  };
  return controlPlaneSampleModel.insertOne(sample)
    .then(() => evaluateControlPlane(INSTANCE, instanceLabel(HOST, INSTANCE)))
    .catch((error) =>
      Logger.error(
        "Control plane metrics: a sample or its alerts failed",
        error,
      )
    );
}

/**
 * The smallest bucket bound that covers p of the counts. Slower than the last
 * bound reads as twice it (JSON has no Infinity); the page shows "> 1000 ms".
 */
export function percentile(hist: number[], p: number) {
  const total = hist.reduce((a, b) => a + b, 0);
  if (!total) return null;
  const overflow = LATENCY_BUCKETS[LATENCY_BUCKETS.length - 1] * 2;
  let seen = 0;
  for (const [i, n] of hist.entries()) {
    seen += n;
    if (seen >= total * p) return LATENCY_BUCKETS[i] ?? overflow;
  }
  return overflow;
}

const addInto = (into: number[], from: number[]) =>
  from.forEach((n, i) => (into[i] = (into[i] ?? 0) + n));

const RANGES = {
  "1h": [60 * 60_000, 60_000],
  "24h": [24 * 60 * 60_000, 15 * 60_000],
  "7d": [7 * 24 * 60 * 60_000, 2 * 60 * 60_000],
} as const;
export type TRange = keyof typeof RANGES;

/** Everything the admin page shows, for one time range. */
export async function controlPlaneOverview(range: TRange) {
  const [spanMs, stepMs] = RANGES[range];
  const now = Date.now();
  const since = new Date(now - spanMs);

  const [samples, routes, slow, cluster] = await Promise.all([
    controlPlaneSampleModel.find({ at: { $gte: since } }, {
      projection: { routes: 0, "db.slow": 0 },
      sort: { at: 1 },
      limit: 50_000,
    }).toArray(),
    controlPlaneSampleModel.aggregate<
      {
        _id: string;
        count: number;
        errors: number;
        totalMs: number;
        maxMs: number;
      }
    >([
      { $match: { at: { $gte: since } } },
      { $unwind: "$routes" },
      {
        $group: {
          _id: "$routes.route",
          count: { $sum: "$routes.count" },
          errors: { $sum: "$routes.errors" },
          totalMs: { $sum: "$routes.totalMs" },
          maxMs: { $max: "$routes.maxMs" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 40 },
    ]).toArray(),
    controlPlaneSampleModel.aggregate<
      {
        at: Date;
        host: string;
        command: string;
        collection?: string;
        ms: number;
      }
    >([
      { $match: { at: { $gte: since }, "db.slow.0": { $exists: true } } },
      { $unwind: "$db.slow" },
      // Samples from before change-stream waits were left out recorded them
      // as getMore without a collection.
      {
        $match: {
          $or: [
            { "db.slow.command": { $ne: "getMore" } },
            { "db.slow.collection": { $exists: true } },
          ],
        },
      },
      { $sort: { "db.slow.ms": -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          at: 1,
          host: 1,
          command: "$db.slow.command",
          collection: "$db.slow.collection",
          ms: "$db.slow.ms",
        },
      },
    ]).toArray(),
    clusterState(),
  ]);

  const buckets = new Map<number, {
    requests: number;
    errors: number;
    polls: number;
    dbOps: number;
    dbFailed: number;
    latency: number[];
    pollLatency: number[];
    dbLatency: number[];
    cpuPct: number;
    rssMb: number;
    hostCpuPct: number;
    hostMemUsedPct: number;
    minutes: number;
  }>();
  const latest = new Map<string, TControlPlaneSample>();
  for (const s of samples) {
    const key = Math.floor(s.at.getTime() / stepMs) * stepMs;
    const b = buckets.get(key) ?? {
      requests: 0,
      errors: 0,
      polls: 0,
      dbOps: 0,
      dbFailed: 0,
      latency: [],
      pollLatency: [],
      dbLatency: [],
      cpuPct: 0,
      rssMb: 0,
      hostCpuPct: 0,
      hostMemUsedPct: 0,
      minutes: 0,
    };
    b.requests += s.requests;
    b.errors += s.errors;
    b.polls += s.polls;
    b.dbOps += s.db.ops;
    b.dbFailed += s.db.failed;
    b.minutes += s.windowS / 60;
    addInto(b.latency, s.latency);
    addInto(b.pollLatency, s.pollLatency);
    addInto(b.dbLatency, s.db.latency);
    b.cpuPct = Math.max(b.cpuPct, s.process.cpuPct);
    b.rssMb = Math.max(b.rssMb, s.process.rssMb);
    if (s.system) {
      b.hostCpuPct = Math.max(b.hostCpuPct, s.system.cpuPct);
      b.hostMemUsedPct = Math.max(
        b.hostMemUsedPct,
        round(100 * (1 - s.system.memAvailableMb / s.system.memTotalMb)),
      );
    }
    buckets.set(key, b);
    latest.set(s.instance, s as TControlPlaneSample);
  }

  // Per minute across all instances: samples cover ~1 minute each.
  const perMinute = (n: number) => round(n / (stepMs / 60_000));
  const series = [...buckets].map(([at, b]) => ({
    at: new Date(at),
    requestsPerMin: perMinute(b.requests),
    pollsPerMin: perMinute(b.polls),
    errorsPerMin: perMinute(b.errors),
    dbOpsPerMin: perMinute(b.dbOps),
    p95Ms: percentile(b.latency, 0.95),
    pollP95Ms: percentile(b.pollLatency, 0.95),
    dbP95Ms: percentile(b.dbLatency, 0.95),
    cpuPct: b.cpuPct,
    rssMb: b.rssMb,
    hostCpuPct: b.hostCpuPct,
    hostMemUsedPct: b.hostMemUsedPct,
  }));

  const totals = {
    latency: [] as number[],
    pollLatency: [] as number[],
    requests: 0,
    errors: 0,
    polls: 0,
  };
  for (const b of buckets.values()) {
    addInto(totals.latency, b.latency);
    addInto(totals.pollLatency, b.pollLatency);
    totals.requests += b.requests;
    totals.errors += b.errors;
    totals.polls += b.polls;
  }

  // An instance that wrote within ~3 minutes is alive.
  const instances = [...latest.values()]
    .filter((s) => now - s.at.getTime() < 3 * WINDOW_MS)
    .map((s) => ({
      instance: s.instance,
      host: s.host,
      at: s.at,
      requestsPerMin: round(s.requests / Math.max(1, s.windowS / 60)),
      process: s.process,
      system: s.system,
      dbPoolSize: s.db.poolSize,
      dbPoolWaitMaxMs: s.db.poolWaitMaxMs,
    }));

  return {
    range,
    stepMs,
    instances,
    series,
    summary: {
      requests: totals.requests,
      errors: totals.errors,
      polls: totals.polls,
      p95Ms: percentile(totals.latency, 0.95),
      pollP95Ms: percentile(totals.pollLatency, 0.95),
    },
    routes: routes.map((r) => ({
      route: r._id,
      count: r.count,
      errors: r.errors,
      avgMs: r.count ? round(r.totalMs / r.count) : 0,
      maxMs: r.maxMs,
    })),
    slowQueries: slow,
    cluster,
  };
}

/** Load the control plane carries now: agents, their poll rate, the database. */
async function clusterState() {
  const now = new Date();
  const [online, servers, pending, config, dbStats, pingMs] = await Promise.all(
    [
      serverLeaseModel.countDocuments({ aliveUntil: { $gt: now } }),
      serverModel.countDocuments({ status: "active" }),
      agentCommandModel.countDocuments({ status: "pending" }, {
        limit: 100_000,
      }),
      getAgentConfig(),
      mongodb.db().stats().catch(() => null),
      (async () => {
        const t = performance.now();
        await mongodb.db().command({ ping: 1 });
        return round(performance.now() - t);
      })().catch(() => null),
    ],
  );
  return {
    onlineAgents: online,
    activeServers: servers,
    pendingCommands: pending,
    // The slowest pace an idle agent keeps: a held poll (long polling, PLAN
    // Phase 13) lasts up to waitMs, older agents poll every idleMs. Busier
    // agents poll faster, so this is the floor.
    idlePollMs: Math.max(
      config.config.poll.idleMs,
      config.config.poll.waitMs ?? 0,
    ),
    expectedPollsPerMin: round(
      online *
        (60_000 /
          Math.max(config.config.poll.idleMs, config.config.poll.waitMs ?? 0)),
    ),
    db: dbStats
      ? {
        dataMb: mb(dbStats.dataSize),
        storageMb: mb(dbStats.storageSize),
        indexMb: mb(dbStats.indexSize),
        objects: dbStats.objects,
        pingMs,
      }
      : { pingMs },
  };
}
