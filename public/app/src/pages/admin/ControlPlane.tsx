import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { format } from "date-fns"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconHeartbeat,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { use } from "@/core/hooks/use"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { usePolling } from "@/hooks/use-polling"
import { cn } from "@/lib/utils"

type TRange = "1h" | "24h" | "7d"

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
type TPoint = {
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
type TOverview = {
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
const POLL_BUDGET_MS = 15

const ms = (v: number | null | undefined) =>
  v == null ? "—" : v > 1000 ? "> 1000 ms" : `≤ ${v} ms`
const num = (v: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(v)
const uptime = (s: number) =>
  s < 3600
    ? `${Math.round(s / 60)} min`
    : s < 86400
      ? `${num(s / 3600)} h`
      : `${num(s / 86400)} d`

type TFinding = { level: "warning" | "critical"; text: string }

/** What to act on, from the latest numbers (thresholds for one Deno process). */
function findings(o: TOverview, t: TFunction) {
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
  const pollP95 = o.summary.pollP95Ms
  if (pollP95 != null && pollP95 > POLL_BUDGET_MS)
    list.push({
      level: pollP95 > 100 ? "critical" : "warning",
      text: t(
        "Agent polls take {{ms}} at p95, over the {{budget}} ms budget: check database latency and CPU.",
        { ms: ms(pollP95), budget: POLL_BUDGET_MS }
      ),
    })
  if (o.summary.requests > 100 && o.summary.errors / o.summary.requests > 0.01)
    list.push({
      level: "critical",
      text: t("{{pct}}% of requests failed with a server error.", {
        pct: num((100 * o.summary.errors) / o.summary.requests),
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

function Stat({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-heading text-2xl tabular-nums">{value}</span>
        {detail && (
          <span className="text-xs text-muted-foreground">{detail}</span>
        )}
      </CardContent>
    </Card>
  )
}

function SeriesChart({
  title,
  data,
  config,
  unit,
  stepMs,
}: {
  title: string
  data: TPoint[]
  config: ChartConfig
  unit: string
  stepMs: number
}) {
  const keys = Object.keys(config) as (keyof TPoint)[]
  const tick = stepMs >= 60 * 60_000 ? "MMM d HH:mm" : "HH:mm"
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-48 w-full">
          <LineChart
            data={data.map((p) => ({ ...p, t: new Date(p.at).getTime() }))}
            margin={{ left: 0, right: 8 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => format(v, tick)}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) => num(v)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, items) =>
                    format(items?.[0]?.payload?.t ?? 0, "MMM d, HH:mm")
                  }
                  formatter={(value, name) => (
                    <span className="flex w-full justify-between gap-3">
                      <span className="text-muted-foreground">
                        {config[name as string]?.label}
                      </span>
                      <span className="font-mono tabular-nums">
                        {value == null ? "—" : `${num(Number(value))} ${unit}`}
                      </span>
                    </span>
                  )}
                />
              }
            />
            {keys.length > 1 && (
              <ChartLegend content={<ChartLegendContent />} />
            )}
            {keys.map((key) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

/**
 * Control plane health (PLAN §20.2): what each instance uses, the request
 * and poll rates it serves, and what to do when a limit is near.
 */
export default function ControlPlane() {
  const { t } = useTranslation()
  const [range, setRange] = React.useState<TRange>("1h")
  const request = ThunderSDK.useCaching(
    ["controlPlane", range],
    async ({ signal }) =>
      (await ThunderSDK.controlPlane.overview({
        signal,
        query: { range },
      })) as unknown as TOverview
  )
  const { data, isLoading } = use(request)
  usePolling(() => request.invalidate(), 30_000)

  const o = data
  const list = o ? findings(o, t) : []
  const last = o?.series.at(-2) ?? o?.series.at(-1)

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t("Control plane")}</h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "Each instance reports once a minute: CPU and memory, the requests and agent polls it serves, and the database."
            )}
          </p>
        </div>
        <ToggleGroup
          value={range}
          onValueChange={(v) => v && setRange(v as TRange)}
        >
          {(["1h", "24h", "7d"] as const).map((r) => (
            <ToggleGroupItem key={r} value={r} aria-label={r}>
              {r}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {isLoading && !o ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
      ) : !o ? null : (
        <>
          <section aria-label={t("Health")} className="flex flex-col gap-2">
            {list.length ? (
              list.map((f) => (
                <p
                  key={f.text}
                  className={cn(
                    "flex gap-2 rounded-2xl p-3 text-sm",
                    f.level === "critical"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10"
                  )}
                >
                  <IconAlertTriangle
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      f.level === "warning" && "text-warning"
                    )}
                    aria-hidden
                  />
                  <span>
                    <span className="font-medium">
                      {f.level === "critical" ? t("Critical") : t("Warning")}:
                    </span>{" "}
                    {f.text}
                  </span>
                </p>
              ))
            ) : (
              <p className="flex items-center gap-2 rounded-2xl bg-success/10 p-3 text-sm">
                <IconCircleCheck
                  className="size-4 shrink-0 text-success"
                  aria-hidden
                />
                {t(
                  "Healthy: every instance has headroom and polls are within budget."
                )}
              </p>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={t("Agents online")}
              value={num(o.cluster.onlineAgents)}
              detail={t("of {{n}} active servers", {
                n: num(o.cluster.activeServers),
              })}
            />
            <Stat
              label={t("Agent polls / min")}
              value={last ? num(last.pollsPerMin) : "—"}
              detail={t("about {{n}} expected (idle every {{s}} s)", {
                n: num(o.cluster.expectedPollsPerMin),
                s: num(o.cluster.idlePollMs / 1000),
              })}
            />
            <Stat
              label={t("Poll time, p95")}
              value={ms(o.summary.pollP95Ms)}
              detail={t("budget {{n}} ms, server side", { n: POLL_BUDGET_MS })}
            />
            <Stat
              label={t("Requests / min")}
              value={last ? num(last.requestsPerMin) : "—"}
              detail={t("p95 {{ms}} · {{pct}}% errors", {
                ms: ms(o.summary.p95Ms),
                pct: o.summary.requests
                  ? num((100 * o.summary.errors) / o.summary.requests)
                  : 0,
              })}
            />
            <Stat
              label={t("Instances")}
              value={num(o.instances.length)}
              detail={t("reporting in the last 3 minutes")}
            />
            <Stat
              label={t("Database ping")}
              value={
                o.cluster.db.pingMs == null
                  ? "—"
                  : `${num(o.cluster.db.pingMs)} ms`
              }
              detail={t("from this instance")}
            />
            <Stat
              label={t("Database size")}
              value={
                o.cluster.db.storageMb == null
                  ? "—"
                  : `${num(o.cluster.db.storageMb)} MB`
              }
              detail={
                o.cluster.db.dataMb == null
                  ? undefined
                  : t("{{data}} MB data · {{index}} MB indexes", {
                      data: num(o.cluster.db.dataMb),
                      index: num(o.cluster.db.indexMb ?? 0),
                    })
              }
            />
            <Stat
              label={t("Commands waiting")}
              value={num(o.cluster.pendingCommands)}
              detail={t("for agents to pick up")}
            />
          </div>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-sm">{t("Instances")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Host")}</TableHead>
                    <TableHead className="text-right">
                      {t("CPU (process / host)")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("Memory (process / host)")}
                    </TableHead>
                    <TableHead className="text-right">{t("Load")}</TableHead>
                    <TableHead className="text-right">
                      {t("Requests / min")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("DB connections")}
                    </TableHead>
                    <TableHead className="text-right">{t("Up")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {o.instances.map((i) => (
                    <TableRow key={i.instance}>
                      <TableCell>
                        <span className="font-medium">{i.host}</span>
                        <span className="block font-mono text-xs text-muted-foreground">
                          {i.instance}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(i.process.cpuPct)}%
                        {i.system &&
                          ` / ${num(i.system.cpuPct)}% of ${i.system.cpus}`}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(i.process.rssMb)} MB
                        {i.system &&
                          ` / ${num(i.system.memTotalMb - i.system.memAvailableMb)} of ${num(i.system.memTotalMb)} MB`}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {i.system
                          ? `${num(i.system.load1)} · ${num(i.system.load5)} · ${num(i.system.load15)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(i.requestsPerMin)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {i.dbPoolSize}
                        {i.dbPoolWaitMaxMs >= 1 &&
                          ` · ${t("waited {{ms}} ms", { ms: Math.round(i.dbPoolWaitMaxMs) })}`}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {uptime(i.process.uptimeS)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {o.instances.some((i) => !i.system) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t(
                    "Host figures aren't available on serverless platforms; process figures are."
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <SeriesChart
              title={t("Requests per minute")}
              data={o.series}
              stepMs={o.stepMs}
              unit="/min"
              config={{
                requestsPerMin: {
                  label: t("All requests"),
                  color: "var(--chart-1)",
                },
                pollsPerMin: {
                  label: t("Agent polls"),
                  color: "var(--chart-2)",
                },
              }}
            />
            <SeriesChart
              title={t("Response time, p95")}
              data={o.series}
              stepMs={o.stepMs}
              unit="ms"
              config={{
                p95Ms: { label: t("All requests"), color: "var(--chart-1)" },
                pollP95Ms: { label: t("Agent polls"), color: "var(--chart-2)" },
              }}
            />
            <SeriesChart
              title={t("CPU, busiest instance (% of a core)")}
              data={o.series}
              stepMs={o.stepMs}
              unit="%"
              config={{ cpuPct: { label: t("CPU"), color: "var(--chart-1)" } }}
            />
            <SeriesChart
              title={t("Memory, largest instance (MB)")}
              data={o.series}
              stepMs={o.stepMs}
              unit="MB"
              config={{
                rssMb: { label: t("Memory"), color: "var(--chart-1)" },
              }}
            />
            <SeriesChart
              title={t("Database operations per minute")}
              data={o.series}
              stepMs={o.stepMs}
              unit="/min"
              config={{
                dbOpsPerMin: {
                  label: t("Operations"),
                  color: "var(--chart-1)",
                },
              }}
            />
            <SeriesChart
              title={t("Database time, p95")}
              data={o.series}
              stepMs={o.stepMs}
              unit="ms"
              config={{ dbP95Ms: { label: t("p95"), color: "var(--chart-1)" } }}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm">{t("Busiest routes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Route")}</TableHead>
                      <TableHead className="text-right">
                        {t("Requests")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("Errors")}
                      </TableHead>
                      <TableHead className="text-right">{t("Avg")}</TableHead>
                      <TableHead className="text-right">{t("Max")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {o.routes.map((r) => (
                      <TableRow key={r.route}>
                        <TableCell className="font-mono text-xs">
                          {r.route}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {num(r.count)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {num(r.errors)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {num(r.avgMs)} ms
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {num(r.maxMs)} ms
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm">
                  {t("Slowest database operations")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {o.slowQueries.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Operation")}</TableHead>
                        <TableHead>{t("When")}</TableHead>
                        <TableHead className="text-right">
                          {t("Time")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {o.slowQueries.map((q, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">
                            {q.command}
                            {q.collection && ` ${q.collection}`}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(q.at), "MMM d, HH:mm")} · {q.host}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {num(q.ms)} ms
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("No database operation took 100 ms or more.")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <p className="flex gap-2 text-sm text-muted-foreground">
            <IconHeartbeat className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {t(
                "A control plane that is down can't report it. Point an uptime monitor at"
              )}{" "}
              <code className="font-mono text-foreground">
                /home/api/health
              </code>{" "}
              {t(
                "(503 when the database doesn't answer). Agents keep running your apps while it's down."
              )}
            </span>
          </p>
        </>
      )}
    </Page>
  )
}
