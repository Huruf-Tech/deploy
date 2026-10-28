import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { IconFlag, IconScale } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { PageHeader } from "@/components/console/page-header"
import { DataTable } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { StatusBadge } from "@/components/console/status"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getLocalPath } from "@/core/lib/utils"
import { useCached } from "@/hooks/use-cached"
import { ago } from "@/lib/format"
import { money } from "@/lib/plans"
import { queries } from "@/lib/queries"

type TDispute = Awaited<
  ReturnType<typeof ThunderSDK.rentalsAdmin.listDisputes>
>[number]
type TReport = Awaited<
  ReturnType<typeof ThunderSDK.rentalsAdmin.listReports>
>[number]

/** Open, done or all: the tabs of a case list, remembered in the URL. */
function useTab<T extends string>(tabs: readonly T[]) {
  const [tab, setTab] = React.useState<T>(() => {
    const q = new URLSearchParams(location.search).get("tab") as T | null
    return q && tabs.includes(q) ? q : tabs[0]
  })
  const choose = (next: T) => {
    setTab(next)
    const url = new URL(location.href)
    url.searchParams.set("tab", next)
    history.replaceState(history.state, "", url)
  }
  return [tab, choose] as const
}

function Tabs<T extends string>({
  value,
  onChange,
  items,
  label,
}: {
  value: T
  onChange: (v: T) => void
  items: [T, string][]
  label: string
}) {
  return (
    <ToggleGroup
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
    >
      {items.map(([v, l]) => (
        <ToggleGroupItem key={v} value={v} className="h-7 px-2.5 text-xs">
          {l}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/**
 * Disputes (PLAN §30.9): open ones are the queue; decided ones stay here
 * to look back at. Each opens its review page.
 */
export function DisputesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useTab(["open", "resolved", "all"] as const)
  const { data } = useCached(queries.disputes(tab))

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Disputes")}
        description={t(
          "Renters' disputes on rentals. The machine's money is frozen while one is open; a refund is paid from it."
        )}
        actions={
          <Tabs
            label={t("Disputes")}
            value={tab}
            onChange={setTab}
            items={[
              ["open", t("Open")],
              ["resolved", t("Decided")],
              ["all", t("All")],
            ]}
          />
        }
      />
      {data && !data.length ? (
        <EmptyState
          icon={IconScale}
          title={tab === "open" ? t("No open dispute.") : t("No dispute here.")}
          description={t("Renters open one from their rented server's page.")}
        />
      ) : (
        <DataTable<TDispute>
          label={t("Disputes")}
          rows={data ?? []}
          loading={!data}
          rowId={(d) => d._id}
          onRowClick={(d) => navigate(getLocalPath(`admin/disputes/${d._id}`))}
          columns={[
            {
              id: "who",
              header: t("Renter / owner"),
              cell: (d) => (
                <div className="min-w-0">
                  <div className="font-medium">{d.tenantName ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.ownerName ?? "—"} · {d.machineName ?? d.machine}
                  </div>
                </div>
              ),
            },
            {
              id: "reason",
              header: t("Reason"),
              cell: (d) => (
                <p className="line-clamp-2 max-w-md break-words">{d.reason}</p>
              ),
            },
            {
              id: "status",
              header: t("Status"),
              cell: (d) =>
                d.status === "open" ? (
                  <StatusBadge tone="warning" label={t("Open")} />
                ) : (
                  <StatusBadge
                    tone="neutral"
                    label={
                      d.decision?.refund
                        ? t("Refunded {{amount}}", {
                            amount: money(d.decision.refund, "usd"),
                          })
                        : t("Nothing refunded")
                    }
                  />
                ),
            },
            {
              id: "held",
              header: t("Held"),
              align: "end",
              className: "whitespace-nowrap tabular-nums",
              cell: (d) => (d.status === "open" ? money(d.held, "usd") : "—"),
            },
            {
              id: "when",
              header: t("Opened"),
              sortValue: (d) => new Date(d.createdAt).getTime(),
              className: "whitespace-nowrap text-xs",
              cell: (d) => ago(d.createdAt),
            },
          ]}
        />
      )}
    </Page>
  )
}

/**
 * Abuse reports (PLAN §30.10): open ones are the queue; closed ones keep
 * their verdict. Each opens its review page.
 */
export function ReportsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useTab(["open", "closed", "all"] as const)
  const { data } = useCached(queries.abuseReports(tab))

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Abuse reports")}
        description={t(
          "What renters and owners reported. Review each one and close it as valid or not."
        )}
        actions={
          <Tabs
            label={t("Abuse reports")}
            value={tab}
            onChange={setTab}
            items={[
              ["open", t("Open")],
              ["closed", t("Closed")],
              ["all", t("All")],
            ]}
          />
        }
      />
      {data && !data.length ? (
        <EmptyState
          icon={IconFlag}
          title={tab === "open" ? t("No open report.") : t("No report here.")}
          description={t(
            "Reports come from a rented server's page or a machine."
          )}
        />
      ) : (
        <DataTable<TReport>
          label={t("Abuse reports")}
          rows={data ?? []}
          loading={!data}
          rowId={(r) => r._id}
          onRowClick={(r) =>
            navigate(getLocalPath(`admin/abuseReports/${r._id}`))
          }
          columns={[
            {
              id: "who",
              header: t("From / about"),
              cell: (r) => (
                <div className="min-w-0">
                  <div className="font-medium">{r.tenantName ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.machineName ?? r.machine ?? "—"}
                  </div>
                </div>
              ),
            },
            {
              id: "text",
              header: t("Report"),
              cell: (r) => (
                <p className="line-clamp-2 max-w-md break-words">{r.text}</p>
              ),
            },
            {
              id: "status",
              header: t("Status"),
              cell: (r) =>
                r.status === "open" ? (
                  <StatusBadge tone="warning" label={t("Open")} />
                ) : (
                  <StatusBadge
                    tone={r.valid ? "danger" : "neutral"}
                    label={r.valid ? t("Valid") : t("Not valid")}
                  />
                ),
            },
            {
              id: "when",
              header: t("Sent"),
              sortValue: (r) => new Date(r.createdAt).getTime(),
              className: "whitespace-nowrap text-xs",
              cell: (r) => ago(r.createdAt),
            },
          ]}
        />
      )}
    </Page>
  )
}
