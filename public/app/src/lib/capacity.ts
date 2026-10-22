/**
 * Capacity insights in the browser (PLAN §7.1): agents answer with their
 * footprints and daily peaks; fit, class footprints, forecasts and
 * recommendations are computed here and never stored on our side.
 * Pure functions only (no app imports), so `tests/capacity_test.ts` runs them.
 */

const MiB = 1024 * 1024

export type TFootprint = {
  cpuP95: number
  cpuPeak: number
  memP95: number
  memPeak: number
}

/** Mirrors `$capacityReport` in schemas/protocol/agent.ts. */
export type TCapacityReport = {
  at: number
  host: {
    cpuCores: number
    memTotal: number
    diskTotal: number
    headroomPercent: number
    day?: TFootprint & { diskPeak: number }
  }
  workloads: {
    project: string
    workload: string
    replicas: number
    maxReplicas: number
    reserve: { cpu: number; memMb: number }
    disk: number
    day?: TFootprint
    week?: TFootprint
  }[]
  daily: {
    day: string
    memPeak: number
    cpuP95: number
    diskPeak: number
    workloads: Record<string, number>
  }[]
}

/** What one more replica of a kind of app takes: CPU cores, MiB. */
export type TClassFootprint = {
  key: string
  name: string
  cpu: number
  memMb: number
  diskMb: number
  /** Workloads it was measured from; 0 means declared reservations only. */
  samples: number
}

export type TRoom = { cpu: number; memMb: number; diskMb: number }

/** Room for more apps: capacity − headroom − max(reserved, used at p95). */
export function roomOf(report: TCapacityReport): TRoom {
  const keep = 1 - report.host.headroomPercent / 100
  let cpuReserved = 0
  let memReserved = 0
  for (const w of report.workloads) {
    cpuReserved += w.reserve.cpu * w.maxReplicas
    memReserved += w.reserve.memMb * w.maxReplicas
  }
  const day = report.host.day
  return {
    cpu: report.host.cpuCores * keep - Math.max(cpuReserved, day?.cpuP95 ?? 0),
    memMb:
      (report.host.memTotal / MiB) * keep -
      Math.max(memReserved, (day?.memP95 ?? 0) / MiB),
    diskMb: (report.host.diskTotal / MiB) * keep - (day?.diskPeak ?? 0) / MiB,
  }
}

/**
 * How many more of `fp` fit: memory and disk are hard limits; CPU can be
 * overcommitted, so it's reported separately.
 */
export function fitsIn(room: TRoom, fp: TClassFootprint) {
  const per = (free: number, need: number) =>
    need > 0 ? Math.max(0, Math.floor(free / need)) : Infinity
  const fits = Math.min(per(room.memMb, fp.memMb), per(room.diskMb, fp.diskMb))
  const cpu = per(room.cpu, fp.cpu)
  return {
    fits: Number.isFinite(fits) ? fits : 0,
    cpuOvercommitted: cpu < fits,
  }
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * The typical footprint per app class (template), from what its projects use
 * at p95, never below what each replica reserves (that's what placement takes).
 */
export function classFootprints(
  reports: TCapacityReport[],
  projects: {
    _id: string
    name: string
    template?: { _id: string; name: string }
    runtime: { cpuReserve: number; memReserveMb: number }
  }[]
): TClassFootprint[] {
  const groups = new Map<
    string,
    {
      name: string
      cpu: number[]
      mem: number[]
      disk: number[]
      declared: TClassFootprint
    }
  >()
  for (const p of projects) {
    const key = p.template?._id ?? `project:${p._id}`
    if (!groups.has(key)) {
      groups.set(key, {
        name: p.template?.name ?? p.name,
        cpu: [],
        mem: [],
        disk: [],
        declared: {
          key,
          name: p.template?.name ?? p.name,
          cpu: p.runtime.cpuReserve,
          memMb: p.runtime.memReserveMb,
          diskMb: 0,
          samples: 0,
        },
      })
    }
  }
  for (const report of reports) {
    for (const w of report.workloads) {
      const p = projects.find((x) => x._id === w.project)
      const fp = w.week ?? w.day
      if (!p || !fp) continue
      const g = groups.get(p.template?._id ?? `project:${p._id}`)!
      g.cpu.push(Math.max(fp.cpuP95, w.reserve.cpu))
      g.mem.push(Math.max(fp.memP95 / MiB, w.reserve.memMb))
      g.disk.push(w.disk / MiB)
    }
  }
  return [...groups.values()].map((g) =>
    g.mem.length
      ? {
          key: g.declared.key,
          name: g.name,
          cpu: median(g.cpu),
          memMb: Math.ceil(median(g.mem)),
          diskMb: Math.ceil(median(g.disk)),
          samples: g.mem.length,
        }
      : g.declared
  )
}

/** Least squares over (day index, value); null with fewer than 3 days. */
export function trend(values: number[]) {
  const n = values.length
  if (n < 3) return null
  const xs = values.map((_, i) => i)
  const mx = (n - 1) / 2
  const my = values.reduce((a, b) => a + b, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (values[i] - my)
    sxx += (xs[i] - mx) ** 2
    syy += (values[i] - my) ** 2
  }
  const slope = sxy / sxx
  const r2 = syy === 0 ? 0 : (sxy * sxy) / (sxx * syy)
  return { slope, r2, last: my + slope * (n - 1 - mx) }
}

/** Days until a growing series reaches `limit`; null when it isn't growing. */
export function daysUntil(values: number[], limit: number) {
  const t = trend(values.slice(-30))
  if (!t || t.slope <= 0 || t.r2 < 0.5) return null
  return Math.max(0, Math.round((limit - t.last) / t.slope))
}

/**
 * Workloads whose daily memory peak keeps climbing (a leak or a growing
 * cache): a steady trend of more than 2% of their size a day.
 */
export function growingWorkloads(report: TCapacityReport) {
  const names = new Set(report.daily.flatMap((d) => Object.keys(d.workloads)))
  return [...names].flatMap((workload) => {
    const series = report.daily
      .slice(-14)
      .map((d) => d.workloads[workload])
      .filter((v): v is number => v !== undefined)
    const t = trend(series)
    if (!t || t.r2 < 0.8 || t.slope <= t.last * 0.02) return []
    const project = report.workloads.find(
      (w) => w.workload === workload
    )?.project
    return [{ workload, project, mbPerDay: t.slope / MiB, days: series.length }]
  })
}

/** Pool-wide memory and disk peaks per day (servers that reported that day). */
export function poolDaily(reports: TCapacityReport[]) {
  const days = new Map<string, { mem: number; disk: number }>()
  for (const r of reports) {
    for (const d of r.daily) {
      const day = days.get(d.day) ?? { mem: 0, disk: 0 }
      day.mem += d.memPeak
      day.disk += d.diskPeak
      days.set(d.day, day)
    }
  }
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, ...v }))
}
