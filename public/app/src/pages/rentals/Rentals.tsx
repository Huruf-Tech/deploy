import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import { IconServerBolt } from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Panel } from "@/components/console/panel"
import { KeyValue } from "@/components/console/key-value"
import { StatusBadge } from "@/components/console/status"
import { errorMessage } from "@/lib/utils"
import { money } from "@/lib/plans"
import { notifyServersChanged } from "@/pages/servers/events"
import { RentDialog } from "./RentDialog"
import { rentalStatus, sizeText, useRentals } from "./rental"

/** "Rent a server", next to "Add server" (PLAN §26.6). */
export function RentServerButton() {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const { reload } = useRentals()
  if (!ThunderSDK.isPermitted("rentals", "request")) return null
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <IconServerBolt aria-hidden /> {t("Rent a server")}
      </Button>
      {open && (
        <RentDialog
          open
          onOpenChange={setOpen}
          onDone={() => {
            reload()
            notifyServersChanged()
          }}
        />
      )}
    </>
  )
}

/**
 * Requests waiting for Huruf, and recent refusals, above the servers list.
 * Approved rentals show up as servers once their partition joins.
 */
export function RentalRequests() {
  const { t } = useTranslation()
  const { rentals, reload } = useRentals()
  // Refusals stay listed for two weeks.
  const [recent] = React.useState(() => Date.now() - 14 * 86_400_000)
  const shown = (rentals ?? []).filter(
    (r) =>
      r.status === "requested" ||
      (r.status === "rejected" && new Date(r.startedAt).getTime() > recent) ||
      // Approved, partition still on its way.
      (r.status === "active" && !r.server)
  )
  if (!shown.length) return null

  const withdraw = async (id: string) => {
    try {
      await ThunderSDK.rentals.withdraw({ params: { id } })
      toast.success(t("Request withdrawn; the money stays in your wallet"))
      reload()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not withdraw the request"))
    }
  }

  return (
    <Panel title={t("Rented servers on the way")} bodyClassName="p-0">
      <ul className="divide-y">
        {shown.map((r) => {
          const status =
            r.status === "active"
              ? { tone: "info" as const, label: t("Being set up") }
              : rentalStatus(t, r)
          return (
            <li
              key={r._id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-[13px]"
            >
              <span className="font-medium">{r.plan?.name ?? t("Server")}</span>
              <span
                dir="ltr"
                className="font-mono text-xs text-muted-foreground"
              >
                {sizeText(r)}
              </span>
              <StatusBadge tone={status.tone} label={status.label} />
              {r.rejectedReason && (
                <span className="basis-full text-xs text-muted-foreground">
                  {r.rejectedReason}
                </span>
              )}
              {r.status === "requested" &&
                ThunderSDK.isPermitted("rentals", "withdraw") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ms-auto h-7"
                    onClick={() => withdraw(r._id)}
                  >
                    {t("Withdraw")}
                  </Button>
                )}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

/** A rented server's rental: size, status, renewal, Resize and Cancel (PLAN §26.9). */
export function RentalPanel({ server }: { server: string }) {
  const { t } = useTranslation()
  const { rentals, reload } = useRentals()
  const rental = rentals?.find((r) => r.server === server)
  const [resizing, setResizing] = React.useState(false)
  const [canceling, setCanceling] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const catalog = use(
    ThunderSDK.useCaching(
      ["rentals", "catalog"],
      async ({ signal }) => await ThunderSDK.rentals.catalog({ signal })
    )
  ).data
  if (!rental) return null
  const status = rentalStatus(t, rental)
  const plan = catalog?.sizes.find((s) => s._id === rental.plan?._id)
  const resizeTo = catalog?.sizes.find((s) => s._id === rental.pendingChange)
  const day = (d?: string | Date | null) =>
    d ? new Date(d).toLocaleDateString() : "—"

  const cancel = async () => {
    setBusy(true)
    try {
      await ThunderSDK.rentals.cancel({ params: { id: rental._id } })
      toast.success(
        t("It ends on {{date}}", { date: day(rental.currentPeriodEnd) })
      )
      setCanceling(false)
      reload()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not cancel"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel
      title={t("Rental")}
      actions={<StatusBadge tone={status.tone} label={status.label} />}
      bodyClassName="flex flex-col gap-3 py-1"
    >
      <KeyValue
        items={[
          { label: t("Size"), value: rental.plan?.name ?? "—" },
          { label: t("Resources"), value: sizeText(rental) },
          ...(plan
            ? [
                {
                  label: t("Price"),
                  value: t("{{price}} per {{interval}}", {
                    price: `⁦${money(plan.price.amount, plan.price.currency)}⁩`,
                    interval: t(plan.price.interval),
                  }),
                },
              ]
            : []),
          {
            label: rental.cancelAtPeriodEnd ? t("Ends on") : t("Renews on"),
            value: day(rental.currentPeriodEnd),
          },
          ...(resizeTo
            ? [{ label: t("Resize requested"), value: resizeTo.name }]
            : []),
        ]}
      />
      {rental.status === "suspended" && (
        <p className="rounded-lg bg-destructive-soft px-3 py-2 text-[13px] text-destructive-foreground">
          {t(
            "Stopped because it couldn't renew. Its data is kept for a while: add funds on the Billing page and it starts again."
          )}
        </p>
      )}
      {rental.status === "active" && !rental.cancelAtPeriodEnd && (
        <div className="flex flex-wrap gap-2 pb-2">
          {ThunderSDK.isPermitted("rentals", "resize") &&
            !rental.pendingChange && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setResizing(true)}
              >
                {t("Resize")}
              </Button>
            )}
          {ThunderSDK.isPermitted("rentals", "cancel") && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive-foreground"
              onClick={() => setCanceling(true)}
            >
              {t("Cancel rental")}
            </Button>
          )}
        </div>
      )}
      {resizing && plan && (
        <RentDialog
          open
          onOpenChange={setResizing}
          onDone={reload}
          resize={{ rental: rental._id, class: plan.class, plan: plan._id }}
        />
      )}
      <Dialog open={canceling} onOpenChange={setCanceling}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Cancel this rental?")}</DialogTitle>
            <DialogDescription>
              {t(
                "It keeps running until {{date}}, then it's deleted with everything on it. This month isn't refunded.",
                { date: day(rental.currentPeriodEnd) }
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={cancel} disabled={busy}>
              {t("Cancel rental")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
