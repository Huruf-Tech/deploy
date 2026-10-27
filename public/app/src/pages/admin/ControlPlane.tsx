import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { IconHeartbeat } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { DataTable } from "@/components/console/data-table"
import { TimeSeries, type TSeries } from "@/components/charts/presets"
import { usePolling } from "@/hooks/use-polling"
import { ControlPlaneRules } from "./ControlPlaneRules"
import {
  ClusterMeters,
  HealthBadge,
  HealthHero,
  InstanceMeters,
} from "./ControlPlaneHealth"
import { findings, num, type TPoint, type TRange } from "./control-plane"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"
import { dateTime } from "@/lib/format"

/** Charts draw at most this many points; older buckets are thinned out. */
const CHART_POINTS = 240

function thin<T>(rows: T[]) {
  const step = Math.ceil(rows.length / CHART_POINTS)
  return step <= 1
    ? rows
    : rows.filter((_, i) => i % step === 0 || i === rows.length - 1)
}

type TKey = Exclude<keyof TPoint, "at">

/**
 * Chart rows: `date` plus every series. A bucket without the figure (no
 * requests, say) carries the previous one forward, as recharts'
 * `connectNulls` drew it.
 */
function toRows(points: TPoint[], keys: TKey[]) {
  const prev: Partial<Record<TKey, number>> = {}
  return thin(points).map((p) => {
    const row: Record<string, unknown> = { date: new Date(p.at) }
    for (const key of keys) {
      const v = p[key]
      if (v != null) prev[key] = v
      row[key] = prev[key] ?? 0
    }
    return row
  })
}

function SeriesChart({
  title,
  data,
  series,
  unit,
}: {
  title: string
  data: TPoint[]
  series: (TSeries & { key: TKey })[]
  unit: string
}) {
  const rows = React.useMemo(
    () =>
      toRows(
        data,
        series.map((s) => s.key)
      ),
    [data, series]
  )
  return (
    <Panel title={title}>
      {rows.length < 2 ? (
        <Skeleton className="aspect-5/2 w-full rounded-lg" />
      ) : (
        <TimeSeries
          data={rows}
          series={series}
          format={(v) => `${num(v)} ${unit}`}
          aspectRatio="5 / 2"
        />
      )}
    </Panel>
  )
}

/**
 * Control plane health (PLAN §20.2): what each instance uses, the request
 * and poll rates it serves, and what to do when a limit is near.
 */

/** What a MongoDB command does, in plain words, for the slow-operations card. */
function describeCommand(command: string, t: (key: string) => string): string {
  const known: Record<string, string> = {
    find: t("Query: finds documents"),
    getMore: t("Next batch of a query's results (an open cursor)"),
    aggregate: t("Aggregation: a query pipeline (e.g. counts, joins, reports)"),
    count: t("Counts documents"),
    distinct: t("Distinct values of a field"),
    insert: t("Inserts documents"),
    update: t("Updates documents"),
    delete: t("Deletes documents"),
    findAndModify: t("Finds and updates a document in one step"),
    createIndexes: t("Creates indexes"),
    bulkWrite: t("Several writes in one batch"),
  }
  return known[command] ?? t("Other database command")
}

export default function ControlPlane() {
  const { t } = useTranslation()
  const [range, setRange] = React.useState<TRange>("1h")
  const { data, isLoading, reload } = useCached(queries.controlPlane(range))
  usePolling(reload, 30_000)

  const o = data
  const list = o ? findings(o, t) : []

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Control plane")}
        status={o && <HealthBadge findings={list} />}
        description={t(
          "Each instance reports once a minute: CPU and memory, the requests and agent polls it serves, and the database."
        )}
        actions={
          <ToggleGroup
            value={range}
            onValueChange={(v) => v && setRange(v as TRange)}
          >
            {(["1h", "24h", "7d"] as const).map((r) => (
              <ToggleGroupItem
                key={r}
                value={r}
                aria-label={r}
                className="h-7 px-2.5 text-xs"
              >
                {r}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      />

      {isLoading && !o ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-[10px]" />
          ))}
        </div>
      ) : !o ? null : (
        <>
          <HealthHero findings={list} />
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">
              {t("The control plane's machine")}
            </h2>
            <InstanceMeters o={o} />
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">
              {t("Agents, traffic and database")}
            </h2>
            <ClusterMeters o={o} />
          </section>

          <div className="grid gap-3 lg:grid-cols-2">
            <SeriesChart
              title={t("Requests per minute")}
              data={o.series}
              unit="/min"
              series={[
                { key: "requestsPerMin", label: t("All requests") },
                { key: "pollsPerMin", label: t("Agent polls") },
              ]}
            />
            <SeriesChart
              title={t("Response time, p95")}
              data={o.series}
              unit="ms"
              series={[
                { key: "p95Ms", label: t("All requests") },
                { key: "pollP95Ms", label: t("Agent polls") },
              ]}
            />
            <SeriesChart
              title={t("CPU, busiest instance (% of a core)")}
              data={o.series}
              unit="%"
              series={[{ key: "cpuPct", label: t("CPU") }]}
            />
            <SeriesChart
              title={t("Memory, largest instance (MB)")}
              data={o.series}
              unit="MB"
              series={[{ key: "rssMb", label: t("Memory") }]}
            />
            <SeriesChart
              title={t("Database operations per minute")}
              data={o.series}
              unit="/min"
              series={[{ key: "dbOpsPerMin", label: t("Operations") }]}
            />
            <SeriesChart
              title={t("Database time, p95")}
              data={o.series}
              unit="ms"
              series={[{ key: "dbP95Ms", label: t("p95") }]}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <section className="flex min-w-0 flex-col gap-2">
              <h2 className="text-sm font-semibold">{t("Busiest routes")}</h2>
              <div className="overflow-x-auto">
                <DataTable
                  label={t("Busiest routes")}
                  rows={o.routes}
                  rowId={(r) => r.route}
                  limit={5}
                  columns={[
                    {
                      id: "route",
                      header: t("Route"),
                      sortValue: (r) => r.route,
                      cell: (r) => (
                        <span dir="ltr" className="font-mono text-xs">
                          {r.route}
                        </span>
                      ),
                    },
                    {
                      id: "count",
                      header: t("Requests"),
                      align: "end",
                      sortValue: (r) => r.count,
                      cell: (r) => num(r.count),
                    },
                    {
                      id: "errors",
                      header: t("Errors"),
                      align: "end",
                      sortValue: (r) => r.errors,
                      cell: (r) => num(r.errors),
                    },
                    {
                      id: "avg",
                      header: t("Avg"),
                      align: "end",
                      sortValue: (r) => r.avgMs,
                      cell: (r) => `${num(r.avgMs)} ms`,
                    },
                    {
                      id: "max",
                      header: t("Max"),
                      align: "end",
                      sortValue: (r) => r.maxMs,
                      cell: (r) => `${num(r.maxMs)} ms`,
                    },
                  ]}
                />
              </div>
            </section>
            <section className="flex min-w-0 flex-col gap-2">
              <h2 className="text-sm font-semibold">
                {t("Slowest database operations")}
              </h2>
              <div className="overflow-x-auto">
                <DataTable
                  label={t("Slowest database operations")}
                  rows={o.slowQueries}
                  limit={5}
                  rowId={(q) => `${q.at}-${q.host}-${q.command}-${q.ms}`}
                  empty={t("No database operation took 100 ms or more.")}
                  columns={[
                    {
                      id: "op",
                      header: t("Operation"),
                      className: "whitespace-normal",
                      cell: (q) => (
                        <div className="min-w-0 text-xs">
                          <span dir="ltr" className="font-mono">
                            {q.command}
                            {q.collection && (
                              <span className="text-muted-foreground">
                                {" "}
                                on {q.collection}
                              </span>
                            )}
                          </span>
                          <span className="block text-muted-foreground">
                            {describeCommand(q.command, t)}
                          </span>
                        </div>
                      ),
                    },
                    {
                      id: "when",
                      header: t("When · instance"),
                      sortValue: (q) => new Date(q.at).getTime(),
                      cell: (q) => (
                        <div className="text-xs text-muted-foreground">
                          <span className="block whitespace-nowrap tabular-nums">
                            {dateTime(q.at, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hourCycle: "h23",
                            })}
                          </span>
                          <span dir="ltr" className="block font-mono">
                            {q.host}
                          </span>
                        </div>
                      ),
                    },
                    {
                      id: "ms",
                      header: t("Time"),
                      align: "end",
                      sortValue: (q) => q.ms,
                      cell: (q) => `${num(q.ms)} ms`,
                    },
                  ]}
                />
              </div>
              {o.slowQueries.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Operations of 100 ms or more in the selected period. Change streams' idle waits aren't counted."
                  )}
                </p>
              )}
            </section>
          </div>

          {ThunderSDK.isPermitted("controlPlane", "rules") && (
            <ControlPlaneRules />
          )}

          <p className="flex gap-2 text-[13px] text-muted-foreground">
            <IconHeartbeat className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {t(
                "A control plane that is down can't report it. Point an uptime monitor at"
              )}{" "}
              <code dir="ltr" className="font-mono text-xs text-foreground">
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
