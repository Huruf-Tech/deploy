import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { IconHeartbeat } from "@tabler/icons-react"

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
import { ControlPlaneRules } from "./ControlPlaneRules"
import { ClusterMeters, HealthHero, InstanceMeters } from "./ControlPlaneHealth"
import {
  findings,
  num,
  type TOverview,
  type TPoint,
  type TRange,
} from "./control-plane"

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
          <HealthHero findings={list} />
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">
              {t("The control plane's machine")}
            </h2>
            <InstanceMeters o={o} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">
              {t("Agents, traffic and database")}
            </h2>
            <ClusterMeters o={o} />
          </section>

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
                        <TableHead>{t("When · instance")}</TableHead>
                        <TableHead className="text-right">
                          {t("Time")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {o.slowQueries.map((q, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs whitespace-normal">
                            <span className="font-mono">
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
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <span className="block whitespace-nowrap">
                              {format(new Date(q.at), "MMM d, HH:mm")}
                            </span>
                            <span className="block font-mono">{q.host}</span>
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
                {o.slowQueries.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t(
                      "Operations of 100 ms or more in the selected period. Change streams' idle waits aren't counted."
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {ThunderSDK.isPermitted("controlPlane", "rules") && (
            <ControlPlaneRules />
          )}

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
