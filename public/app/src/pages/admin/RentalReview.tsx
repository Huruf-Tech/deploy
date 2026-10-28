import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconFlag,
  IconScale,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { KeyValue, type TKeyValue } from "@/components/console/key-value"
import { DataTable } from "@/components/console/data-table"
import { StatusBadge } from "@/components/console/status"
import { useBreadcrumbTitle } from "@/core/layouts/shared/breadcrumb"
import { getLocalPath } from "@/core/lib/utils"
import { useCached } from "@/hooks/use-cached"
import { ago, dateTime, day, gbOfMb, sizeText } from "@/lib/format"
import { money } from "@/lib/plans"
import { queries } from "@/lib/queries"
import { errorMessage } from "@/lib/utils"
import { PromptDialog } from "@/pages/rentals/PromptDialog"

type TDisputeDetail = Awaited<
  ReturnType<typeof ThunderSDK.rentalsAdmin.dispute>
>
type TParty = TDisputeDetail["customer"]
type TMachine = NonNullable<TDisputeDetail["machine"]>

const minutes = (ms: number) => Math.round(ms / 60_000)

function BackToRentals() {
  const { t } = useTranslation()
  return (
    <Button
      size="sm"
      variant="ghost"
      className="self-start"
      render={<Link to={getLocalPath("admin/rentals")} />}
      nativeButton={false}
    >
      <IconArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
      {t("Rentals")}
    </Button>
  )
}

/** A workspace in a dispute or report: who it is and its record. */
function PartyPanel({
  title,
  party,
  extra = [],
}: {
  title: string
  party: TParty
  extra?: TKeyValue[]
}) {
  const { t } = useTranslation()
  return (
    <Panel title={title} bodyClassName="py-1">
      <KeyValue
        items={[
          { label: t("Workspace"), value: party.name ?? "—" },
          {
            label: t("Its owner"),
            value:
              [party.ownerName, party.ownerEmail].filter(Boolean).join(" · ") ||
              "—",
          },
          ...(party.ownerEmail
            ? [
                {
                  label: t("Email"),
                  value: party.ownerEmail,
                  copy: party.ownerEmail,
                },
              ]
            : []),
          {
            label: t("Workspace since"),
            value: party.createdAt ? day(party.createdAt) : "—",
          },
          {
            label: t("Rentals"),
            value:
              party.machinesForRent !== undefined
                ? t("{{rentals}} on {{machines}} machines for rent", {
                    rentals: party.rentals,
                    machines: party.machinesForRent,
                  })
                : String(party.rentals),
          },
          {
            label: t("Disputes"),
            value: t("{{count}} in all, {{refunded}} refunded ({{amount}})", {
              count: party.disputes,
              refunded: party.disputesRefunded,
              amount: money(party.refundedCents, "usd"),
            }),
          },
          {
            label: t("Reports made"),
            value: t("{{count}}, {{valid}} found valid", {
              count: party.reportsMade,
              valid: party.reportsValid,
            }),
          },
          ...extra,
        ]}
      />
    </Panel>
  )
}

/** A machine's measured facts and record. */
function MachinePanel({ machine }: { machine: TMachine | null }) {
  const { t } = useTranslation()
  if (!machine) {
    return (
      <Panel title={t("Machine")}>
        <p className="text-[13px] text-muted-foreground">
          {t("The machine was removed.")}
        </p>
      </Panel>
    )
  }
  const p = machine.profile
  const pct = (n?: number) => (n === undefined ? "—" : `${n.toFixed(2)}%`)
  return (
    <Panel title={t("Machine")} bodyClassName="py-1">
      <KeyValue
        items={[
          { label: t("Name"), value: machine.name },
          {
            label: t("Address"),
            value:
              [machine.publicIp, machine.country].filter(Boolean).join(" · ") ||
              "—",
          },
          { label: t("Added"), value: day(machine.addedAt) },
          {
            label: t("Size"),
            value: machine.allocatable
              ? `${machine.allocatable.cpus} vCPU · ${gbOfMb(machine.allocatable.memMb)} GB · ${machine.allocatable.diskGb} GB`
              : "—",
          },
          {
            label: t("Rating"),
            value:
              p.rating === undefined
                ? "—"
                : [`${p.rating} / 100`, p.tier && t(p.tier), p.disk]
                    .filter(Boolean)
                    .join(" · "),
          },
          {
            label: t("Uptime 30 / 90 days"),
            value: `${pct(p.uptime30d)} / ${pct(p.uptime90d)}`,
          },
          {
            label: t("Latency"),
            value: p.rttMs === undefined ? "—" : `${Math.round(p.rttMs)} ms`,
          },
          {
            label: t("CPU taken by the host"),
            value:
              p.steal === undefined ? "—" : `${(p.steal * 100).toFixed(1)}%`,
          },
          {
            label: t("CPU used outside partitions"),
            value:
              p.hostCpu === undefined
                ? "—"
                : `${(p.hostCpu * 100).toFixed(1)}%`,
          },
          {
            label: t("Hardware"),
            value: !p.virtualization
              ? "—"
              : p.virtualization === "none"
                ? t("Bare metal")
                : t("Virtual machine ({{kind}})", { kind: p.virtualization }),
          },
          {
            label: t("Renters' rating"),
            value: machine.renters
              ? t("{{stars}} from {{count}} renters", machine.renters)
              : "—",
          },
          {
            label: t("Its record"),
            value: t(
              "{{rentals}} live rentals · {{disputes}} disputes · {{reports}} reports",
              {
                rentals: machine.liveRentals,
                disputes: machine.disputes,
                reports: machine.reports,
              }
            ),
          },
        ]}
      />
    </Panel>
  )
}

function Loading() {
  return (
    <Page className="flex flex-col gap-4 py-5">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-72 rounded-[10px]" />
    </Page>
  )
}

/**
 * A dispute's review page (PLAN §30.9): the reason and what was measured,
 * the rental and every month's money and downtime, the outages, both sides'
 * records and the machine's facts; the decision is made here.
 */
export function DisputeReview() {
  const { t } = useTranslation()
  const { id = "" } = useParams()
  const { data: d, reload } = useCached(queries.disputeDetail(id))
  const [deciding, setDeciding] = React.useState(false)
  useBreadcrumbTitle(d ? t("Dispute") : undefined)
  if (!d) return <Loading />
  const r = d.rental
  const open = d.dispute.status === "open"
  const totalDown = d.periods.reduce((a, p) => a + p.downtimeMs, 0)

  return (
    <Page className="flex flex-col gap-4 py-5">
      <BackToRentals />
      <PageHeader
        title={t("Dispute")}
        status={
          <StatusBadge
            tone={open ? "warning" : "neutral"}
            label={open ? t("Open") : t("Decided")}
          />
        }
        description={t("Opened {{when}} by {{renter}} about {{machine}}", {
          when: ago(d.dispute.createdAt),
          renter: d.customer.name ?? "—",
          machine: d.machine?.name ?? "—",
        })}
        actions={
          open &&
          ThunderSDK.isPermitted("rentalsAdmin", "resolveDispute") && (
            <Button size="sm" onClick={() => setDeciding(true)}>
              <IconScale className="size-4" aria-hidden />
              {t("Decide")}
            </Button>
          )
        }
      />

      {d.linked && (
        <p className="flex gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning-foreground">
          <IconAlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t(
            "Both sides look like the same person (one creator or a shared card). Check for laundering before refunding."
          )}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title={t("The renter's reason")}>
            <p className="text-[13px] break-words whitespace-pre-wrap">
              {d.dispute.reason}
            </p>
            {d.dispute.decision && (
              <div className="mt-3 rounded-lg border px-3 py-2 text-[13px]">
                <div className="font-medium">
                  {d.dispute.decision.refund
                    ? t("Refunded {{amount}}", {
                        amount: money(d.dispute.decision.refund, "usd"),
                      })
                    : t("Nothing refunded")}
                  <span className="font-normal text-muted-foreground">
                    {" · "}
                    {dateTime(d.dispute.decision.at)}
                  </span>
                </div>
                {d.dispute.decision.note && (
                  <p className="text-muted-foreground">
                    {d.dispute.decision.note}
                  </p>
                )}
              </div>
            )}
          </Panel>

          <Panel title={t("What was bought")} bodyClassName="py-1">
            {r ? (
              <KeyValue
                items={[
                  { label: t("Plan"), value: r.plan ?? "—" },
                  {
                    label: t("Resources"),
                    value: r.whole
                      ? t("The whole machine")
                      : r.resources
                        ? sizeText({
                            cpus: r.resources.vcpu,
                            memMb: r.resources.memMb,
                            diskGb: r.resources.diskGb,
                          })
                        : sizeText(r.size),
                  },
                  {
                    label: t("Included traffic"),
                    value: r.resources
                      ? t("{{gb}} GB a month", { gb: r.resources.trafficGb })
                      : "—",
                  },
                  {
                    label: t("Price"),
                    value: t("{{price}} a month", {
                      price: money(r.price, "usd"),
                    }),
                  },
                  {
                    label: t("Term"),
                    value: r.term
                      ? t("{{count}} months, kept until {{day}}", {
                          count: r.term.months,
                          day: r.term.until ? day(r.term.until) : "—",
                        })
                      : "—",
                  },
                  { label: t("Rented since"), value: day(r.startedAt) },
                  {
                    label: t("Status"),
                    value: [
                      t(r.status),
                      r.cancelAtPeriodEnd && t("ends at period end"),
                      r.heldByAdmin && t("held by an admin"),
                      r.lostAt &&
                        t("machine left {{day}}", { day: day(r.lostAt) }),
                      r.endAt &&
                        t("owner ends it {{day}}", { day: day(r.endAt) }),
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  },
                  {
                    label: t("Paid until"),
                    value: r.currentPeriodEnd ? day(r.currentPeriodEnd) : "—",
                  },
                  {
                    label: t("Uptime this period"),
                    value:
                      r.uptimeThisPeriod === undefined
                        ? "—"
                        : `${r.uptimeThisPeriod.toFixed(2)}%`,
                  },
                  ...(r.lastMove
                    ? [
                        {
                          label: t("Last move"),
                          value: `${dateTime(r.lastMove.at)}${
                            r.lastMove.error ? ` · ${r.lastMove.error}` : ""
                          }`,
                        },
                      ]
                    : []),
                  ...(r.server
                    ? [
                        {
                          label: t("Rented server"),
                          value: r.server,
                          copy: r.server,
                        },
                      ]
                    : []),
                ]}
              />
            ) : (
              <p className="py-2 text-[13px] text-muted-foreground">
                {t("The rental no longer exists.")}
              </p>
            )}
          </Panel>

          <Panel
            title={t("Months and money")}
            description={t(
              "Downtime is refunded by the hour when a month ends; the owner's share waits 14 days."
            )}
            bodyClassName="p-0"
          >
            <DataTable
              label={t("Months and money")}
              rows={d.periods}
              rowId={(p) => p._id}
              columns={[
                {
                  id: "month",
                  header: t("Month"),
                  className: "whitespace-nowrap",
                  cell: (p) => `${day(p.start)} – ${day(p.end)}`,
                },
                {
                  id: "paid",
                  header: t("Paid"),
                  align: "end",
                  className: "tabular-nums",
                  cell: (p) =>
                    money(p.paid, "usd") +
                    (p.overage ? ` (+${money(p.overage, "usd")})` : ""),
                },
                {
                  id: "down",
                  header: t("Down"),
                  align: "end",
                  className: "tabular-nums",
                  cell: (p) => t("{{min}} min", { min: minutes(p.downtimeMs) }),
                },
                {
                  id: "refund",
                  header: t("Refunded"),
                  align: "end",
                  className: "tabular-nums",
                  cell: (p) =>
                    p.refund === undefined ? "—" : money(p.refund, "usd"),
                },
                {
                  id: "owner",
                  header: t("Owner earned"),
                  align: "end",
                  className: "tabular-nums",
                  cell: (p) =>
                    !p.settled ? (
                      <span className="text-muted-foreground">
                        {t("Running")}
                      </span>
                    ) : p.left ? (
                      <StatusBadge tone="danger" label={t("Left")} />
                    ) : (
                      money(p.ownerShare ?? 0, "usd")
                    ),
                },
              ]}
            />
          </Panel>

          <Panel
            title={t("Outages")}
            description={t(
              "{{min}} min down over the rental's months. The machine's outages take the rented server down too.",
              { min: minutes(totalDown) }
            )}
            bodyClassName="p-0"
          >
            {d.outages.length ? (
              <DataTable
                label={t("Outages")}
                rows={d.outages}
                rowId={(o) => `${o.server}-${o.from}`}
                limit={10}
                columns={[
                  {
                    id: "server",
                    header: t("Down"),
                    cell: (o) => t(o.server),
                  },
                  {
                    id: "from",
                    header: t("From"),
                    className: "whitespace-nowrap",
                    cell: (o) => dateTime(o.from),
                  },
                  {
                    id: "to",
                    header: t("Back"),
                    className: "whitespace-nowrap",
                    cell: (o) =>
                      o.ongoing ? (
                        <StatusBadge tone="danger" label={t("Still down")} />
                      ) : o.to ? (
                        dateTime(o.to)
                      ) : (
                        "—"
                      ),
                  },
                  {
                    id: "minutes",
                    header: t("Length"),
                    align: "end",
                    className: "tabular-nums",
                    cell: (o) => t("{{min}} min", { min: o.minutes }),
                  },
                ]}
              />
            ) : (
              <p className="px-4 py-3 text-[13px] text-muted-foreground">
                {t("No outage recorded since the rental began.")}
              </p>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title={t("Money it can pay from")} bodyClassName="py-1">
            <KeyValue
              items={[
                {
                  label: t("Earnings still held"),
                  value: money(Math.max(0, d.held.unreleased), "usd"),
                },
                {
                  label: t("Machine's security"),
                  value: money(Math.max(0, d.held.security), "usd"),
                },
                {
                  label: t("At most"),
                  value: (
                    <span className="font-semibold">
                      {money(d.held.total, "usd")}
                    </span>
                  ),
                },
              ]}
            />
          </Panel>
          <PartyPanel title={t("Renter")} party={d.customer} />
          <PartyPanel title={t("Owner")} party={d.owner} />
          <MachinePanel machine={d.machine} />
        </div>
      </div>

      {deciding && (
        <PromptDialog
          title={t("Decide the dispute")}
          description={t(
            "Up to {{amount}} is held for this machine. 0 refunds nothing; both sides are told.",
            { amount: money(d.held.total, "usd") }
          )}
          amount={{ label: t("Refund ($)"), max: d.held.total, initial: 0 }}
          textLabel={t("Note for both sides (optional)")}
          required={false}
          submitLabel={t("Decide")}
          onOpenChange={setDeciding}
          onSubmit={async (note, refund) => {
            try {
              await ThunderSDK.rentalsAdmin.resolveDispute({
                params: { id },
                body: { refund, ...(note ? { note } : {}) },
              })
              toast.success(t("Dispute decided"))
              reload()
              queries.disputes("open").invalidate()
            } catch (e) {
              toast.error(errorMessage(e) ?? t("Could not save"))
              throw e
            }
          }}
        />
      )}
    </Page>
  )
}

/**
 * An abuse report's review page (PLAN §30.10): what was reported, by whom
 * and how they relate to the machine, their record, the machine and its
 * owner, and other reports on it; closed as valid or not.
 */
export function ReportReview() {
  const { t } = useTranslation()
  const { id = "" } = useParams()
  const { data: d, reload } = useCached(queries.reportDetail(id))
  const [verdict, setVerdict] = React.useState<boolean>()
  useBreadcrumbTitle(d ? t("Abuse report") : undefined)
  if (!d) return <Loading />
  const open = d.report.status === "open"
  const canClose = open && ThunderSDK.isPermitted("rentalsAdmin", "closeReport")
  const relation = {
    owner: t("The reporter owns this machine"),
    renter: t("The reporter rents on this machine"),
    none: t("The reporter has no rental on this machine"),
  }[d.relation]

  return (
    <Page className="flex flex-col gap-4 py-5">
      <BackToRentals />
      <PageHeader
        title={t("Abuse report")}
        status={
          open ? (
            <StatusBadge tone="warning" label={t("Open")} />
          ) : (
            <StatusBadge
              tone={d.report.resolution?.valid ? "danger" : "neutral"}
              label={d.report.resolution?.valid ? t("Valid") : t("Not valid")}
            />
          )
        }
        description={t("Sent {{when}} by {{reporter}}", {
          when: ago(d.report.createdAt),
          reporter: d.reporter.name ?? "—",
        })}
        actions={
          canClose && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setVerdict(false)}
              >
                {t("Not valid")}
              </Button>
              <Button size="sm" onClick={() => setVerdict(true)}>
                <IconFlag className="size-4" aria-hidden />
                {t("Valid")}
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title={t("The report")} description={relation}>
            <p className="text-[13px] break-words whitespace-pre-wrap">
              {d.report.text}
            </p>
            {d.report.resolution && (
              <div className="mt-3 rounded-lg border px-3 py-2 text-[13px]">
                <div className="font-medium">
                  {d.report.resolution.valid
                    ? t("Found valid")
                    : t("Found not valid")}
                  <span className="font-normal text-muted-foreground">
                    {" · "}
                    {dateTime(d.report.resolution.at)}
                  </span>
                </div>
                {d.report.resolution.note && (
                  <p className="text-muted-foreground">
                    {d.report.resolution.note}
                  </p>
                )}
              </div>
            )}
          </Panel>

          {d.rental && (
            <Panel title={t("The rental reported")} bodyClassName="py-1">
              <KeyValue
                items={[
                  { label: t("Plan"), value: d.rental.plan ?? "—" },
                  {
                    label: t("Resources"),
                    value: d.rental.size ? sizeText(d.rental.size) : "—",
                  },
                  { label: t("Status"), value: t(d.rental.status) },
                  { label: t("Rented since"), value: day(d.rental.startedAt) },
                ]}
              />
            </Panel>
          )}

          <Panel
            title={t("Other reports on it")}
            description={t(
              "The same machine or rental reported before, and what came of it."
            )}
            bodyClassName="p-0"
          >
            {d.earlier.length ? (
              <DataTable
                label={t("Other reports on it")}
                rows={d.earlier}
                rowId={(e) => e._id}
                columns={[
                  {
                    id: "text",
                    header: t("Report"),
                    cell: (e) => (
                      <p className="max-w-md break-words">{e.text}</p>
                    ),
                  },
                  {
                    id: "verdict",
                    header: t("Found"),
                    cell: (e) =>
                      e.status === "open" ? (
                        <StatusBadge tone="warning" label={t("Open")} />
                      ) : (
                        <StatusBadge
                          tone={e.valid ? "danger" : "neutral"}
                          label={e.valid ? t("Valid") : t("Not valid")}
                        />
                      ),
                  },
                  {
                    id: "when",
                    header: t("Sent"),
                    className: "whitespace-nowrap text-xs",
                    cell: (e) => ago(e.createdAt),
                  },
                ]}
              />
            ) : (
              <p className="px-4 py-3 text-[13px] text-muted-foreground">
                {t("None before this one.")}
              </p>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <PartyPanel title={t("Reporter")} party={d.reporter} />
          {d.owner && (
            <PartyPanel title={t("Machine's owner")} party={d.owner} />
          )}
          <MachinePanel machine={d.machine} />
        </div>
      </div>

      {verdict !== undefined && (
        <PromptDialog
          title={
            verdict ? t("The report is valid") : t("The report isn't valid")
          }
          description={
            verdict
              ? t(
                  "It's closed as valid. Suspend or delete the rental from its machine's page if it needs it."
                )
              : t("It's closed and counts against the reporter's record.")
          }
          textLabel={t("Note (optional)")}
          required={false}
          submitLabel={t("Close the report")}
          destructive={!verdict}
          onOpenChange={(o) => !o && setVerdict(undefined)}
          onSubmit={async (note) => {
            try {
              await ThunderSDK.rentalsAdmin.closeReport({
                params: { id },
                body: { valid: verdict, ...(note ? { note } : {}) },
              })
              toast.success(t("Report closed"))
              reload()
              queries.abuseReports().invalidate()
            } catch (e) {
              toast.error(errorMessage(e) ?? t("Could not save"))
              throw e
            }
          }}
        />
      )}
    </Page>
  )
}
