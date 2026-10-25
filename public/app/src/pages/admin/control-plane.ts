import type { TFunction } from "i18next"

/** Shapes and helpers shared by Admin > Control plane and its Overview card. */

export type TRange = "1h" | "24h" | "7d"

type TProcess = {
  rssMb: number
  heapUsedMb: number
  heapTotalMb: number
  cpuPct: number
  uptimeS: number
}
type TSystem = {
  cpus: number
  cpuPct: number
  memTotalMb: number
  memAvailableMb: number
  load1: number
  load5: number
  load15: number
}
export type TPoint = {
  at: string
  requestsPerMin: number
  pollsPerMin: number
  errorsPerMin: number
  dbOpsPerMin: number
  p95Ms: number | null
  pollP95Ms: number | null
  dbP95Ms: number | null
  cpuPct: number
  rssMb: number
  hostCpuPct: number
  hostMemUsedPct: number
}
/** `GET /controlPlane/api/overview` (lib/monitoring/controlPlane.ts). */
export type TOverview = {
  stepMs: number
  instances: {
    instance: string
    host: string
    at: string
    requestsPerMin: number
    process: TProcess
    system?: TSystem
    dbPoolSize: number
    dbPoolWaitMaxMs: number
  }[]
  series: TPoint[]
  summary: {
    requests: number
    errors: number
    polls: number
    p95Ms: number | null
    pollP95Ms: number | null
  }
  routes: {
    route: string
    count: number
    errors: number
    avgMs: number
    maxMs: number
  }[]
  slowQueries: {
    at: string
    host: string
    command: string
    collection?: string
    ms: number
  }[]
  cluster: {
    onlineAgents: number
    activeServers: number
    pendingCommands: number
    idlePollMs: number
    expectedPollsPerMin: number
    db: {
      dataMb?: number
      storageMb?: number
      indexMb?: number
      objects?: number
      pingMs: number | null
    }
  }
}

/** PLAN §20.2: an idle poll's server-side p95 budget. */
export const POLL_BUDGET_MS = 15

export const ms = (v: number | null | undefined) =>
  v == null ? "—" : v > 1000 ? "> 1000 ms" : `≤ ${v} ms`
export const num = (v: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(v)
export const uptime = (s: number) =>
  s < 3600
    ? `${Math.round(s / 60)} min`
    : s < 86400
      ? `${num(s / 3600)} h`
      : `${num(s / 86400)} d`

export type TFinding = { level: "warning" | "critical"; text: string }

/**
 * The last few complete buckets: what the verdict and its bars judge, so an
 * hour-old spike (or a fix just deployed) shows in the charts, not as "now".
 */
export function recent(o: TOverview) {
  const points = o.series.slice(-4, -1) // the newest bucket is still filling
  const polls = points.flatMap((p) =>
    p.pollP95Ms == null ? [] : [p.pollP95Ms]
  )
  const requests = points.reduce((n, p) => n + p.requestsPerMin, 0)
  const errors = points.reduce((n, p) => n + p.errorsPerMin, 0)
  return {
    pollP95Ms: polls.length ? Math.max(...polls) : null,
    requests,
    errorPct: requests ? (100 * errors) / requests : 0,
  }
}

/** What to act on, from the latest numbers (thresholds for one Deno process). */
export function findings(o: TOverview, t: TFunction) {
  const list: TFinding[] = []
  if (!o.instances.length)
    list.push({
      level: "critical",
      text: t("No instance has reported in the last 3 minutes."),
    })
  for (const i of o.instances) {
    // Deno runs JavaScript on one core: near 100% the instance is saturated.
    if (i.process.cpuPct >= 80)
      list.push({
        level: i.process.cpuPct >= 95 ? "critical" : "warning",
        text: t(
          "{{host}} uses {{pct}}% of a CPU core: add an instance (or a server) behind the load balancer.",
          { host: i.host, pct: num(i.process.cpuPct) }
        ),
      })
    if (i.system) {
      const used = 100 * (1 - i.system.memAvailableMb / i.system.memTotalMb)
      if (used >= 85)
        list.push({
          level: used >= 95 ? "critical" : "warning",
          text: t("{{host}} has {{pct}}% of its memory in use.", {
            host: i.host,
            pct: num(used),
          }),
        })
      if (i.system.load5 > i.system.cpus)
        list.push({
          level: "warning",
          text: t(
            "{{host}}'s load ({{load}}) is above its {{cpus}} CPUs: requests wait for CPU.",
            { host: i.host, load: num(i.system.load5), cpus: i.system.cpus }
          ),
        })
    }
    if (i.dbPoolWaitMaxMs >= 100)
      list.push({
        level: "warning",
        text: t(
          "{{host}} waited {{ms}} ms for a database connection: the pool is saturated (add instances, or raise maxPoolSize).",
          { host: i.host, ms: Math.round(i.dbPoolWaitMaxMs) }
        ),
      })
  }
  const now = recent(o)
  const pollP95 = now.pollP95Ms
  if (pollP95 != null && pollP95 > POLL_BUDGET_MS)
    list.push({
      level: pollP95 > 100 ? "critical" : "warning",
      text: t(
        "Agent polls take {{ms}} at p95, over the {{budget}} ms budget: check database latency and CPU.",
        { ms: ms(pollP95), budget: POLL_BUDGET_MS }
      ),
    })
  if (now.requests > 100 && now.errorPct > 1)
    list.push({
      level: "critical",
      text: t("{{pct}}% of requests failed with a server error.", {
        pct: num(now.errorPct),
      }),
    })
  const last = o.series.at(-2) // the newest bucket is still filling
  if (last && o.cluster.expectedPollsPerMin >= 10) {
    const ratio = last.pollsPerMin / o.cluster.expectedPollsPerMin
    if (ratio < 0.5)
      list.push({
        level: "warning",
        text: t(
          "Only {{got}} polls a minute arrive of about {{expected}} expected: agents may be failing to reach the control plane.",
          {
            got: num(last.pollsPerMin),
            expected: num(o.cluster.expectedPollsPerMin),
          }
        ),
      })
  }
  if (o.cluster.pendingCommands > 1000)
    list.push({
      level: "warning",
      text: t("{{n}} commands wait for agents to pick them up.", {
        n: num(o.cluster.pendingCommands),
      }),
    })
  return list
}
