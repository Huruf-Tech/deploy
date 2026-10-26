import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconServer2, IconServerBolt } from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
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
import { useFresh } from "@/hooks/use-fresh"
import { money } from "@/lib/plans"
import { errorMessage } from "@/lib/utils"
import { MachinePicker } from "@/pages/rentals/MachinePicker"
import { usable } from "@/pages/rentals/rental"

type TItem = Awaited<ReturnType<typeof ThunderSDK.rentalsAdmin.queue>>[number]

const sizeText = (s: TItem["size"]) =>
  `${s.cpus} vCPU · ${Math.round((s.memMb / 1024) * 10) / 10} GB · ${s.diskGb} GB`

/** Picks the pool machine for a request (PLAN §26.7), then approves it. */
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
  const machines = use(
    ThunderSDK.useCaching(
      ["rentalsAdmin", "placement", item._id],
      async ({ signal }) =>
        await ThunderSDK.rentalsAdmin.placement({
          params: { id: item._id },
          signal,
        })
    )
  ).data
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
        {!machines ? (
          <p className="text-sm text-muted-foreground">{t("Loading…")}</p>
        ) : !machines.length ? (
          <p className="text-sm text-muted-foreground">
            {t(
              "No pool machine of this class takes rentals. Add one, or set a machine's class on its page."
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

const gbOfMb = (mb: number) => Math.round((mb / 1024) * 10) / 10

/**
 * Per class: what's rented of what the pool offers, the spare memory kept
 * for moving rentals off a failed machine, and revenue against cost.
 */
function Capacity() {
  const { t } = useTranslation()
  const data = use(
    ThunderSDK.useCaching(
      ["rentalsAdmin", "capacity"],
      async ({ signal }) => await ThunderSDK.rentalsAdmin.capacity({ signal })
    )
  ).data
  if (!data?.classes.some((c) => c.machines)) return null
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
            "Spare memory is kept to move rentals off a failed machine: the target is {{n}}% per class.",
            { n: data.sparePercent }
          )}
        </p>
      </div>
      <div className="overflow-x-auto">
        <DataTable
          label={t("Capacity")}
          rows={data.classes.filter((c) => c.machines)}
          rowId={(c) => c._id}
          columns={[
            {
              id: "class",
              header: t("Class"),
              cell: (c) => (
                <div className="min-w-0">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("{{n}} machines, {{open}} taking rentals", {
                      n: c.machines,
                      open: c.accepting,
                    })}
                  </div>
                </div>
              ),
            },
            {
              id: "rented",
              header: t("Rented memory"),
              className: "whitespace-nowrap tabular-nums",
              cell: (c) => (
                <span dir="ltr">
                  {gbOfMb(c.rented.memMb)} / {gbOfMb(c.allocatable.memMb)} GB
                </span>
              ),
            },
            {
              id: "spare",
              header: t("Spare"),
              cell: (c) => (
                <StatusBadge
                  tone={c.spare < data.sparePercent ? "warning" : "success"}
                  label={`${c.spare}%`}
                />
              ),
            },
            {
              id: "money",
              header: t("Earns / costs a month"),
              align: "end",
              className: "whitespace-nowrap tabular-nums",
              cell: (c) => (
                <span dir="ltr">
                  {money(c.revenue, "usd")} / {money(c.cost, "usd")}
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
  const request = ThunderSDK.useCaching(
    ["rentalsAdmin", "queue"],
    async ({ signal }) => await ThunderSDK.rentalsAdmin.queue({ signal })
  )
  useFresh(request)
  const { data } = use(request)
  const [approving, setApproving] = React.useState<TItem | null>(null)
  const [rejecting, setRejecting] = React.useState<TItem | null>(null)
  const reload = () => request.invalidate()

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
          "Servers customers asked to rent, and resizes. Approving places them on a pool machine and charges the first month."
        )}
      />
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
                cell: (r) => new Date(r.requestedAt).toLocaleString(),
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
