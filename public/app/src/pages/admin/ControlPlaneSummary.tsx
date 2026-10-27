import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { IconAlertTriangle, IconArrowRight } from "@tabler/icons-react"

import { getLocalPath } from "@/core/lib/utils"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/console/panel"
import { StatusBadge } from "@/components/console/status"
import { Skeleton } from "@/components/ui/skeleton"
import { usePolling } from "@/hooks/use-polling"
import { cn } from "@/lib/utils"
import {
  findings,
  ms,
  num,
  POLL_BUDGET_MS,
  type TOverview,
} from "./control-plane"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

function Figure({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-base font-semibold tabular-nums">
        {value}
      </span>
      {detail && (
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      )}
    </div>
  )
}

/**
 * The control plane at a glance for platform admins on the Overview page:
 * health, load and the busiest instance, with the full page one click away.
 * Shares its query with Admin > Control plane.
 */
export function ControlPlaneSummary() {
  const { t } = useTranslation()
  const { data: o, isLoading, reload } = useCached(queries.controlPlane("1h"))
  usePolling(reload, 60_000)

  const list = o ? findings(o, t) : []
  const worst =
    list.find((f) => f.level === "critical") ??
    list.find((f) => f.level === "warning")
  // The newest bucket is still filling.
  const last = o?.series.at(-2) ?? o?.series.at(-1)
  const busiest = o?.instances.reduce<
    TOverview["instances"][number] | undefined
  >(
    (max, i) => (!max || i.process.cpuPct > max.process.cpuPct ? i : max),
    undefined
  )

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          {t("Control plane")}
          {o && (
            <StatusBadge
              tone={
                !worst
                  ? "success"
                  : worst.level === "critical"
                    ? "danger"
                    : "warning"
              }
              label={
                !worst
                  ? t("Healthy")
                  : worst.level === "critical"
                    ? t("Under pressure")
                    : t("Needs attention")
              }
            />
          )}
        </span>
      }
      description={t("Last hour, across every instance.")}
      actions={
        <Button
          size="sm"
          variant="ghost"
          render={<Link to={getLocalPath("admin/controlPlane")} />}
          nativeButton={false}
        >
          {t("Open")}
          <IconArrowRight
            data-icon="inline-end"
            className="icon-flip-rtl"
            aria-hidden
          />
        </Button>
      }
      bodyClassName="flex flex-col gap-3"
    >
      {isLoading && !o ? (
        <Skeleton className="h-14 rounded-lg" />
      ) : !o ? null : (
        <>
          {worst && (
            <p
              className={cn(
                "flex items-start gap-2 rounded-lg px-3 py-2 text-[13px]",
                worst.level === "critical"
                  ? "bg-destructive-soft text-destructive-foreground"
                  : "bg-warning-soft text-warning-foreground"
              )}
            >
              <IconAlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <span className="min-w-0">
                {worst.text}
                {list.length > 1 && (
                  <span className="block text-xs opacity-80">
                    {t("{{n}} more on the control plane page", {
                      n: list.length - 1,
                    })}
                  </span>
                )}
              </span>
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Figure
              label={t("Instances")}
              value={num(o.instances.length)}
              detail={
                busiest
                  ? t("busiest at {{pct}}% CPU", {
                      pct: num(busiest.process.cpuPct),
                    })
                  : undefined
              }
            />
            <Figure
              label={t("Agents online")}
              value={num(o.cluster.onlineAgents)}
              detail={t("of {{n}} active servers", {
                n: num(o.cluster.activeServers),
              })}
            />
            <Figure
              label={t("Agent polls / min")}
              value={last ? num(last.pollsPerMin) : "—"}
              detail={t("about {{n}} expected", {
                n: num(o.cluster.expectedPollsPerMin),
              })}
            />
            <Figure
              label={t("Poll time, p95")}
              value={ms(o.summary.pollP95Ms)}
              detail={t("budget {{n}} ms", { n: POLL_BUDGET_MS })}
            />
            <Figure
              label={t("Requests / min")}
              value={last ? num(last.requestsPerMin) : "—"}
              detail={t("{{pct}}% errors", {
                pct: o.summary.requests
                  ? num((100 * o.summary.errors) / o.summary.requests)
                  : 0,
              })}
            />
          </div>
        </>
      )}
    </Panel>
  )
}
