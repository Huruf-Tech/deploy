import * as React from "react"
import { Link, useNavigate } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import {
  IconAlertTriangle,
  IconMailExclamation,
  IconPlus,
  IconRefresh,
  IconRocket,
  IconServer2,
} from "@tabler/icons-react"

import { usePolling } from "@/hooks/use-polling"
import { getAuthUrl, getLocalPath } from "@/core/lib/utils"
import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import { ago, mb } from "@/lib/format"
import { queries } from "@/lib/queries"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Stat, StatStrip } from "@/components/console/stat"
import { Meter } from "@/components/console/meter"
import { StatusBadge, StatusDot } from "@/components/console/status"
import { DataTable, type TColumn } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { ControlPlaneSummary } from "@/pages/admin/ControlPlaneSummary"
import { AiPrompt } from "@/pages/projects/AiPrompt"
import { DeploymentStatus } from "@/pages/projects/shared"
import { useCached } from "@/hooks/use-cached"

const MiB = 1024 * 1024

/** "~3 days", "~5 weeks", "~4 months". */
const inDays = (t: TFunction, days: number) =>
  days < 14
    ? t("~{{count}} days", { count: days })
    : days < 90
      ? t("~{{count}} weeks", { count: Math.round(days / 7) })
      : t("~{{count}} months", { count: Math.round(days / 30) })

/** Reserved and used against the pool's total, for one resource. */
function Capacity({
  label,
  hue,
  total,
  reserved,
  used,
  format,
}: {
  label: string
  hue: "sky" | "violet" | "emerald"
  total: number
  reserved?: number
  used?: number
  format: (n: number) => string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {format(total)}
        </span>
      </div>
      {reserved !== undefined && (
        <Meter
          hue={hue}
          label={t("Reserved")}
          value={reserved}
          total={total}
          text={format(reserved)}
          warnAt={0.85}
          critAt={1}
        />
      )}
      <Meter
        hue={hue}
        label={t("Used (p95, 24 h)")}
        value={used ?? 0}
        total={total}
        text={used === undefined ? t("unknown") : format(used)}
      />
    </div>
  )
}

/**
 * Unverified accounts can't add servers (PLAN §20.3). Verification lives in
 * the auth app's account page, so this links there.
 */
function VerifyEmailAlert({ email }: { email: string }) {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] border border-warning/40 bg-warning-soft px-3 py-2 text-[13px] text-warning-foreground"
    >
      <IconMailExclamation className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-[1_1_16rem]">
        <span className="font-medium">{t("Verify your email address")}</span>
        {" · "}
        {t(
          "{{email}} isn't verified yet. Until it is you can't add servers, and alert emails may not reach you.",
          { email }
        )}
      </p>
      <Button
        size="sm"
        variant="outline"
        render={<a href={getAuthUrl("/account?tab=personal").toString()} />}
        nativeButton={false}
      >
        {t("Verify in your account")}
      </Button>
    </div>
  )
}

/** Pool overview (PLAN §7.1, §15.6): combined capacity, fit, trends and advice. */
export default function Overview() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: me } = useCached(queries.me())
  const { data: servers } = useCached(queries.placement())
  const { data: projects } = useCached(queries.projects())
  const { data: openAlerts } = useCached(queries.openAlerts())
  // Cached data shows at once; these refetch every 30 s (not the queries
  // under them, such as each project's).
  const reread = () => {
    for (const q of [
      queries.me(),
      queries.placement(),
      queries.projects(),
      queries.openAlerts(),
    ])
      q.invalidate({ stopPropagation: true })
  }
  usePolling(reread, 30_000)
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
  const verify = me && !me.emailVerified && (
    <VerifyEmailAlert email={me.email} />
  )

  const canAddServer = ThunderSDK.isPermitted("servers", "create")
  const canCreateProject = ThunderSDK.isPermitted("projects", "create")
  const refresh = () => {
    reread()
    capacity.request.invalidate()
  }
  const header = (status?: React.ReactNode) => (
    <PageHeader
      title={t("Overview")}
      status={status}
      description={t(
        "Your servers as one budget. Usage comes from each server when you open this page and stays in your browser."
      )}
      actions={
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={refresh}
            disabled={capacity.isLoading}
            aria-label={t("Refresh")}
          >
            <IconRefresh className={cn(capacity.isLoading && "animate-spin")} />
            <span className="max-sm:hidden">{t("Refresh")}</span>
          </Button>
          {canAddServer && (
            <Button
              size="sm"
              variant="outline"
              render={<Link to={getLocalPath("infrastructure/servers")} />}
              nativeButton={false}
            >
              <IconServer2 data-icon="inline-start" />
              {t("Add a server")}
            </Button>
          )}
          {canCreateProject && (
            <Button
              size="sm"
              render={<Link to={getLocalPath("applications/projects/new")} />}
              nativeButton={false}
            >
              <IconPlus data-icon="inline-start" />
              {t("New project")}
            </Button>
          )}
        </>
      }
    />
  )

  if (servers && !servers.length) {
    return (
      <Page className="flex flex-col gap-4 py-5">
        {header()}
        {verify}
        <EmptyState
          icon={IconServer2}
          title={t("Your server pool is empty")}
          description={t(
            "Add a server to start deploying. Capacity and alerts appear here."
          )}
          action={
            canAddServer && (
              <Button
                size="sm"
                render={<Link to={getLocalPath("infrastructure/servers")} />}
                nativeButton={false}
              >
                <IconPlus data-icon="inline-start" />
                {t("Add a server")}
              </Button>
            )
          }
        />
        {ThunderSDK.isPermitted("controlPlane", "overview") && (
          <ControlPlaneSummary />
        )}
      </Page>
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
        .sort(
          (a, b) =>
            Number(b.c.samples > 0) - Number(a.c.samples > 0) || b.n - a.n
        )
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
      cpuFits: perServer.reduce((s, f) => s + Math.min(f.cpuFits, 10_000), 0),
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
        { gb, name: top.c.name }
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
              reserved: mb(w.reserve.memMb),
              used: mb(p95 / MiB),
            }
          )
        )
      }
    }
  }

  const running = (projects ?? []).filter((p) => p.status === "running").length
  const failing = (projects ?? []).filter((p) => p.status === "failed").length
  const alertCount = openAlerts?.length ?? 0
  const offline = (servers?.length ?? 0) - online.length
  const recent = [...(projects ?? [])]
    .filter((p) => p.lastDeployment)
    .sort((a, b) =>
      b.lastDeployment!.createdAt.localeCompare(a.lastDeployment!.createdAt)
    )
    .slice(0, 6)

  const problems = [
    alertCount && t("{{count}} open alert(s)", { count: alertCount }),
    offline && t("{{n}} server(s) offline", { n: offline }),
    failing && t("{{n}} project(s) failing", { n: failing }),
  ].filter(Boolean)
  const status = !servers ? undefined : problems.length ? (
    <StatusBadge
      tone={alertCount || failing ? "danger" : "warning"}
      label={problems.join(" · ")}
    />
  ) : (
    <StatusBadge tone="success" label={t("All systems normal")} />
  )

  type TServer = NonNullable<typeof servers>[number]
  const serverColumns: TColumn<TServer>[] = [
    {
      id: "name",
      header: t("Server"),
      sortValue: (s) => s.name,
      cell: (s) => (
        <span className="flex items-center gap-2 font-medium">
          <StatusDot state={s.online ? "online" : "offline"} />
          {s.name}
          <span className="sr-only">
            {s.online ? t("online") : t("offline")}
          </span>
        </span>
      ),
    },
    {
      id: "memory",
      header: t("Memory used / reserved / total"),
      className: "min-w-56",
      cell: (s) => {
        const r = reportOf(s.server)
        if (!r) {
          const failed = results.find(
            (x) => x.server === s.server && "error" in x
          )
          return (
            <span className="text-muted-foreground">
              {!s.online
                ? t(
                    "Offline: capacity unavailable ({{mem}} reserved of {{total}})",
                    {
                      mem: mb(s.memReservedMb),
                      total: mb(s.memoryMb),
                    }
                  )
                : failed
                  ? t("Capacity unavailable")
                  : t("Asking the server…")}
            </span>
          )
        }
        const memUsed = (r.host.day?.memP95 ?? 0) / MiB
        return (
          <Meter
            hue="violet"
            label={t("Memory used on {{name}}", { name: s.name })}
            value={memUsed}
            total={s.memoryMb}
            text={`${mb(memUsed)} / ${mb(s.memReservedMb)} / ${mb(s.memoryMb)}`}
          />
        )
      },
    },
    {
      id: "room",
      header: t("Room"),
      align: "end",
      sortValue: (s) => {
        const r = reportOf(s.server)
        return r ? roomOf(r).memMb : -1
      },
      cell: (s) => {
        const r = reportOf(s.server)
        return r ? (
          <span className="font-mono text-xs">
            {mb(Math.max(0, roomOf(r).memMb))}
          </span>
        ) : (
          "—"
        )
      },
    },
    ...classes.map((c): TColumn<TServer> => ({
      id: c.key,
      header: t("Fits more {{name}}", { name: c.name }),
      align: "end",
      cell: (s) => {
        const r = reportOf(s.server)
        return r ? (
          <span className="font-mono text-xs">
            ≈ {fitsIn(roomOf(r), c).fits}
          </span>
        ) : (
          "—"
        )
      },
    })),
  ]

  return (
    <Page className="flex flex-col gap-4 py-5">
      {header(status)}
      {verify}

      <StatStrip>
        <Stat
          label={t("Servers online")}
          value={servers ? `${online.length}/${servers.length}` : "…"}
          hint={
            offline ? t("{{n}} server(s) offline", { n: offline }) : undefined
          }
          to={getLocalPath("infrastructure/servers")}
        />
        <Stat
          label={t("Projects running")}
          value={projects ? running : "…"}
          hint={
            failing ? t("{{n}} project(s) failing", { n: failing }) : undefined
          }
          to={getLocalPath("applications/projects")}
        />
        <Stat
          label={alertCount ? t("Open alerts") : t("No open alerts")}
          value={openAlerts ? alertCount : "…"}
          to={getLocalPath("monitoring/alertEvents")}
          className={cn(alertCount > 0 && "border-destructive/40")}
        />
        <Stat
          label={
            top
              ? t("More apps like {{name}} fit", { name: top.c.name })
              : t("Room for more apps")
          }
          value={top ? `≈ ${top.pool}` : "—"}
        />
      </StatStrip>

      {!!alertCount && (
        <Panel
          title={t("{{count}} open alert(s)", { count: alertCount })}
          actions={
            <Button
              size="sm"
              variant="ghost"
              render={<Link to={getLocalPath("monitoring/alertEvents")} />}
              nativeButton={false}
            >
              {t("Alert history")}
            </Button>
          }
          className="border-destructive/40"
          bodyClassName="p-0"
        >
          <ul className="divide-y text-[13px]">
            {openAlerts!.slice(0, 5).map((a) => (
              <li key={a._id} className="flex items-center gap-2 px-4 py-2">
                <StatusDot tone="danger" />
                <span className="font-medium">{a.ruleName}</span>
                <span className="truncate text-muted-foreground">
                  {[a.serverName, a.projectName].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <AiPrompt servers={servers ?? []} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
          <Panel title={t("Capacity")} description={t("The whole pool")}>
            {!servers ? (
              <Skeleton className="h-24 rounded-lg" />
            ) : (
              <div className="grid gap-6 sm:grid-cols-3">
                <Capacity
                  label={t("CPU")}
                  hue="sky"
                  total={totals.cpu}
                  reserved={totals.cpuReserved}
                  used={used?.cpu}
                  format={(n) => t("{{n}} cores", { n: n.toFixed(1) })}
                />
                <Capacity
                  label={t("Memory")}
                  hue="violet"
                  total={totals.memMb}
                  reserved={totals.memReserved}
                  used={used?.memMb}
                  format={mb}
                />
                <Capacity
                  label={t("Disk")}
                  hue="emerald"
                  total={totals.diskMb}
                  used={used?.diskMb}
                  format={mb}
                />
              </div>
            )}
          </Panel>

          <section
            aria-labelledby="servers-title"
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <h2 id="servers-title" className="text-sm font-semibold">
                {t("Servers")}
              </h2>
              <Link
                to={getLocalPath("infrastructure/servers")}
                className="text-xs text-brand-text hover:underline"
              >
                {t("View all")}
              </Link>
            </div>
            <DataTable
              label={t("Servers")}
              columns={serverColumns}
              rows={servers}
              rowId={(s) => s.server}
              loading={!servers}
              onRowClick={(s) =>
                navigate(getLocalPath(`infrastructure/servers/${s.server}`))
              }
            />
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel
            title={t("Recent deployments")}
            actions={
              <Link
                to={getLocalPath("applications/projects")}
                className="text-xs text-brand-text hover:underline"
              >
                {t("View all")}
              </Link>
            }
            bodyClassName="p-0"
          >
            {!projects ? (
              <Skeleton className="m-4 h-20 rounded-lg" />
            ) : !recent.length ? (
              <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                {t("No deployments yet.")}
              </p>
            ) : (
              <ul className="divide-y">
                {recent.map((p) => (
                  <li key={p._id}>
                    <Link
                      to={getLocalPath(`applications/projects/${p._id}`)}
                      className="flex items-center gap-3 px-4 py-2 text-[13px] hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    >
                      <IconRocket
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {p.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {ago(p.lastDeployment!.createdAt)}
                          {p.lastDeployment!.commit?.message &&
                            ` · ${p.lastDeployment!.commit.message}`}
                        </span>
                      </span>
                      <DeploymentStatus status={p.lastDeployment!.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title={t("Room for more")}
            description={t(
              "Per app class, after {{pct}}% headroom. Memory and disk are hard limits; CPU can be overcommitted.",
              { pct: Math.round((1 - keep) * 100) }
            )}
          >
            {capacity.isLoading && !capacity.data ? (
              <Skeleton className="h-16 rounded-lg" />
            ) : !fitTable.length ? (
              <p className="text-[13px] text-muted-foreground">
                {t("Deploy a project to see how many more fit.")}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {fitTable.map(({ c, pool, largest, cpuFits }) => (
                  <li key={c.key} className="flex items-start gap-3">
                    <span className="w-12 shrink-0 font-mono text-base font-semibold tabular-nums">
                      ≈ {pool}
                    </span>
                    <span className="min-w-0 text-[13px]">
                      {t("more apps like {{name}}", { name: c.name })}
                      <span className="block text-xs text-muted-foreground">
                        {mb(c.memMb)} · {c.cpu.toFixed(2)} CPU ·{" "}
                        {c.samples ? t("measured") : t("declared")} ·{" "}
                        {t("largest server fits {{n}}", { n: largest })}
                        {cpuFits < pool &&
                          ` · ${t("CPU alone allows ≈ {{n}}; more overcommits it.", { n: cpuFits })}`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {ThunderSDK.isPermitted("controlPlane", "overview") && (
        <ControlPlaneSummary />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          title={t("Growth forecast")}
          description={t(
            "A linear trend over daily peaks ({{n}} days so far).",
            { n: daily.length }
          )}
          bodyClassName="flex flex-col gap-2 text-[13px]"
        >
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
                      when: inDays(t, memFull),
                    })}
              </p>
              <p>
                {diskFull === null
                  ? t("Pool disk isn't growing.")
                  : t("Pool disk full in {{when}}.", {
                      when: inDays(t, diskFull),
                    })}
              </p>
            </>
          )}
          {growing.map((g) => (
            <p
              key={g.workload}
              className="flex items-start gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-destructive-foreground"
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
        </Panel>

        <Panel
          title={t("Recommendations")}
          description={t("Advice only; nothing changes on its own.")}
        >
          {!advice.length ? (
            <p className="text-[13px] text-muted-foreground">
              {t("Nothing to suggest right now.")}
            </p>
          ) : (
            <ul className="flex list-disc flex-col gap-1 ps-4 text-[13px]">
              {advice.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </Page>
  )
}
