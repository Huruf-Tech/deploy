import * as React from "react"
import { Link } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import {
  IconAlertTriangle,
  IconBell,
  IconBellPlus,
  IconBraces,
  IconBulb,
  IconCpu,
  IconDatabase,
  IconMailExclamation,
  IconNetwork,
  IconPlus,
  IconRefresh,
  IconRocket,
  IconServer2,
  IconServerBolt,
  IconStack2,
  IconTemplate,
  IconTrendingUp,
} from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { usePolling } from "@/hooks/use-polling"
import { getAuthUrl, getLocalPath } from "@/core/lib/utils"
import { Page } from "@/components/page"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { cn } from "@/lib/utils"
import { ControlPlaneSummary } from "@/pages/admin/ControlPlaneSummary"
import { AiPrompt } from "@/pages/projects/AiPrompt"

const MiB = 1024 * 1024

const formatMb = (mb: number) =>
  mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`

const formatDays = (days: number) =>
  days < 14
    ? `~${days} days`
    : days < 90
      ? `~${Math.round(days / 7)} weeks`
      : `~${Math.round(days / 30)} months`

/** One hue per thing it identifies (a resource, an action), never per rank. */
const HUES = {
  sky: {
    chip: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    bar: "bg-sky-500",
    soft: "bg-sky-500/35",
    ring: "hover:border-sky-500/50",
  },
  violet: {
    chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    bar: "bg-violet-500",
    soft: "bg-violet-500/35",
    ring: "hover:border-violet-500/50",
  },
  emerald: {
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    bar: "bg-emerald-500",
    soft: "bg-emerald-500/35",
    ring: "hover:border-emerald-500/50",
  },
  amber: {
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    bar: "bg-amber-500",
    soft: "bg-amber-500/35",
    ring: "hover:border-amber-500/50",
  },
  rose: {
    chip: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    bar: "bg-rose-500",
    soft: "bg-rose-500/35",
    ring: "hover:border-rose-500/50",
  },
  orange: {
    chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    bar: "bg-orange-500",
    soft: "bg-orange-500/35",
    ring: "hover:border-orange-500/50",
  },
} as const
type THue = keyof typeof HUES

function IconChip({
  hue,
  icon: Icon,
  className,
}: {
  hue: THue
  icon: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl",
        HUES[hue].chip,
        className
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}

/** A labelled bar; its fill wears the resource's hue, the text stays in ink. */
function Bar({
  label,
  value,
  total,
  text,
  fill,
}: {
  label: string
  value: number
  total: number
  text: string
  fill: string
}) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{text}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={Math.round(total * 100) / 100}
        aria-valuenow={Math.round(value * 100) / 100}
        aria-valuetext={text}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width]", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function Meter({
  label,
  icon,
  hue,
  total,
  reserved,
  used,
  format,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  hue: THue
  total: number
  reserved?: number
  used?: number
  format: (n: number) => string
}) {
  const { t } = useTranslation()
  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <IconChip hue={hue} icon={icon} />
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {format(total)}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {reserved !== undefined && (
          <Bar
            label={t("{{label}} reserved", { label })}
            value={reserved}
            total={total}
            text={format(reserved)}
            fill={HUES[hue].soft}
          />
        )}
        <Bar
          label={t("{{label}} used (p95, 24 h)", { label })}
          value={used ?? 0}
          total={total}
          text={used === undefined ? t("unknown") : format(used)}
          fill={HUES[hue].bar}
        />
      </CardContent>
    </Card>
  )
}

function Stat({
  hue,
  icon,
  label,
  value,
  to,
}: {
  hue: THue
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  to?: string
}) {
  const body = (
    <>
      <IconChip hue={hue} icon={icon} />
      <span className="min-w-0">
        <span className="block text-xl leading-tight font-semibold tabular-nums">
          {value}
        </span>
        <span className="block text-xs leading-snug text-muted-foreground">
          {label}
        </span>
      </span>
    </>
  )
  const className =
    "flex items-center gap-3 rounded-2xl border bg-background/70 p-3 backdrop-blur"
  return to ? (
    <Link
      to={to}
      className={cn(
        className,
        "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        HUES[hue].ring
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

/** Shortcuts to what people do most; each shown only with the permission for it. */
function QuickActions() {
  const { t } = useTranslation()
  const actions: {
    hue: THue
    icon: React.ComponentType<{ className?: string }>
    label: string
    hint: string
    to: string
    allowed: boolean
  }[] = [
    {
      hue: "orange",
      icon: IconRocket,
      label: t("New project"),
      hint: t("Deploy from GitHub, an image or a template"),
      to: "applications/projects/new",
      allowed: ThunderSDK.isPermitted("projects", "create"),
    },
    {
      hue: "sky",
      icon: IconServerBolt,
      label: t("Add a server"),
      hint: t("Install the agent over SSH"),
      to: "infrastructure/servers",
      allowed: ThunderSDK.isPermitted("servers", "create"),
    },
    {
      hue: "rose",
      icon: IconBellPlus,
      label: t("Alert rules"),
      hint: t("Email, Slack or webhook"),
      to: "monitoring/alertRules",
      allowed: ThunderSDK.isPermitted("alertRules", "list"),
    },
    {
      hue: "violet",
      icon: IconBraces,
      label: t("Variables"),
      hint: t("Secrets and settings"),
      to: "configuration/variables",
      allowed: ThunderSDK.isPermitted("variables", "list"),
    },
    {
      hue: "emerald",
      icon: IconNetwork,
      label: t("Private network"),
      hint: t("Servers reaching each other"),
      to: "infrastructure/network",
      allowed: ThunderSDK.isPermitted("networks", "get"),
    },
    {
      hue: "amber",
      icon: IconTemplate,
      label: t("Templates"),
      hint: t("One-click services and builds"),
      to: "build/templates",
      allowed: ThunderSDK.isPermitted("templates", "list"),
    },
  ]
  const shown = actions.filter((a) => a.allowed)
  if (!shown.length) return null

  return (
    <nav aria-label={t("Quick actions")}>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        {t("Quick actions")}
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {shown.map((a) => (
          <li key={a.to}>
            <Link
              to={getLocalPath(a.to)}
              className={cn(
                "flex h-full flex-col gap-2 rounded-2xl border bg-card p-3 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                HUES[a.hue].ring
              )}
            >
              <IconChip hue={a.hue} icon={a.icon} />
              <span className="text-sm font-medium">{a.label}</span>
              <span className="text-xs text-muted-foreground">{a.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Unverified accounts can't add servers (PLAN §20.3). Verification lives in
 * the auth app's account page, so this links there.
 */
function VerifyEmailAlert({ email }: { email: string }) {
  const { t } = useTranslation()
  return (
    <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100">
      <IconMailExclamation className="text-amber-600 dark:text-amber-400" />
      <AlertTitle>{t("Verify your email address")}</AlertTitle>
      <AlertDescription className="text-amber-900/80 dark:text-amber-100/80">
        <p>
          {t(
            "{{email}} isn't verified yet. Until it is you can't add servers, and alert emails may not reach you.",
            { email }
          )}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          render={<a href={getAuthUrl("/account").toString()} />}
          nativeButton={false}
        >
          {t("Verify in your account")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/** Pool overview (PLAN §7.1, §15.6): combined capacity, fit, trends and advice. */
export default function Overview() {
  const { t } = useTranslation()
  const meRequest = ThunderSDK.useCaching(
    ["me"],
    async ({ signal }) => await ThunderSDK.me.get({ signal })
  )
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
  // Cached data shows at once; servers, projects and alerts refetch every 30 s.
  usePolling(() => {
    for (const r of [
      meRequest,
      placementRequest,
      projectsRequest,
      alertsRequest,
    ])
      r.invalidate()
  }, 30_000)
  const { data: me } = use(meRequest)
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
  const verify = me && !me.emailVerified && (
    <VerifyEmailAlert email={me.email} />
  )

  if (servers && !servers.length) {
    return (
      <Page className="flex flex-col gap-6 py-4">
        {verify}
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon" className={HUES.sky.chip}>
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
              <IconPlus data-icon="inline-start" />
              {t("Add a server")}
            </Button>
          </EmptyContent>
        </Empty>
        <QuickActions />
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
  // Classes keep a hue by position in this fixed order (sky, violet, emerald).
  const classHue = (i: number): THue =>
    (["sky", "violet", "emerald"] as const)[i]

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
              reserved: formatMb(w.reserve.memMb),
              used: formatMb(p95 / MiB),
            }
          )
        )
      }
    }
  }

  const running = (projects ?? []).filter((p) => p.status === "running").length
  const alertCount = openAlerts?.length ?? 0

  return (
    <Page className="flex flex-col gap-6 py-4">
      {verify}

      <AiPrompt servers={servers ?? []} />

      <section
        aria-labelledby="pool-title"
        className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-orange-500/15 via-rose-500/10 to-violet-500/15 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 id="pool-title" className="text-2xl font-semibold">
              {t("Server pool")}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t(
                "Your servers as one budget. Usage comes from each server when you open this page and stays in your browser."
              )}
            </p>
          </div>
          <Button
            variant="outline"
            className="bg-background/70"
            onClick={() => {
              placementRequest.invalidate()
              projectsRequest.invalidate()
              alertsRequest.invalidate()
              capacity.request.invalidate()
            }}
            disabled={capacity.isLoading}
          >
            <IconRefresh
              data-icon="inline-start"
              className={cn(capacity.isLoading && "animate-spin")}
            />
            {t("Refresh")}
          </Button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            hue="sky"
            icon={IconServer2}
            value={servers ? `${online.length}/${servers.length}` : "…"}
            label={t("Servers online")}
            to={getLocalPath("infrastructure/servers")}
          />
          <Stat
            hue="orange"
            icon={IconRocket}
            value={projects ? running : "…"}
            label={t("Projects running")}
            to={getLocalPath("applications/projects")}
          />
          <Stat
            hue={alertCount ? "rose" : "emerald"}
            icon={IconBell}
            value={openAlerts ? alertCount : "…"}
            label={alertCount ? t("Open alerts") : t("No open alerts")}
            to={getLocalPath("monitoring/alertEvents")}
          />
          <Stat
            hue="violet"
            icon={IconStack2}
            value={top ? `≈ ${top.pool}` : "—"}
            label={
              top
                ? t("More apps like {{name}} fit", { name: top.c.name })
                : t("Room for more apps")
            }
          />
        </div>
      </section>

      {!!alertCount && (
        <Alert variant="destructive">
          <IconBell />
          <AlertTitle>
            {t("{{count}} open alert(s)", { count: alertCount })}
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc ps-4">
              {openAlerts!.slice(0, 5).map((a) => (
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

      <QuickActions />

      {/* Platform admins: the control plane's health at a glance. */}
      {ThunderSDK.isPermitted("controlPlane", "overview") && (
        <ControlPlaneSummary />
      )}

      {!servers ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Meter
            label={t("CPU")}
            icon={IconCpu}
            hue="sky"
            total={totals.cpu}
            reserved={totals.cpuReserved}
            used={used?.cpu}
            format={(n) => t("{{n}} cores", { n: n.toFixed(1) })}
          />
          <Meter
            label={t("Memory")}
            icon={IconStack2}
            hue="violet"
            total={totals.memMb}
            reserved={totals.memReserved}
            used={used?.memMb}
            format={formatMb}
          />
          <Meter
            label={t("Disk")}
            icon={IconDatabase}
            hue="emerald"
            total={totals.diskMb}
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
            <ul className="grid gap-3 md:grid-cols-3">
              {fitTable.map(({ c, pool, largest, cpuFits }, i) => (
                <li
                  key={c.key}
                  className="flex flex-col gap-2 rounded-2xl border p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-xl px-3 py-1 text-2xl font-semibold tabular-nums",
                        HUES[classHue(i)].chip
                      )}
                    >
                      ≈ {pool}
                    </span>
                    <span className="text-sm">
                      {t("more apps like {{name}}", { name: c.name })}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatMb(c.memMb)} · {c.cpu.toFixed(2)} CPU ·{" "}
                    {c.samples ? t("measured") : t("declared")} ·{" "}
                    {t("largest server fits {{n}}", { n: largest })}
                  </span>
                  {cpuFits < pool && (
                    <span className="text-xs text-muted-foreground">
                      {t("CPU alone allows ≈ {{n}}; more overcommits it.", {
                        n: cpuFits,
                      })}
                    </span>
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
                  const memUsed = (r?.host.day?.memP95 ?? 0) / MiB
                  return (
                    <TableRow key={s.server}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className={cn(
                              "size-2 rounded-full",
                              s.online
                                ? "bg-emerald-500"
                                : "bg-muted-foreground/40"
                            )}
                          />
                          {s.name}
                          <span className="sr-only">
                            {s.online ? t("online") : t("offline")}
                          </span>
                        </span>
                      </TableCell>
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
                          <TableCell className="min-w-56">
                            <Bar
                              label={t("Memory used on {{name}}", {
                                name: s.name,
                              })}
                              value={memUsed}
                              total={s.memoryMb}
                              text={`${formatMb(memUsed)} / ${formatMb(
                                s.memReservedMb
                              )} / ${formatMb(s.memoryMb)}`}
                              fill={HUES.violet.bar}
                            />
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatMb(Math.max(0, room!.memMb))}
                          </TableCell>
                          {classes.map((c, i) => (
                            <TableCell key={c.key}>
                              <span
                                className={cn(
                                  "rounded-lg px-2 py-0.5 text-sm font-medium tabular-nums",
                                  HUES[classHue(i)].chip
                                )}
                              >
                                ≈ {fitsIn(room!, c).fits}
                              </span>
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
          <CardHeader className="flex flex-row items-center gap-3">
            <IconChip hue="amber" icon={IconTrendingUp} />
            <div>
              <CardTitle className="text-base">
                {t("Growth forecast")}
              </CardTitle>
              <CardDescription>
                {t("A linear trend over daily peaks ({{n}} days so far).", {
                  n: daily.length,
                })}
              </CardDescription>
            </div>
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
                className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-2 text-rose-800 dark:text-rose-200"
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
          <CardHeader className="flex flex-row items-center gap-3">
            <IconChip hue="sky" icon={IconBulb} />
            <div>
              <CardTitle className="text-base">
                {t("Recommendations")}
              </CardTitle>
              <CardDescription>
                {t("Advice only; nothing changes on its own.")}
              </CardDescription>
            </div>
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
