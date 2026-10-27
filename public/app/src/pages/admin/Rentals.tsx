import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconServer2,
  IconServerBolt,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { ago, dateTime, gbOfMb, sizeText } from "@/lib/format"
import { money } from "@/lib/plans"
import { queries } from "@/lib/queries"
import { errorMessage } from "@/lib/utils"
import { MachinePicker } from "@/pages/rentals/MachinePicker"
import { usable } from "@/pages/rentals/rental"

type TItem = Awaited<ReturnType<typeof ThunderSDK.rentalsAdmin.queue>>[number]
type TWaiting = Awaited<
  ReturnType<typeof ThunderSDK.rentalsAdmin.waiting>
>[number]

/** Picks the machine for a request (PLAN §26.7), then approves it. */
function ApproveDialog({
  item,
  onOpenChange,
  onDone,
}: {
  item: TItem
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const placement = useCached(queries.placementFor(item._id))
  const machines = placement.data
  const [host, setHost] = React.useState<string>()
  const pick = host ?? machines?.find(usable)?.server
  const [busy, setBusy] = React.useState(false)
  const approve = async () => {
    if (!pick) return
    setBusy(true)
    try {
      await ThunderSDK.rentalsAdmin.approve({
        params: { id: item._id },
        body: { host: pick },
      })
      toast.success(
        t(
          "Approved: the first month is charged and the partition is on its way"
        )
      )
      onDone()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not approve it"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("Approve {{plan}} for {{tenant}}", {
              plan: item.plan,
              tenant: item.tenantName ?? item.tenant,
            })}
          </DialogTitle>
          <DialogDescription>{sizeText(item.size)}</DialogDescription>
        </DialogHeader>
        {!machines && placement.error ? (
          <p className="text-[13px] break-words text-destructive-foreground">
            {errorMessage(placement.error) ?? t("Could not load the machines")}
          </p>
        ) : !machines ? (
          <p className="text-sm text-muted-foreground">{t("Loading…")}</p>
        ) : !machines.length ? (
          <p className="text-sm text-muted-foreground">
            {t(
              "No machine of this class takes rentals. Give a machine this class on its page."
            )}
          </p>
        ) : (
          <MachinePicker machines={machines} pick={pick} onPick={setHost} />
        )}
        <DialogFooter>
          <Button onClick={approve} disabled={busy || !pick}>
            {t("Approve and charge")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RejectDialog({
  item,
  onOpenChange,
  onDone,
}: {
  item: TItem
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [reason, setReason] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      if (item.resizeTo) {
        await ThunderSDK.rentalsAdmin.rejectResize({
          params: { id: item._id },
          body: { reason },
        })
      } else {
        await ThunderSDK.rentalsAdmin.reject({
          params: { id: item._id },
          body: { reason },
        })
      }
      toast.success(t("Rejected; the customer is told why"))
      onDone()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not reject it"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {item.resizeTo ? t("Reject the resize") : t("Reject the request")}
            </DialogTitle>
            <DialogDescription>
              {t("The customer sees the reason. Nothing is charged.")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-reason">{t("Reason")}</Label>
            <Input
              id="reject-reason"
              required
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={busy}>
              {t("Reject")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Recreates a stuck rental's partition, on its machine or another one. */
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
  const placement = useCached(queries.placementFor(item._id))
  const machines = placement.data
  const current = machines?.find((m) => m.name === item.host)
  const [host, setHost] = React.useState<string>()
  const pick =
    host ??
    (current && usable(current) ? current : machines?.find(usable))?.server
  const [busy, setBusy] = React.useState(false)
  const retry = async () => {
    setBusy(true)
    try {
      await ThunderSDK.rentalsAdmin.recreatePartition({
        params: { id: item._id },
        // No pick, or its own machine: try again where it is.
        body: pick && pick !== current?.server ? { host: pick } : {},
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
              "Recreates its partition on the machine you pick. Nothing is charged again."
            )}
          </DialogDescription>
        </DialogHeader>
        {item.error && (
          <p className="text-[13px] break-words text-destructive-foreground">
            {item.error}
          </p>
        )}
        {!machines && placement.error ? (
          <p className="text-[13px] break-words text-destructive-foreground">
            {errorMessage(placement.error) ?? t("Could not load the machines")}
          </p>
        ) : !machines ? (
          <p className="text-sm text-muted-foreground">{t("Loading…")}</p>
        ) : !machines.length ? (
          <p className="text-sm text-muted-foreground">
            {t(
              "No machine of this class takes rentals. Give a machine this class on its page."
            )}
          </p>
        ) : (
          <MachinePicker machines={machines} pick={pick} onPick={setHost} />
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
 * Per machine for rent (PLAN §28): what customers rent, what the platform's
 * own partitions take, what's free, and revenue against cost.
 */
function Capacity() {
  const { t } = useTranslation()
  const data = useCached(queries.rentalCapacity()).data
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
            "Machines for rent: give one a class on its page. Memory is what runs out, since it's never shared."
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
                    {m.class}
                    {!m.accepting && ` · ${t("not taking rentals")}`}
                  </div>
                </div>
              ),
            },
            {
              id: "memory",
              header: t("Memory: rented / yours / free"),
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
          ]}
        />
      </div>
    </section>
  )
}

/** Admin → Rentals (PLAN §26.8): requests and resizes waiting for approval. */
export default function RentalsAdmin() {
  const { t } = useTranslation()
  const { data, reload } = useCached(queries.rentalQueue())
  const [approving, setApproving] = React.useState<TItem | null>(null)
  const [rejecting, setRejecting] = React.useState<TItem | null>(null)

  const approveResize = async (item: TItem) => {
    try {
      await ThunderSDK.rentalsAdmin.approveResize({ params: { id: item._id } })
      toast.success(t("Resize approved"))
      reload()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not approve it"))
    }
  }

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Rentals")}
        description={t(
          "Servers customers asked to rent, and resizes. Approving places them on a machine for rent and charges the first month."
        )}
      />
      <NeedsAttention />
      <Capacity />
      {data && !data.length ? (
        <EmptyState
          icon={IconServerBolt}
          title={t("Nothing waits for approval.")}
        />
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            label={t("Rentals")}
            rows={data}
            rowId={(r) => r._id}
            loading={!data}
            columns={[
              {
                id: "tenant",
                header: t("Tenant"),
                sortValue: (r) => r.tenantName ?? "",
                cell: (r) => (
                  <div className="min-w-0">
                    <div className="font-medium">{r.tenantName ?? "—"}</div>
                    <div
                      dir="ltr"
                      className="font-mono text-xs text-muted-foreground"
                    >
                      {r.tenant}
                    </div>
                  </div>
                ),
              },
              {
                id: "what",
                header: t("Request"),
                cell: (r) =>
                  r.resizeTo ? (
                    <span>
                      {t("Resize {{from}} → {{to}}", {
                        from: r.plan,
                        to: r.resizeTo,
                      })}
                    </span>
                  ) : (
                    <div className="min-w-0">
                      <div>{r.plan}</div>
                      <div dir="ltr" className="text-xs text-muted-foreground">
                        {sizeText(r.size)}
                      </div>
                    </div>
                  ),
              },
              {
                id: "when",
                header: t("Asked"),
                sortValue: (r) => new Date(r.requestedAt).getTime(),
                className: "whitespace-nowrap tabular-nums text-xs",
                cell: (r) => dateTime(r.requestedAt),
              },
              {
                id: "actions",
                header: <span className="sr-only">{t("Actions")}</span>,
                align: "end",
                cell: (r) => (
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      className="h-7"
                      onClick={() =>
                        r.resizeTo ? approveResize(r) : setApproving(r)
                      }
                    >
                      {t("Approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => setRejecting(r)}
                    >
                      {t("Reject")}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
      {approving && (
        <ApproveDialog
          item={approving}
          onOpenChange={(o) => !o && setApproving(null)}
          onDone={reload}
        />
      )}
      {rejecting && (
        <RejectDialog
          item={rejecting}
          onOpenChange={(o) => !o && setRejecting(null)}
          onDone={reload}
        />
      )}
    </Page>
  )
}
