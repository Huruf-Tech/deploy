import * as React from "react"
import { Link } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import {
  IconAlertTriangle,
  IconBell,
  IconBulb,
  IconRefresh,
  IconServer2,
  IconTrendingUp,
} from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { getLocalPath } from "@/core/lib/utils"
import { Page } from "@/components/page"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCapacity } from "@/hooks/use-capacity"
import {
  classFootprints,
  daysUntil,
  fitsIn,
  growingWorkloads,
  poolDaily,
  roomOf,
  type TCapacityReport,
  type TClassFootprint,
} from "@/lib/capacity"

const MiB = 1024 * 1024

const formatMb = (mb: number) =>
  mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`

const formatDays = (days: number) =>
  days < 14
    ? `~${days} days`
    : days < 90
      ? `~${Math.round(days / 7)} weeks`
      : `~${Math.round(days / 30)} months`

function Meter({
  label,
  total,
  reserved,
  used,
  format,
}: {
  label: string
  total: number
  reserved: number
  used?: number
  format: (n: number) => string
}) {
  const { t } = useTranslation()
  const pct = (n: number) => (total ? Math.min(100, (n / total) * 100) : 0)
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{format(total)}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("Reserved")}</span>
            <span className="tabular-nums">{format(reserved)}</span>
          </div>
          <Progress
            value={pct(reserved)}
            aria-label={t("{{label}} reserved", { label })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("Used (p95, 24 h)")}</span>
            <span className="tabular-nums">
              {used === undefined ? t("unknown") : format(used)}
            </span>
          </div>
          <Progress
            value={pct(used ?? 0)}
            aria-label={t("{{label}} used", { label })}
          />
        </div>
      </CardContent>
    </Card>
  )
}

/** Pool overview (PLAN §7.1, §15.6): combined capacity, fit, trends and advice. */
export default function Overview() {
  const { t } = useTranslation()
  const placementRequest = ThunderSDK.useCaching(
    ["projects", "placement"],
    async ({ signal }) => await ThunderSDK.projects.placementInfo({ signal })
  )
  const projectsRequest = ThunderSDK.useCaching(
    ["projects"],
    async ({ signal }) => await ThunderSDK.projects.list({ signal })
  )
  const alertsRequest = ThunderSDK.useCaching(
    ["alertEvents", "open"],
    async ({ signal }) =>
      await ThunderSDK.alertEvents.list({
        query: { open: "true", limit: 10 },
        signal,
      })
  )
  const { data: servers } = use(placementRequest)
  const { data: projects } = use(projectsRequest)
  const { data: openAlerts } = use(alertsRequest)
  const online = React.useMemo(
    () => (servers ?? []).filter((s) => s.online).map((s) => s.server),
    [servers]
  )
  const capacity = useCapacity(online)
  const results = capacity.data ?? []
  const reports = results.flatMap((r) => ("report" in r ? [r.report] : []))
  const reportOf = (server: string): TCapacityReport | undefined => {
    const r = results.find((x) => x.server === server)
    return r && "report" in r ? r.report : undefined
  }

  if (servers && !servers.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconServer2 />
          </EmptyMedia>
          <EmptyTitle>{t("Your server pool is empty")}</EmptyTitle>
          <EmptyDescription>
            {t(
              "Add a server to start deploying. Capacity and alerts appear here."
            )}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            render={<Link to={getLocalPath("infrastructure/servers")} />}
            nativeButton={false}
          >
            {t("Servers")}
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  // The most used app classes first; footprints from what they use here.
  const classes: TClassFootprint[] = projects
    ? classFootprints(reports, projects)
        .map((c) => ({
          c,
          n: projects.filter(
            (p) => (p.template?._id ?? `project:${p._id}`) === c.key
          ).length,
        }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 3)
        .map(({ c }) => c)
    : []

  const totals = {
    cpu: (servers ?? []).reduce((s, x) => s + x.cpuCores, 0),
    memMb: (servers ?? []).reduce((s, x) => s + x.memoryMb, 0),
    cpuReserved: (servers ?? []).reduce((s, x) => s + x.cpuReserved, 0),
    memReserved: (servers ?? []).reduce((s, x) => s + x.memReservedMb, 0),
    diskMb: reports.reduce((s, r) => s + r.host.diskTotal / MiB, 0),
  }
  const used = reports.length
    ? {
        cpu: reports.reduce((s, r) => s + (r.host.day?.cpuP95 ?? 0), 0),
        memMb: reports.reduce((s, r) => s + (r.host.day?.memP95 ?? 0) / MiB, 0),
        diskMb: reports.reduce(
          (s, r) => s + (r.host.day?.diskPeak ?? 0) / MiB,
          0
        ),
      }
    : undefined

  const fitTable = classes.map((c) => {
    const perServer = reports.map((r) => fitsIn(roomOf(r), c))
    return {
      c,
      pool: perServer.reduce((s, f) => s + f.fits, 0),
      largest: Math.max(0, ...perServer.map((f) => f.fits)),
      cpuOvercommitted: perServer.some((f) => f.cpuOvercommitted),
    }
  })

  // Forecast: pool memory and disk peaks per day, against what can be used.
  const daily = poolDaily(reports)
  const keep = 1 - (reports[0]?.host.headroomPercent ?? 15) / 100
  const memLimit = reports.reduce((s, r) => s + r.host.memTotal * keep, 0)
  const diskLimit = reports.reduce((s, r) => s + r.host.diskTotal * keep, 0)
  const memFull = daysUntil(
    daily.map((d) => d.mem),
    memLimit
  )
  const diskFull = daysUntil(
    daily.map((d) => d.disk),
    diskLimit
  )
  const projectName = (id?: string) => projects?.find((p) => p._id === id)?.name
  const growing = reports.flatMap(growingWorkloads)

  const advice: string[] = []
  const top = fitTable[0]
  if (top && top.pool < 2) {
    const gb = Math.max(2, Math.ceil((6 * top.c.memMb) / keep / 1024))
    advice.push(
      t(
        "Add a server: {{gb}} GB of RAM or more covers your next ~6 apps like {{name}}.",
        {
          gb,
          name: top.c.name,
        }
      )
    )
  }
  const busy = reports.some(
    (r) => (r.host.day?.memP95 ?? 0) / r.host.memTotal > 0.5
  )
  for (const s of servers ?? []) {
    const r = reportOf(s.server)
    const share = r?.host.day ? r.host.day.memP95 / r.host.memTotal : undefined
    if (busy && share !== undefined && share < 0.1) {
      advice.push(
        t("{{name}} is {{pct}}% used; consider placing new projects there.", {
          name: s.name,
          pct: Math.round(share * 100),
        })
      )
    }
  }
  for (const r of reports) {
    for (const w of r.workloads) {
      const p95 = (w.week ?? w.day)?.memP95
      if (
        p95 !== undefined &&
        w.reserve.memMb >= 256 &&
        w.reserve.memMb > (3 * p95) / MiB
      ) {
        advice.push(
          t(
            "{{name}} reserves {{reserved}} per replica but uses {{used}}; lower its reservation.",
            {
              name: projectName(w.project) ?? w.workload,
              reserved: formatMb(w.reserve.memMb),
              used: formatMb(p95 / MiB),
            }
          )
        )
      }
    }
  }

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t("Server pool")}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t(
              "Your servers as one budget. Usage comes from each server when you open this page and stays in your browser."
            )}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => capacity.request.invalidate()}
          disabled={capacity.isLoading}
        >
          <IconRefresh data-icon="inline-start" />
          {t("Refresh")}
        </Button>
      </div>

      {!!openAlerts?.length && (
        <Alert variant="destructive">
          <IconBell />
          <AlertTitle>
            {t("{{count}} open alert(s)", { count: openAlerts.length })}
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc ps-4">
              {openAlerts.slice(0, 5).map((a) => (
                <li key={a._id}>
                  {a.ruleName}
                  {a.serverName && ` · ${a.serverName}`}
                  {a.projectName && ` · ${a.projectName}`}
                </li>
              ))}
            </ul>
            <Link
              to={getLocalPath("monitoring/alertEvents")}
              className="font-medium underline"
            >
              {t("Alert history")}
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {!servers ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Meter
            label={t("CPU")}
            total={totals.cpu}
            reserved={totals.cpuReserved}
            used={used?.cpu}
            format={(n) => t("{{n}} cores", { n: n.toFixed(1) })}
          />
          <Meter
            label={t("Memory")}
            total={totals.memMb}
            reserved={totals.memReserved}
            used={used?.memMb}
            format={formatMb}
          />
          <Meter
            label={t("Disk (servers that answered)")}
            total={totals.diskMb}
            reserved={0}
            used={used?.diskMb}
            format={formatMb}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Room for more")}</CardTitle>
          <CardDescription>
            {t(
              "Per app class, from what its projects use at p95 over the last week (never below their reservation), after {{pct}}% headroom. Memory and disk are hard limits; CPU can be overcommitted.",
              { pct: Math.round((1 - keep) * 100) }
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {capacity.isLoading && !capacity.data ? (
            <Skeleton className="h-20 rounded-2xl" />
          ) : !fitTable.length ? (
            <p className="text-sm text-muted-foreground">
              {t("Deploy a project to see how many more fit.")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {fitTable.map(({ c, pool, largest, cpuOvercommitted }) => (
                <li
                  key={c.key}
                  className="flex flex-wrap items-baseline gap-x-2"
                >
                  <span className="text-lg font-semibold tabular-nums">
                    ≈ {pool}
                  </span>
                  <span>
                    {t("more apps like {{name}}", { name: c.name })}{" "}
                    <span className="text-muted-foreground">
                      ({formatMb(c.memMb)} · {c.cpu.toFixed(2)} CPU{" "}
                      {c.samples ? t("measured") : t("declared")};{" "}
                      {t("largest server fits {{n}}", { n: largest })})
                    </span>
                  </span>
                  {cpuOvercommitted && (
                    <Badge variant="outline">{t("CPU overcommitted")}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Servers")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Server")}</TableHead>
                  <TableHead>{t("Memory used / reserved / total")}</TableHead>
                  <TableHead>{t("Room")}</TableHead>
                  {classes.map((c) => (
                    <TableHead key={c.key}>
                      {t("Fits more {{name}}", { name: c.name })}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(servers ?? []).map((s) => {
                  const r = reportOf(s.server)
                  const failed = results.find(
                    (x) => x.server === s.server && "error" in x
                  )
                  const room = r && roomOf(r)
                  return (
                    <TableRow key={s.server}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      {!r ? (
                        <TableCell
                          colSpan={2 + classes.length}
                          className="text-muted-foreground"
                        >
                          {!s.online
                            ? t(
                                "Offline: capacity unavailable ({{mem}} reserved of {{total}})",
                                {
                                  mem: formatMb(s.memReservedMb),
                                  total: formatMb(s.memoryMb),
                                }
                              )
                            : failed
                              ? t("Capacity unavailable")
                              : t("Asking the server…")}
                        </TableCell>
                      ) : (
                        <>
                          <TableCell className="tabular-nums">
                            {formatMb((r.host.day?.memP95 ?? 0) / MiB)} /{" "}
                            {formatMb(s.memReservedMb)} / {formatMb(s.memoryMb)}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatMb(Math.max(0, room!.memMb))}
                          </TableCell>
                          {classes.map((c) => (
                            <TableCell key={c.key} className="tabular-nums">
                              ≈ {fitsIn(room!, c).fits}
                            </TableCell>
                          ))}
                        </>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconTrendingUp className="size-4" aria-hidden />{" "}
              {t("Growth forecast")}
            </CardTitle>
            <CardDescription>
              {t("A linear trend over daily peaks ({{n}} days so far).", {
                n: daily.length,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {daily.length < 3 ? (
              <p className="text-muted-foreground">
                {t("Forecasts start after three days of history.")}
              </p>
            ) : (
              <>
                <p>
                  {memFull === null
                    ? t("Pool memory isn't growing.")
                    : t("Pool memory full in {{when}}.", {
                        when: formatDays(memFull),
                      })}
                </p>
                <p>
                  {diskFull === null
                    ? t("Pool disk isn't growing.")
                    : t("Pool disk full in {{when}}.", {
                        when: formatDays(diskFull),
                      })}
                </p>
              </>
            )}
            {growing.map((g) => (
              <p
                key={g.workload}
                className="flex items-start gap-2 text-destructive"
              >
                <IconAlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                {t(
                  "{{name}}'s memory grows ~{{mb}} MB a day over {{days}} days: a leak or a growing cache?",
                  {
                    name: projectName(g.project) ?? g.workload,
                    mb: g.mbPerDay.toFixed(0),
                    days: g.days,
                  }
                )}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconBulb className="size-4" aria-hidden /> {t("Recommendations")}
            </CardTitle>
            <CardDescription>
              {t("Advice only; nothing changes on its own.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!advice.length ? (
              <p className="text-sm text-muted-foreground">
                {t("Nothing to suggest right now.")}
              </p>
            ) : (
              <ul className="flex list-disc flex-col gap-1 ps-4 text-sm">
                {advice.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  )
}
