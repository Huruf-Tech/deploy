import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { IconBellCheck } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { PageHeader } from "@/components/console/page-header"
import { DataTable, type TColumn } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { StatusBadge } from "@/components/console/status"
import { usePolling } from "@/hooks/use-polling"
import { dateTime } from "@/lib/format"
import { METRICS } from "./metrics"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

type TEvent = Awaited<ReturnType<typeof ThunderSDK.alertEvents.list>>[number]

const time = (at?: string | Date) => (at ? new Date(at).getTime() : undefined)

/** Monitoring → Alert history (PLAN §13): episodes and their delivery. */
export default function AlertHistory() {
  const { t } = useTranslation()
  const { data, reload } = useCached(queries.alertEvents())
  usePolling(reload, 30_000)

  const columns: TColumn<TEvent>[] = [
    {
      id: "state",
      header: t("Status"),
      sortValue: (e) => (e.open ? 0 : 1),
      cell: (e) =>
        e.open ? (
          <StatusBadge tone="danger" label={t("Open")} />
        ) : (
          <StatusBadge state="resolved" label={t("Resolved")} />
        ),
    },
    {
      id: "alert",
      header: t("Alert"),
      sortValue: (e) => e.ruleName,
      cell: (e) => (
        <div className="min-w-0">
          <div className="font-medium">{e.ruleName}</div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {t(METRICS[e.metric].label)}
            {e.value !== undefined &&
              ` · ${e.value}${METRICS[e.metric].unit === "%" ? "%" : " MiB"}`}
          </div>
          {e.detail && (
            <div
              className="max-w-80 truncate text-xs text-muted-foreground"
              title={e.detail}
            >
              {e.detail}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "where",
      header: t("Where"),
      cell: (e) =>
        [e.projectName, e.serverName].filter(Boolean).join(" · ") || "—",
    },
    {
      id: "fired",
      header: t("Fired"),
      sortValue: (e) => time(e.firedAt),
      className: "whitespace-nowrap tabular-nums",
      cell: (e) => dateTime(e.firedAt),
    },
    {
      id: "resolved",
      header: t("Resolved"),
      sortValue: (e) => time(e.resolvedAt),
      className: "whitespace-nowrap tabular-nums",
      cell: (e) => (e.resolvedAt ? dateTime(e.resolvedAt) : "—"),
    },
    {
      id: "notice",
      header: t("Notice"),
      cell: (e) => (
        <span title={e.delivery.error}>
          <StatusBadge
            tone={
              e.delivery.status === "failed"
                ? "danger"
                : e.delivery.status === "pending"
                  ? "warning"
                  : "neutral"
            }
            label={
              <>
                {e.delivery.notice === "resolved"
                  ? t("Resolve notice")
                  : t("Alert notice")}
                :{" "}
                {e.delivery.status === "sent"
                  ? t("sent")
                  : e.delivery.status === "failed"
                    ? t("failed")
                    : e.delivery.attempts
                      ? t("retrying")
                      : t("sending")}
              </>
            }
          />
        </span>
      ),
    },
  ]

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Alert history")}
        description={t(
          "The latest 100 alerts. Failed notices are retried with backoff."
        )}
      />
      {data && !data.length ? (
        <EmptyState icon={IconBellCheck} title={t("No alerts yet.")} />
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            label={t("Alert history")}
            columns={columns}
            rows={data}
            rowId={(e) => e._id}
            loading={!data}
          />
        </div>
      )}
    </Page>
  )
}
