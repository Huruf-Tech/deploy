import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconFlag,
  IconScale,
  IconServer2,
  IconServerBolt,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/console/page-header"
import { DataTable } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { StatusBadge } from "@/components/console/status"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useCached } from "@/hooks/use-cached"
import { ago, gbOfMb, sizeText } from "@/lib/format"
import { money } from "@/lib/plans"
import { queries } from "@/lib/queries"
import { errorMessage } from "@/lib/utils"
import { PromptDialog } from "@/pages/rentals/PromptDialog"
import { MachineRentals } from "@/pages/rentals/HostingPanel"

type TWaiting = Awaited<
  ReturnType<typeof ThunderSDK.rentalsAdmin.waiting>
>[number]

/** A machine's rentals, any owner's, with an admin's actions (PLAN §30.2). */
function MachineRentalsDialog({
  machine,
  onOpenChange,
}: {
  machine: { id: string; name: string }
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { data, reload } = useCached(queries.adminMachine(machine.id))
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("Rentals on {{name}}", { name: machine.name })}
          </DialogTitle>
          <DialogDescription>
            {data
              ? t("Security held: {{amount}} of {{cap}}", {
                  amount: money(data.security.amount, "usd"),
                  cap: money(data.security.cap, "usd"),
                })
              : t("Loading…")}
          </DialogDescription>
        </DialogHeader>
        {data &&
          (data.rentals.length ? (
            <MachineRentals
              info={data}
              asAdmin
              onChanged={() => {
                reload()
                queries.rentalCapacity().invalidate()
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("No rentals on it now.")}
            </p>
          ))}
      </DialogContent>
    </Dialog>
  )
}

/** Recreates a stuck rental's partition on its machine. */
function RetryDialog({
  item,
  onOpenChange,
  onDone,
}: {
  item: TWaiting
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = React.useState(false)
  const retry = async () => {
    setBusy(true)
    try {
      await ThunderSDK.rentalsAdmin.recreatePartition({
        params: { id: item._id },
        body: {},
      })
      toast.success(t("Setting it up again"))
      onDone()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not try again"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("Set up {{plan}} for {{tenant}} again", {
              plan: item.plan ?? "—",
              tenant: item.tenantName ?? "—",
            })}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Recreates its partition on {{machine}}. Nothing is charged again.",
              { machine: item.host ?? t("its machine") }
            )}
          </DialogDescription>
        </DialogHeader>
        {item.error && (
          <p className="text-[13px] break-words text-destructive-foreground">
            {item.error}
          </p>
        )}
        <DialogFooter>
          <Button onClick={retry} disabled={busy}>
            {t("Try again")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Approved rentals still without a server: stuck ones say why, with a retry
 * and a refund; the rest are still being set up.
 */
function NeedsAttention() {
  const { t } = useTranslation()
  const { data, reload } = useCached(queries.rentalWaiting())
  const [retrying, setRetrying] = React.useState<TWaiting | null>(null)
  const [refunding, setRefunding] = React.useState<TWaiting | null>(null)
  const canRetry = ThunderSDK.isPermitted("rentalsAdmin", "recreatePartition")
  const canRefund = ThunderSDK.isPermitted("rentalsAdmin", "refund")
  if (!data?.length) return null

  const changed = () => {
    reload()
    queries.rentalCapacity().invalidate()
  }
  const refund = async (reason?: string) => {
    if (!refunding) return
    try {
      const { amount } = await ThunderSDK.rentalsAdmin.refund({
        params: { id: refunding._id },
        body: reason ? { reason } : {},
      })
      toast.success(
        t("Refunded {{amount}} to the customer's wallet", {
          amount: money(amount, "usd"),
        })
      )
      setRefunding(null)
      changed()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not refund it"))
    }
  }

  return (
    <section aria-labelledby="attention-title" className="flex flex-col gap-2">
      <div>
        <h2
          id="attention-title"
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <IconAlertTriangle className="size-4" aria-hidden />{" "}
          {t("Needs attention")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("Approved rentals that don't have a server yet.")}
        </p>
      </div>
      <div className="overflow-x-auto">
        <DataTable
          label={t("Needs attention")}
          rows={data}
          rowId={(r) => r._id}
          columns={[
            {
              id: "tenant",
              header: t("Tenant"),
              sortValue: (r) => r.tenantName ?? "",
              cell: (r) => (
                <div className="min-w-0">
                  <div className="font-medium">{r.tenantName ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.plan ?? "—"} · <span dir="ltr">{sizeText(r.size)}</span>
                  </div>
                </div>
              ),
            },
            {
              id: "machine",
              header: t("Machine"),
              cell: (r) => r.host ?? "—",
            },
            {
              id: "since",
              header: t("Since"),
              sortValue: (r) => new Date(r.since).getTime(),
              className: "whitespace-nowrap text-xs",
              cell: (r) => ago(r.since),
            },
            {
              id: "state",
              header: t("Status"),
              cell: (r) =>
                r.error ? (
                  <p className="max-w-md text-xs break-words text-destructive-foreground">
                    {r.error}
                  </p>
                ) : (
                  <StatusBadge state="deploying" label={t("Being set up")} />
                ),
            },
            {
              id: "actions",
              header: <span className="sr-only">{t("Actions")}</span>,
              align: "end",
              cell: (r) => (
                <div className="flex justify-end gap-1">
                  {canRetry && (
                    <Button
                      size="sm"
                      variant={r.error ? "default" : "ghost"}
                      className="h-7"
                      onClick={() => setRetrying(r)}
                    >
                      {t("Try again")}
                    </Button>
                  )}
                  {canRefund && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => setRefunding(r)}
                    >
                      {t("Refund")}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
      {retrying && (
        <RetryDialog
          item={retrying}
          onOpenChange={(o) => !o && setRetrying(null)}
          onDone={changed}
        />
      )}
      <ConfirmDialog
        open={!!refunding}
        onOpenChange={(o) => !o && setRefunding(null)}
        title={t("Refund {{plan}} for {{tenant}}?", {
          plan: refunding?.plan ?? "—",
          tenant: refunding?.tenantName ?? "—",
        })}
        description={t(
          "Gives this period's charge back to the customer's wallet and removes the rental."
        )}
        confirmLabel={t("Refund and remove")}
        reasonLabel={t("Reason for the customer (optional)")}
        onConfirm={refund}
      />
    </section>
  )
}

/**
 * Per machine in the market (PLAN §30): what renters take, what its owner's
 * own partitions take, what's free, and revenue against cost.
 */
function Capacity() {
  const { t } = useTranslation()
  const data = useCached(queries.rentalCapacity()).data
  const [open, setOpen] = React.useState<{ id: string; name: string }>()
  if (!data?.machines.length) return null
  return (
    <section aria-labelledby="capacity-title" className="flex flex-col gap-2">
      <div>
        <h2
          id="capacity-title"
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <IconServer2 className="size-4" aria-hidden /> {t("Capacity")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t(
            "Machines in the market. Memory is what runs out, since it's never shared."
          )}
        </p>
      </div>
      <div className="overflow-x-auto">
        <DataTable
          label={t("Capacity")}
          rows={data.machines}
          rowId={(m) => m._id}
          columns={[
            {
              id: "machine",
              header: t("Machine"),
              cell: (m) => (
                <div className="min-w-0">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.forRent ? t("For rent") : t("Not for rent")}
                    {!m.accepting && ` · ${t("not taking rentals")}`}
                  </div>
                </div>
              ),
            },
            {
              id: "memory",
              header: t("Memory: rented / owner's / free"),
              className: "whitespace-nowrap tabular-nums",
              cell: (m) => (
                <span dir="ltr">
                  {gbOfMb(m.rentedMemMb)} / {gbOfMb(m.ownMemMb)} /{" "}
                  {gbOfMb(m.freeMemMb)} GB
                </span>
              ),
            },
            {
              id: "rentals",
              header: t("Rentals"),
              align: "end",
              className: "tabular-nums",
              cell: (m) => m.rentals,
            },
            {
              id: "money",
              header: t("Earns / costs a month"),
              align: "end",
              className: "whitespace-nowrap tabular-nums",
              cell: (m) => (
                <span dir="ltr">
                  {money(m.revenue, "usd")} / {money(m.cost, "usd")}
                </span>
              ),
            },
            {
              id: "actions",
              header: <span className="sr-only">{t("Actions")}</span>,
              align: "end",
              cell: (m) =>
                m.rentals > 0 &&
                ThunderSDK.isPermitted("rentalsAdmin", "machine") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => setOpen({ id: m._id, name: m.name })}
                  >
                    {t("Rentals")}
                  </Button>
                ),
            },
          ]}
        />
      </div>
      {open && (
        <MachineRentalsDialog
          machine={open}
          onOpenChange={(o) => !o && setOpen(undefined)}
        />
      )}
    </section>
  )
}

type TDispute = Awaited<
  ReturnType<typeof ThunderSDK.rentalsAdmin.listDisputes>
>[number]
type TRevert = Awaited<
  ReturnType<typeof ThunderSDK.rentalsAdmin.listReverts>
>[number]

/** A section of the page: heading, one-line description, its table. */
function Section({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string
  icon: typeof IconServer2
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-2">
      <div>
        <h2
          id={`${id}-title`}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <Icon className="size-4" aria-hidden /> {title}
        </h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  )
}

/** What the measured evidence of a dispute says, in one line. */
function evidenceText(
  t: (key: string, options?: Record<string, unknown>) => string,
  evidence: TDispute["evidence"]
) {
  const machine = evidence.machine as
    { uptime30d?: number; rttMs?: number } | null | undefined
  const period = evidence.period as
    { paid?: number; downtimeMs?: number } | null | undefined
  return [
    machine?.uptime30d !== undefined &&
      t("{{n}}% up in 30 days", { n: machine.uptime30d.toFixed(2) }),
    machine?.rttMs !== undefined &&
      t("{{ms}} ms latency", { ms: Math.round(machine.rttMs) }),
    period?.downtimeMs !== undefined &&
      t("{{min}} min down this period", {
        min: Math.round(period.downtimeMs / 60_000),
      }),
    period?.paid !== undefined &&
      t("{{amount}} paid", { amount: money(period.paid, "usd") }),
  ]
    .filter(Boolean)
    .join(" · ")
}

/** Open disputes (PLAN §30.9): evidence, and a refund from the machine's money. */
function Disputes() {
  const { t } = useTranslation()
  const { data, reload } = useCached(queries.disputes("open"))
  const [deciding, setDeciding] = React.useState<TDispute>()
  if (!data?.length) return null
  return (
    <Section
      id="disputes"
      icon={IconScale}
      title={t("Disputes")}
      description={t(
        "The machine's money is frozen until you decide; a refund is paid from it to the renter's wallet."
      )}
    >
      <DataTable
        label={t("Disputes")}
        rows={data}
        rowId={(d) => d._id}
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
            header: t("Reason and evidence"),
            cell: (d) => (
              <div className="max-w-md min-w-0">
                <p className="break-words">{d.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {evidenceText(t, d.evidence) || "—"}
                </p>
              </div>
            ),
          },
          {
            id: "held",
            header: t("Held"),
            align: "end",
            className: "whitespace-nowrap tabular-nums",
            cell: (d) => money(d.held, "usd"),
          },
          {
            id: "when",
            header: t("Opened"),
            sortValue: (d) => new Date(d.createdAt).getTime(),
            className: "whitespace-nowrap text-xs",
            cell: (d) => ago(d.createdAt),
          },
          {
            id: "actions",
            header: <span className="sr-only">{t("Actions")}</span>,
            align: "end",
            cell: (d) =>
              ThunderSDK.isPermitted("rentalsAdmin", "resolveDispute") && (
                <Button
                  size="sm"
                  className="h-7"
                  onClick={() => setDeciding(d)}
                >
                  {t("Decide")}
                </Button>
              ),
          },
        ]}
      />
      {deciding && (
        <PromptDialog
          title={t("Decide the dispute")}
          description={t(
            "Up to {{amount}} is held for this machine. 0 refunds nothing; both sides are told.",
            { amount: money(deciding.held, "usd") }
          )}
          amount={{ label: t("Refund ($)"), max: deciding.held, initial: 0 }}
          textLabel={t("Note for both sides (optional)")}
          required={false}
          submitLabel={t("Decide")}
          onOpenChange={(o) => !o && setDeciding(undefined)}
          onSubmit={async (note, refund) => {
            try {
              await ThunderSDK.rentalsAdmin.resolveDispute({
                params: { id: deciding._id },
                body: { refund, ...(note ? { note } : {}) },
              })
              toast.success(t("Dispute decided"))
              reload()
            } catch (e) {
              toast.error(errorMessage(e) ?? t("Could not save"))
              throw e
            }
          }}
        />
      )}
    </Section>
  )
}

/** Claims an owner wants back from a wallet that moved since (PLAN §30.7). */
function Reverts() {
  const { t } = useTranslation()
  const { data, reload } = useCached(queries.claimReverts())
  const [deciding, setDeciding] = React.useState<TRevert>()
  if (!data?.length) return null
  return (
    <Section
      id="reverts"
      icon={IconArrowBackUp}
      title={t("Claims to take back")}
      description={t(
        "The wallet moved since the claim: approve at most what wasn't spent, or refuse if a top-up looks like card money coming back as earnings."
      )}
    >
      <DataTable
        label={t("Claims to take back")}
        rows={data}
        rowId={(r) => r._id}
        columns={[
          {
            id: "owner",
            header: t("Owner"),
            cell: (r) => (
              <div className="min-w-0">
                <div className="font-medium">{r.ownerName ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {t("claimed {{when}}", { when: ago(r.claimedAt) })}
                </div>
              </div>
            ),
          },
          {
            id: "amount",
            header: t("Claim / at most"),
            align: "end",
            className: "whitespace-nowrap tabular-nums",
            cell: (r) => (
              <span dir="ltr">
                {money(r.amount, "usd")} / {money(r.max, "usd")}
              </span>
            ),
          },
          {
            id: "since",
            header: t("Wallet since"),
            cell: (r) => (
              <ul className="text-xs text-muted-foreground">
                {r.transactions.slice(0, 5).map((tx, i) => (
                  <li key={i} dir="ltr" className="tabular-nums">
                    {tx.type === "debit" ? "−" : "+"}
                    {money(Math.abs(tx.amount), "usd")}{" "}
                    {typeof tx.description === "string" ? tx.description : ""}
                  </li>
                ))}
                {r.transactions.length > 5 && (
                  <li>
                    {t("and {{count}} more", {
                      count: r.transactions.length - 5,
                    })}
                  </li>
                )}
              </ul>
            ),
          },
          {
            id: "actions",
            header: <span className="sr-only">{t("Actions")}</span>,
            align: "end",
            cell: (r) =>
              ThunderSDK.isPermitted("rentalsAdmin", "decideRevert") && (
                <Button
                  size="sm"
                  className="h-7"
                  onClick={() => setDeciding(r)}
                >
                  {t("Decide")}
                </Button>
              ),
          },
        ]}
      />
      {deciding && (
        <PromptDialog
          title={t("Take the claim back")}
          description={t(
            "Moves up to {{amount}} from the owner's wallet back to their earnings. 0 refuses.",
            { amount: money(deciding.max, "usd") }
          )}
          amount={{ label: t("Amount ($)"), max: deciding.max }}
          textLabel={t("Note (optional)")}
          required={false}
          submitLabel={t("Decide")}
          onOpenChange={(o) => !o && setDeciding(undefined)}
          onSubmit={async (note, amount) => {
            try {
              await ThunderSDK.rentalsAdmin.decideRevert({
                params: { id: deciding._id },
                body: { amount, ...(note ? { note } : {}) },
              })
              toast.success(amount ? t("Taken back") : t("Refused"))
              reload()
            } catch (e) {
              toast.error(errorMessage(e) ?? t("Could not save"))
              throw e
            }
          }}
        />
      )}
    </Section>
  )
}

/** Abuse reports (PLAN §30.10). */
function Reports() {
  const { t } = useTranslation()
  const { data, reload } = useCached(queries.abuseReports())
  if (!data?.length) return null
  const close = async (id: string) => {
    try {
      await ThunderSDK.rentalsAdmin.closeReport({ params: { id } })
      toast.success(t("Report closed"))
      reload()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save"))
    }
  }
  return (
    <Section
      id="reports"
      icon={IconFlag}
      title={t("Abuse reports")}
      description={t(
        "Suspend or delete a rental from its machine's page when a report holds."
      )}
    >
      <DataTable
        label={t("Abuse reports")}
        rows={data}
        rowId={(r) => r._id}
        columns={[
          {
            id: "who",
            header: t("From"),
            cell: (r) => (
              <div className="min-w-0">
                <div className="font-medium">{r.tenantName ?? "—"}</div>
                <div
                  dir="ltr"
                  className="font-mono text-xs text-muted-foreground"
                >
                  {r.machine ?? r.subscription}
                </div>
              </div>
            ),
          },
          {
            id: "text",
            header: t("Report"),
            cell: (r) => <p className="max-w-md break-words">{r.text}</p>,
          },
          {
            id: "when",
            header: t("Sent"),
            className: "whitespace-nowrap text-xs",
            cell: (r) => ago(r.createdAt),
          },
          {
            id: "actions",
            header: <span className="sr-only">{t("Actions")}</span>,
            align: "end",
            cell: (r) =>
              ThunderSDK.isPermitted("rentalsAdmin", "closeReport") && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  onClick={() => close(r._id)}
                >
                  {t("Close")}
                </Button>
              ),
          },
        ]}
      />
    </Section>
  )
}

/**
 * Admin → Rentals (PLAN §30.2): oversight of the market. Owners accept
 * requests; admins handle disputes, claims to take back, abuse reports and
 * rentals that didn't arrive, and see the market's capacity.
 */
export default function RentalsAdmin() {
  const { t } = useTranslation()
  const disputes = useCached(queries.disputes("open")).data
  const reverts = useCached(queries.claimReverts()).data
  const reports = useCached(queries.abuseReports()).data
  const waiting = useCached(queries.rentalWaiting()).data
  const quiet =
    disputes &&
    reverts &&
    reports &&
    waiting &&
    !disputes.length &&
    !reverts.length &&
    !reports.length &&
    !waiting.some((w) => w.error)
  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Rentals")}
        description={t(
          "Oversight of the market: disputes, claims to take back, abuse reports, rentals that didn't arrive, and capacity. Machine owners accept requests themselves."
        )}
      />
      {quiet && (
        <EmptyState icon={IconServerBolt} title={t("Nothing needs you.")} />
      )}
      <Disputes />
      <Reverts />
      <Reports />
      <NeedsAttention />
      <Capacity />
    </Page>
  )
}
