import { Link } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowRight,
  IconCircleCheck,
} from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { getLocalPath } from "@/core/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      {detail && (
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      )}
    </div>
  )
}

/**
 * The control plane at a glance for platform admins on the Overview page:
 * health, load and the busiest instance, with the full page one click away.
 * Shares its request with Admin > Control plane (same cache key).
 */
export function ControlPlaneSummary() {
  const { t } = useTranslation()
  const request = ThunderSDK.useCaching(
    ["controlPlane", "1h"],
    async ({ signal }) =>
      (await ThunderSDK.controlPlane.overview({
        signal,
        query: { range: "1h" },
      })) as unknown as TOverview
  )
  const { data: o, isLoading } = use(request)
  usePolling(() => request.invalidate(), 60_000)

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
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <IconActivity className="size-4 text-muted-foreground" aria-hidden />
          {t("Control plane")}
        </CardTitle>
        <CardDescription>
          {t("Last hour, across every instance.")}
        </CardDescription>
        <CardAction>
          <Button
            size="sm"
            variant="outline"
            render={<Link to={getLocalPath("admin/controlPlane")} />}
            nativeButton={false}
          >
            {t("Open")}
            <IconArrowRight data-icon="inline-end" aria-hidden />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading && !o ? (
          <Skeleton className="h-20 rounded-2xl" />
        ) : !o ? null : (
          <>
            <p
              className={cn(
                "flex items-start gap-2 rounded-2xl p-3 text-sm",
                !worst
                  ? "bg-success/10"
                  : worst.level === "critical"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10"
              )}
            >
              {worst ? (
                <IconAlertTriangle
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    worst.level === "warning" && "text-warning"
                  )}
                  aria-hidden
                />
              ) : (
                <IconCircleCheck
                  className="mt-0.5 size-4 shrink-0 text-success"
                  aria-hidden
                />
              )}
              <span className="min-w-0">
                {worst
                  ? worst.text
                  : t(
                      "Healthy: every instance has headroom and polls are within budget."
                    )}
                {list.length > 1 && (
                  <span className="block text-xs opacity-80">
                    {t("{{n}} more on the control plane page", {
                      n: list.length - 1,
                    })}
                  </span>
                )}
              </span>
            </p>
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
      </CardContent>
    </Card>
  )
}
