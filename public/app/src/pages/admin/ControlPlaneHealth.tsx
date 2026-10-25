import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconArrowsExchange,
  IconCircleCheck,
  IconCpu,
  IconDatabase,
  IconServer2,
  IconStack2,
} from "@tabler/icons-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Bar, IconChip } from "@/components/meter"
import { levelFill, type THue, type TLevel } from "@/lib/hues"
import { cn } from "@/lib/utils"
import {
  num,
  POLL_BUDGET_MS,
  uptime,
  type TFinding,
  type TOverview,
} from "./control-plane"

/*
 * Admin > Control plane at a glance (PLAN §20.2): one verdict, then bars
 * that turn amber or red at the same thresholds as the findings.
 */

const gb = (mb: number) =>
  mb >= 1024 ? `${num(mb / 1024)} GB` : `${num(Math.round(mb))} MB`

/** ≥ warn is a warning, ≥ crit critical. */
const level = (value: number, warn: number, crit: number): TLevel =>
  value >= crit ? "critical" : value >= warn ? "warning" : "ok"

function Meter({
  hue,
  icon,
  label,
  title,
  detail,
  children,
}: {
  hue: THue
  icon: React.ComponentType<{ className?: string }>
  label: string
  title: string
  detail?: string
  children: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <IconChip hue={hue} icon={icon} />
        <div className="min-w-0">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{title}</CardTitle>
        </div>
        {detail && (
          <span className="ms-auto self-start text-xs text-muted-foreground">
            {detail}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  )
}

/** The verdict: healthy, needs attention or under pressure, and why. */
export function HealthHero({ findings }: { findings: TFinding[] }) {
  const { t } = useTranslation()
  const worst: TLevel = findings.some((f) => f.level === "critical")
    ? "critical"
    : findings.length
      ? "warning"
      : "ok"
  const look = {
    ok: {
      icon: IconCircleCheck,
      chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      bg: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      title: t("Healthy"),
      text: t(
        "Every instance has headroom, and agents' polls are within budget."
      ),
    },
    warning: {
      icon: IconAlertTriangle,
      chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      bg: "from-amber-500/15 via-amber-500/5 to-transparent",
      title: t("Needs attention"),
      text: t("Something is close to its limit; see below."),
    },
    critical: {
      icon: IconAlertOctagon,
      chip: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
      bg: "from-rose-500/15 via-rose-500/5 to-transparent",
      title: t("Under pressure"),
      text: t("Something is at its limit: act on the items below."),
    },
  }[worst]

  return (
    <section
      aria-label={t("Health")}
      className={cn(
        "flex flex-col gap-4 rounded-3xl border bg-linear-to-br p-5 sm:p-6",
        look.bg
      )}
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            look.chip
          )}
        >
          <look.icon className="size-7" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold">{look.title}</h2>
          <p className="text-sm text-muted-foreground">{look.text}</p>
        </div>
      </div>
      {findings.length > 0 && (
        <ul className="flex flex-col gap-2">
          {findings.map((f) => (
            <li
              key={f.text}
              className="flex gap-2 rounded-2xl bg-background/70 p-3 text-sm"
            >
              {f.level === "critical" ? (
                <IconAlertOctagon
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                  aria-hidden
                />
              ) : (
                <IconAlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-warning"
                  aria-hidden
                />
              )}
              {f.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Agents, traffic and the database, for the whole control plane. */
export function ClusterMeters({ o }: { o: TOverview }) {
  const { t } = useTranslation()
  const last = o.series.at(-2) ?? o.series.at(-1)
  const { cluster, summary } = o
  const errorPct = summary.requests
    ? (100 * summary.errors) / summary.requests
    : 0
  const pollP95 = summary.pollP95Ms
  const ping = cluster.db.pingMs

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Meter
        hue="orange"
        icon={IconServer2}
        label={t("Agents online")}
        title={`${num(cluster.onlineAgents)} / ${num(cluster.activeServers)}`}
      >
        <Bar
          label={t("Online")}
          value={cluster.onlineAgents}
          total={Math.max(1, cluster.activeServers)}
          text={t("{{n}} of {{total}}", {
            n: num(cluster.onlineAgents),
            total: num(cluster.activeServers),
          })}
          fill={levelFill(
            "orange",
            cluster.activeServers &&
              cluster.onlineAgents < cluster.activeServers
              ? "warning"
              : "ok"
          )}
        />
        <Bar
          label={t("Poll time, p95 (budget {{n}} ms)", { n: POLL_BUDGET_MS })}
          value={pollP95 ?? 0}
          total={POLL_BUDGET_MS * 2}
          text={pollP95 == null ? "—" : `${num(pollP95)} ms`}
          fill={levelFill(
            "orange",
            pollP95 == null
              ? "ok"
              : pollP95 > 100
                ? "critical"
                : pollP95 > POLL_BUDGET_MS
                  ? "warning"
                  : "ok"
          )}
        />
      </Meter>

      <Meter
        hue="sky"
        icon={IconArrowsExchange}
        label={t("Requests per minute")}
        title={last ? num(last.requestsPerMin) : "—"}
      >
        <Bar
          label={t("Agent polls per minute")}
          value={last?.pollsPerMin ?? 0}
          total={Math.max(1, last?.requestsPerMin ?? 0)}
          text={last ? num(last.pollsPerMin) : "—"}
          fill={levelFill("sky")}
        />
        <Bar
          label={t("Server errors")}
          value={errorPct}
          total={5}
          text={`${num(errorPct)}%`}
          fill={levelFill("sky", level(errorPct, 0.5, 1))}
        />
      </Meter>

      <Meter
        hue="emerald"
        icon={IconDatabase}
        label={t("Database")}
        title={cluster.db.storageMb == null ? "—" : gb(cluster.db.storageMb)}
        detail={
          cluster.db.objects == null
            ? undefined
            : t("{{n}} documents", { n: num(cluster.db.objects) })
        }
      >
        <Bar
          label={t("Ping from this instance")}
          value={ping ?? 0}
          total={100}
          text={ping == null ? "—" : `${num(ping)} ms`}
          fill={levelFill("emerald", level(ping ?? 0, 30, 80))}
        />
        <Bar
          label={t("Commands waiting for agents")}
          value={cluster.pendingCommands}
          total={1000}
          text={num(cluster.pendingCommands)}
          fill={levelFill("emerald", level(cluster.pendingCommands, 500, 1000))}
        />
      </Meter>
    </div>
  )
}

/** Each instance's CPU and memory, with its host's when it has one. */
export function InstanceMeters({ o }: { o: TOverview }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      {o.instances.map((i) => {
        const s = i.system
        const memUsed = s ? s.memTotalMb - s.memAvailableMb : 0
        const memPct = s ? (100 * memUsed) / s.memTotalMb : 0
        return (
          <section
            key={i.instance}
            aria-label={i.host}
            className="flex flex-col gap-2"
          >
            <h3 className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-medium">{i.host}</span>
              <span className="text-xs text-muted-foreground">
                {t("up {{time}} · {{n}} database connections", {
                  time: uptime(i.process.uptimeS),
                  n: i.dbPoolSize,
                })}
                {i.dbPoolWaitMaxMs >= 1 &&
                  ` · ${t("waited {{ms}} ms", { ms: Math.round(i.dbPoolWaitMaxMs) })}`}
              </span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Meter
                hue="sky"
                icon={IconCpu}
                label={t("CPU")}
                title={
                  s
                    ? t("{{n}} cores", { n: num(s.cpus) })
                    : t("{{n}}% of a core", { n: num(i.process.cpuPct) })
                }
              >
                {s && (
                  <Bar
                    label={t("Host CPU used")}
                    value={s.cpuPct}
                    total={100}
                    text={`${num(s.cpuPct)}%`}
                    fill={levelFill("sky", level(s.cpuPct, 80, 95))}
                  />
                )}
                <Bar
                  label={t("Control plane (runs on one core)")}
                  value={i.process.cpuPct}
                  total={100}
                  text={`${num(i.process.cpuPct)}%`}
                  fill={levelFill("sky", level(i.process.cpuPct, 80, 95))}
                />
                {s && (
                  <Bar
                    label={t("Load, 5 min")}
                    value={s.load5}
                    total={s.cpus}
                    text={t("{{load}} of {{cpus}}", {
                      load: num(s.load5),
                      cpus: s.cpus,
                    })}
                    fill={levelFill("sky", s.load5 > s.cpus ? "warning" : "ok")}
                  />
                )}
              </Meter>
              <Meter
                hue="violet"
                icon={IconStack2}
                label={t("Memory")}
                title={s ? gb(s.memTotalMb) : gb(i.process.rssMb)}
              >
                {s && (
                  <Bar
                    label={t("Host memory used")}
                    value={memUsed}
                    total={s.memTotalMb}
                    text={`${gb(memUsed)} · ${num(memPct)}%`}
                    fill={levelFill("violet", level(memPct, 85, 95))}
                  />
                )}
                <Bar
                  label={t("Control plane process")}
                  value={i.process.rssMb}
                  total={s?.memTotalMb ?? i.process.rssMb}
                  text={gb(i.process.rssMb)}
                  fill={levelFill("violet")}
                />
              </Meter>
            </div>
          </section>
        )
      })}
      {o.instances.some((i) => !i.system) && (
        <p className="text-xs text-muted-foreground">
          {t(
            "Host figures aren't available on serverless platforms; process figures are."
          )}
        </p>
      )}
    </div>
  )
}
