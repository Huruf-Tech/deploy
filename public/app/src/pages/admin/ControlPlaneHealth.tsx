import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconArrowsExchange,
  IconCpu,
  IconDatabase,
  IconServer2,
  IconStack2,
} from "@tabler/icons-react"

import { Meter } from "@/components/console/meter"
import { Panel } from "@/components/console/panel"
import { StatusBadge, type TTone } from "@/components/console/status"
import type { TLevel } from "@/lib/hues"
import { cn } from "@/lib/utils"
import {
  num,
  POLL_BUDGET_MS,
  recent,
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

/** A metric panel: label, headline value, then its meters. */
function MeterPanel({
  icon: Icon,
  label,
  title,
  detail,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  title: string
  detail?: string
  children: React.ReactNode
}) {
  return (
    <Panel
      title={
        <span className="flex items-center gap-1.5">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {label}
        </span>
      }
      actions={
        detail && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {detail}
          </span>
        )
      }
      bodyClassName="flex flex-col gap-3"
    >
      <div className="font-mono text-xl font-semibold tabular-nums">
        {title}
      </div>
      {children}
    </Panel>
  )
}

/** The overall verdict from the findings, for the page header. */
export function HealthBadge({ findings }: { findings: TFinding[] }) {
  const { t } = useTranslation()
  const worst: TLevel = findings.some((f) => f.level === "critical")
    ? "critical"
    : findings.length
      ? "warning"
      : "ok"
  const [tone, label]: [TTone, string] =
    worst === "critical"
      ? ["danger", t("Under pressure")]
      : worst === "warning"
        ? ["warning", t("Needs attention")]
        : ["success", t("Healthy")]
  return <StatusBadge tone={tone} label={label} />
}

/** Why the verdict is what it is: one line per finding, or the all-clear. */
export function HealthHero({ findings }: { findings: TFinding[] }) {
  const { t } = useTranslation()
  const critical = findings.some((f) => f.level === "critical")
  return (
    <section aria-label={t("Health")} aria-live="polite">
      {!findings.length ? (
        <p className="text-[13px] text-muted-foreground">
          {t(
            "Every instance has headroom, and agents' polls are within budget."
          )}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-muted-foreground">
            {critical
              ? t("Something is at its limit: act on the items below.")
              : t("Something is close to its limit; see below.")}
          </p>
          <ul className="flex flex-col gap-1.5">
            {findings.map((f) => (
              <li
                key={f.text}
                className={cn(
                  "flex items-start gap-2 rounded-lg px-3 py-2 text-[13px]",
                  f.level === "critical"
                    ? "bg-destructive-soft text-destructive-foreground"
                    : "bg-warning-soft text-warning-foreground"
                )}
              >
                {f.level === "critical" ? (
                  <IconAlertOctagon
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                ) : (
                  <IconAlertTriangle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                )}
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/** Agents, traffic and the database, for the whole control plane. */
export function ClusterMeters({ o }: { o: TOverview }) {
  const { t } = useTranslation()
  const last = o.series.at(-2) ?? o.series.at(-1)
  const { cluster } = o
  // The same recent minutes the verdict judges.
  const { errorPct, pollP95Ms: pollP95 } = recent(o)
  const ping = cluster.db.pingMs

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <MeterPanel
        icon={IconServer2}
        label={t("Agents online")}
        title={`${num(cluster.onlineAgents)} / ${num(cluster.activeServers)}`}
      >
        <Meter
          label={t("Online")}
          value={cluster.onlineAgents}
          total={Math.max(1, cluster.activeServers)}
          text={t("{{n}} of {{total}}", {
            n: num(cluster.onlineAgents),
            total: num(cluster.activeServers),
          })}
          hue="orange"
          level={
            cluster.activeServers &&
            cluster.onlineAgents < cluster.activeServers
              ? "warning"
              : "ok"
          }
        />
        <Meter
          label={t("Poll time, p95 (budget {{n}} ms)", { n: POLL_BUDGET_MS })}
          value={pollP95 ?? 0}
          total={POLL_BUDGET_MS * 2}
          text={pollP95 == null ? "—" : `${num(pollP95)} ms`}
          hue="orange"
          level={
            pollP95 == null
              ? "ok"
              : pollP95 > 100
                ? "critical"
                : pollP95 > POLL_BUDGET_MS
                  ? "warning"
                  : "ok"
          }
        />
      </MeterPanel>

      <MeterPanel
        icon={IconArrowsExchange}
        label={t("Requests per minute")}
        title={last ? num(last.requestsPerMin) : "—"}
      >
        <Meter
          label={t("Agent polls per minute")}
          value={last?.pollsPerMin ?? 0}
          total={Math.max(1, last?.requestsPerMin ?? 0)}
          text={last ? num(last.pollsPerMin) : "—"}
          hue="sky"
          level="ok"
        />
        <Meter
          label={t("Server errors")}
          value={errorPct}
          total={5}
          text={`${num(errorPct)}%`}
          hue="sky"
          level={level(errorPct, 0.5, 1)}
        />
      </MeterPanel>

      <MeterPanel
        icon={IconDatabase}
        label={t("Database")}
        title={cluster.db.storageMb == null ? "—" : gb(cluster.db.storageMb)}
        detail={
          cluster.db.objects == null
            ? undefined
            : t("{{n}} documents", { n: num(cluster.db.objects) })
        }
      >
        <Meter
          label={t("Ping from this instance")}
          value={ping ?? 0}
          total={100}
          text={ping == null ? "—" : `${num(ping)} ms`}
          hue="emerald"
          level={level(ping ?? 0, 30, 80)}
        />
        <Meter
          label={t("Commands waiting for agents")}
          value={cluster.pendingCommands}
          total={1000}
          text={num(cluster.pendingCommands)}
          hue="emerald"
          level={level(cluster.pendingCommands, 500, 1000)}
        />
      </MeterPanel>
    </div>
  )
}

/** Each instance's CPU and memory, with its host's when it has one. */
export function InstanceMeters({ o }: { o: TOverview }) {
  const { t } = useTranslation()
  if (!o.instances.length)
    return (
      <p className="rounded-[10px] border border-dashed px-4 py-3 text-[13px] text-muted-foreground">
        {t(
          "No instance has reported in the last 3 minutes. Instances report once a minute while they serve requests."
        )}
      </p>
    )
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
            <h3 className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
              <span dir="ltr" className="font-mono text-xs font-medium">
                {i.host}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("up {{time}} · {{n}} database connections", {
                  time: uptime(i.process.uptimeS),
                  n: i.dbPoolSize,
                })}
                {i.dbPoolWaitMaxMs >= 1 &&
                  ` · ${t("waited {{ms}} ms", { ms: Math.round(i.dbPoolWaitMaxMs) })}`}
              </span>
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <MeterPanel
                icon={IconCpu}
                label={t("CPU")}
                title={
                  s
                    ? t("{{n}} cores", { n: num(s.cpus) })
                    : t("{{n}}% of a core", { n: num(i.process.cpuPct) })
                }
              >
                {s && (
                  <Meter
                    label={t("Host CPU used")}
                    value={s.cpuPct}
                    total={100}
                    text={`${num(s.cpuPct)}%`}
                    hue="sky"
                    level={level(s.cpuPct, 80, 95)}
                  />
                )}
                <Meter
                  label={t("Control plane (runs on one core)")}
                  value={i.process.cpuPct}
                  total={100}
                  text={`${num(i.process.cpuPct)}%`}
                  hue="sky"
                  level={level(i.process.cpuPct, 80, 95)}
                />
                {s && (
                  <Meter
                    label={t("Load, 5 min")}
                    value={s.load5}
                    total={s.cpus}
                    text={t("{{load}} of {{cpus}}", {
                      load: num(s.load5),
                      cpus: s.cpus,
                    })}
                    hue="sky"
                    level={s.load5 > s.cpus ? "warning" : "ok"}
                  />
                )}
              </MeterPanel>
              <MeterPanel
                icon={IconStack2}
                label={t("Memory")}
                title={s ? gb(s.memTotalMb) : gb(i.process.rssMb)}
              >
                {s && (
                  <Meter
                    label={t("Host memory used")}
                    value={memUsed}
                    total={s.memTotalMb}
                    text={`${gb(memUsed)} · ${num(memPct)}%`}
                    hue="violet"
                    level={level(memPct, 85, 95)}
                  />
                )}
                <Meter
                  label={t("Control plane process")}
                  value={i.process.rssMb}
                  total={s?.memTotalMb ?? i.process.rssMb}
                  text={gb(i.process.rssMb)}
                  hue="violet"
                  level="ok"
                />
              </MeterPanel>
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
