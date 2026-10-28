import * as React from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import {
  IconBuildingStore,
  IconLoader2,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react"
import { usePolling } from "@/hooks/use-polling"
import {
  COMMUNITY_CONSENT_VERSION,
  CommunityConsentDialog,
} from "./CommunityConsent"
import { RentalDue } from "./RentalDue"

import { getLocalPath } from "@/core/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Panel } from "@/components/console/panel"
import { KeyValue } from "@/components/console/key-value"
import { StatusBadge } from "@/components/console/status"
import { useCached } from "@/hooks/use-cached"
import { day, sizeText } from "@/lib/format"
import { money } from "@/lib/plans"
import { queries } from "@/lib/queries"
import { cn, errorMessage } from "@/lib/utils"
import { notifyServersChanged } from "@/pages/servers/events"
import { MachinePicker } from "./MachinePicker"
import { PromptDialog } from "./PromptDialog"
import { RequestDialog } from "./RequestDialog"
import { rentalStatus, type TRental, useRentals } from "./rental"

/** "Rent a server", next to "Add server": the market (PLAN §30.4). */
export function RentServerButton() {
  const { t } = useTranslation()
  if (!ThunderSDK.isPermitted("market", "machines")) return null
  return (
    <Button
      size="sm"
      variant="outline"
      render={<Link to={getLocalPath("infrastructure/market")} />}
      nativeButton={false}
    >
      <IconBuildingStore aria-hidden /> {t("Rent a server")}
    </Button>
  )
}

/**
 * Requests waiting for a machine's owner, and recent refusals, above the
 * servers list. Accepted rentals show up as servers once their partition joins.
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
      // Accepted, partition still on its way.
      (r.status === "active" && !r.server)
  )
  // Acceptance happens elsewhere: check again while something is on the way.
  const waiting = shown.filter((r) => r.status !== "rejected").length
  React.useEffect(() => {
    if (!waiting) return
    const check = () => void reload()
    const timer = setInterval(check, 20_000)
    window.addEventListener("focus", check)
    return () => {
      clearInterval(timer)
      window.removeEventListener("focus", check)
    }
  }, [waiting, reload])
  // One arrived: it's a server now.
  const before = React.useRef(waiting)
  React.useEffect(() => {
    if (waiting < before.current) notifyServersChanged()
    before.current = waiting
  }, [waiting])
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
              <span className="font-medium">
                {r.machine?.name ?? r.plan?.name ?? t("Server")}
              </span>
              <span
                dir="ltr"
                className="font-mono text-xs text-muted-foreground"
              >
                {sizeText(r.size)}
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

/**
 * A rented server's rental (PLAN §26.9, §30): its machine, size, term,
 * status, renewal; an owner's move proposal to answer; Resize, Cancel,
 * dispute, rating and abuse report.
 */
export function RentalPanel({ server }: { server: string }) {
  const { t } = useTranslation()
  const { rentals, reload } = useRentals()
  const rental = rentals?.find((r) => r.server === server)
  // A resize applies on the machine in the background: follow it.
  usePolling(() => {
    if (rental?.resizing) reload()
  }, 5_000)
  const [dialog, setDialog] = React.useState<
    "resize" | "cancel" | "dispute" | "report" | "rate"
  >()
  if (!rental) return null
  const status = rentalStatus(t, rental)
  const can = (action: string) => ThunderSDK.isPermitted("rentals", action)
  const close = () => setDialog(undefined)
  const done = (message: string) => {
    toast.success(message)
    reload()
  }

  const cancel = async () => {
    try {
      await ThunderSDK.rentals.cancel({ params: { id: rental._id } })
      done(t("It ends on {{date}}", { date: day(rental.currentPeriodEnd) }))
      close()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not cancel"))
    }
  }
  const guarded = async (run: () => PromiseLike<unknown>, message: string) => {
    try {
      await run()
      done(message)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save"))
      throw e
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
          ...(rental.machine
            ? [{ label: t("Machine"), value: rental.machine.name }]
            : []),
          {
            label: t("Resources"),
            value: rental.whole
              ? `${t("The whole machine")} · ${sizeText(rental.size)}`
              : sizeText(rental.size),
          },
          ...(rental.plan
            ? [
                {
                  label: t("Price"),
                  value: t("{{price}} per {{interval}}", {
                    price: `⁦${money(rental.plan.price, "usd")}⁩`,
                    interval: t("month"),
                  }),
                },
              ]
            : []),
          ...(rental.term
            ? [
                {
                  label: t("Term"),
                  value: rental.term.until
                    ? t("{{count}} months, kept until {{date}}", {
                        count: rental.term.months,
                        date: day(rental.term.until),
                      })
                    : t("{{count}} months", { count: rental.term.months }),
                },
              ]
            : []),
          {
            label: rental.cancelAtPeriodEnd ? t("Ends on") : t("Renews on"),
            value: day(rental.currentPeriodEnd),
          },
          ...(rental.uptime !== undefined
            ? [
                {
                  label: t("Uptime this period"),
                  value: `${rental.uptime.toFixed(2)}%`,
                },
              ]
            : []),
          ...(rental.nextSize
            ? [
                {
                  label: t("Next size"),
                  value: t("{{plan}} at {{price}} a month, from {{date}}", {
                    plan: rental.nextSize.plan,
                    price: money(rental.nextSize.price, "usd"),
                    date: day(rental.nextSize.at),
                  }),
                },
              ]
            : []),
          ...(rental.pendingChange
            ? [
                {
                  label: t("Resize requested"),
                  value: rental.resizeTo
                    ? t("{{size}}, waiting for the owner", {
                        size: rental.resizeTo,
                      })
                    : t("Waiting for the owner"),
                },
              ]
            : []),
          ...(rental.stars
            ? [{ label: t("Your rating"), value: "★".repeat(rental.stars) }]
            : []),
        ]}
      />
      {rental.endAt && (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning-foreground">
          {t(
            "Its owner stops renting it out: it ends on {{date}}, after your term and paid month. Rent another machine and move your projects before then.",
            { date: day(rental.endAt) }
          )}
        </p>
      )}
      {rental.lostAt && (
        <p className="rounded-lg bg-destructive-soft px-3 py-2 text-[13px] text-destructive-foreground">
          {t(
            "Its machine was down for more than 72 hours, so the rental ended on {{date}}. The downtime came back to your wallet.",
            { date: day(rental.lostAt) }
          )}
        </p>
      )}
      {rental.proposal && <Proposal rental={rental} onDone={reload} />}
      {rental.resizing && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg bg-info-soft px-3 py-2 text-[13px] text-info-foreground"
        >
          <IconLoader2 className="size-4 animate-spin" aria-hidden />
          {t(
            "Resizing to {{size}} on its machine. It keeps running; this takes a moment.",
            { size: rental.plan?.name ?? "" }
          )}
        </p>
      )}
      {rental.resizeError && (
        <p className="rounded-lg bg-destructive-soft px-3 py-2 text-[13px] text-destructive-foreground">
          {t("Its machine couldn't apply the resize: {{reason}}", {
            reason: rental.resizeError,
          })}
        </p>
      )}
      {rental.moving && (
        <p className="rounded-lg bg-info-soft px-3 py-2 text-[13px] text-info-foreground">
          {t(
            "It's moving to another machine: it's offline for a few minutes, then everything is as before."
          )}
        </p>
      )}
      {rental.held && (
        <p className="rounded-lg bg-destructive-soft px-3 py-2 text-[13px] text-destructive-foreground">
          {t(
            "Huruf stopped it. Its data is kept: contact support to start it again."
          )}
        </p>
      )}
      {rental.status === "suspended" && !rental.held && (
        <p className="rounded-lg bg-destructive-soft px-3 py-2 text-[13px] text-destructive-foreground">
          {t(
            "Stopped because it couldn't renew. Its data is kept for a while: add funds on the Billing page and it starts again."
          )}
        </p>
      )}
      <RentalDue rental={rental} onPaid={reload} />
      {rental.dispute && (
        <p className="rounded-lg bg-info-soft px-3 py-2 text-[13px] text-info-foreground">
          {t("Your dispute is open: Huruf reviews it and tells you by email.")}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pb-2">
        {rental.status === "active" && !rental.cancelAtPeriodEnd && (
          <>
            {rental.pendingChange && can("withdrawResize") && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await ThunderSDK.rentals.withdrawResize({
                      params: { id: rental._id },
                    })
                    toast.success(t("Resize canceled"))
                    reload()
                  } catch (e) {
                    toast.error(errorMessage(e) ?? t("Could not save"))
                  }
                }}
              >
                {t("Cancel resize")}
              </Button>
            )}
            {can("resize") && !rental.pendingChange && !rental.whole && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialog("resize")}
              >
                {t("Resize")}
              </Button>
            )}
            {can("cancel") && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive-foreground"
                onClick={() => setDialog("cancel")}
              >
                {t("Cancel rental")}
              </Button>
            )}
          </>
        )}
        {can("rateMachine") && rental.matured && (
          <Button size="sm" variant="ghost" onClick={() => setDialog("rate")}>
            {t("Rate this machine")}
          </Button>
        )}
        {can("dispute") && rental.matured && !rental.dispute && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDialog("dispute")}
          >
            {t("Open a dispute")}
          </Button>
        )}
        {can("report") && (
          <Button size="sm" variant="ghost" onClick={() => setDialog("report")}>
            {t("Report abuse")}
          </Button>
        )}
      </div>
      {dialog === "resize" && rental.machine && (
        <RequestDialog
          open
          onOpenChange={close}
          onDone={reload}
          resize={{
            rental: rental._id,
            machine: rental.machine._id,
            size: {
              vcpu: rental.size.cpus,
              memMb: rental.size.memMb,
              diskGb: rental.size.diskGb,
            },
          }}
        />
      )}
      {dialog === "rate" && (
        <RateDialog rental={rental} onOpenChange={close} onDone={reload} />
      )}
      {dialog === "dispute" && (
        <PromptDialog
          title={t("Open a dispute")}
          description={t(
            "Say what went wrong. The machine's earnings are frozen while Huruf reviews it, with its measured uptime and speed; a refund goes to your wallet."
          )}
          textLabel={t("What happened")}
          minLength={10}
          submitLabel={t("Open the dispute")}
          onOpenChange={close}
          onSubmit={(reason) =>
            guarded(
              () =>
                ThunderSDK.rentals.dispute({
                  params: { id: rental._id },
                  body: { reason },
                }),
              t("Dispute opened")
            )
          }
        />
      )}
      {dialog === "report" && (
        <PromptDialog
          title={t("Report abuse")}
          description={t(
            "For abuse by the machine's owner or on it: Huruf's team reviews every report."
          )}
          textLabel={t("What happened")}
          minLength={10}
          submitLabel={t("Send the report")}
          onOpenChange={close}
          onSubmit={(text) =>
            guarded(
              () =>
                ThunderSDK.rentals.report({
                  body: { subscription: rental._id, text },
                }),
              t("Report sent")
            )
          }
        />
      )}
      <ConfirmDialog
        open={dialog === "cancel"}
        onOpenChange={(o) => !o && close()}
        title={t("Cancel this rental?")}
        description={t(
          "It keeps running until {{date}}, the end of the paid month, then it's deleted with everything on it. The paid month isn't refunded.",
          { date: day(rental.currentPeriodEnd) }
        )}
        confirmLabel={t("Cancel rental")}
        onConfirm={cancel}
      />
    </Panel>
  )
}

/** An owner's move proposal (PLAN §30.8): accept, pick another machine, or decline. */
function Proposal({ rental, onDone }: { rental: TRental; onDone: () => void }) {
  const { t } = useTranslation()
  const p = rental.proposal!
  const [picking, setPicking] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  // A move onto a community machine waits for the renter's consent.
  const [consenting, setConsenting] = React.useState<{
    to?: string
    name?: string
  }>()
  const can = ThunderSDK.isPermitted("rentals", "acceptProposal")
  const needsConsent = (community: boolean) =>
    community && rental.consentVersion !== COMMUNITY_CONSENT_VERSION
  const accept = (target?: { to: string; name: string; community: boolean }) =>
    needsConsent(target ? target.community : p.community)
      ? setConsenting({ to: target?.to, name: target?.name ?? p.toName })
      : answer(true, target?.to)
  const answer = async (accept: boolean, to?: string, consent?: boolean) => {
    setBusy(true)
    try {
      if (accept) {
        await ThunderSDK.rentals.acceptProposal({
          params: { id: rental._id },
          body: {
            ...(to ? { to } : {}),
            ...(consent ? { communityConsent: COMMUNITY_CONSENT_VERSION } : {}),
          },
        })
        toast.success(t("Moving: it's offline for a few minutes"))
      } else {
        await ThunderSDK.rentals.declineProposal({ params: { id: rental._id } })
        toast.success(t("Declined: it stays where it is"))
      }
      setPicking(false)
      onDone()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-info-soft px-3 py-2 text-[13px] text-info-foreground">
      <p>
        {t(
          "Its owner asks to move it to {{name}}. If you accept, it moves right away (offline for a few minutes); its price there, {{price}} a month, starts at your next renewal. Answer by {{date}}; nothing changes if you decline.",
          {
            name: p.toName ?? t("another machine"),
            price: `⁦${money(p.price, "usd")}⁩`,
            date: day(p.expiresAt),
          }
        )}
        {p.reason && <span className="block text-xs">{p.reason}</span>}
      </p>
      {can && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="h-7"
            disabled={busy}
            onClick={() => accept()}
          >
            {t("Accept the move")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            disabled={busy}
            onClick={() => setPicking(!picking)}
          >
            {t("Pick another machine")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            disabled={busy}
            onClick={() => answer(false)}
          >
            {t("Decline")}
          </Button>
        </div>
      )}
      {picking && (
        <OtherTargets
          rental={rental._id}
          busy={busy}
          onPick={(target) =>
            accept({
              to: target.server,
              name: target.name,
              community: target.community,
            })
          }
        />
      )}
      {consenting && (
        <CommunityConsentDialog
          machine={consenting.name}
          onOpenChange={(open) => !open && setConsenting(undefined)}
          onConfirm={() => answer(true, consenting.to, true)}
        />
      )}
    </div>
  )
}

function OtherTargets({
  rental,
  busy,
  onPick,
}: {
  rental: string
  busy: boolean
  onPick: (target: { server: string; name: string; community: boolean }) => void
}) {
  const { t } = useTranslation()
  const targets = useCached(queries.proposalTargets(rental)).data
  const [pick, setPick] = React.useState<string>()
  if (!targets) return <p className="text-xs">{t("Loading…")}</p>
  if (!targets.length)
    return <p className="text-xs">{t("No other machine has room for it.")}</p>
  return (
    <div className="flex flex-col gap-2 text-foreground">
      <MachinePicker
        machines={targets.map((m) => ({ ...m, fits: true }))}
        pick={pick}
        onPick={setPick}
      />
      <Button
        size="sm"
        className="h-7 self-start"
        disabled={busy || !pick}
        onClick={() => {
          const target = targets.find((m) => m.server === pick)
          if (target) onPick(target)
        }}
      >
        {t("Move there")}
      </Button>
    </div>
  )
}

/** 1–5 stars, after a paid month (PLAN §30.10). */
function RateDialog({
  rental,
  onOpenChange,
  onDone,
}: {
  rental: TRental
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [stars, setStars] = React.useState(rental.stars ?? 0)
  return (
    <PromptDialog
      title={t("Rate this machine")}
      description={
        <span className="flex flex-col gap-2">
          <span>
            {t(
              "Once a paid month has ended. Ratings from renters who paid more count more."
            )}
          </span>
          <span
            role="radiogroup"
            aria-label={t("Stars")}
            className="flex gap-1 text-brand-text"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={stars === n}
                aria-label={t("{{count}} stars", { count: n })}
                className={cn(
                  "rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                onClick={() => setStars(n)}
              >
                {n <= stars ? (
                  <IconStarFilled className="size-5" aria-hidden />
                ) : (
                  <IconStar className="size-5" aria-hidden />
                )}
              </button>
            ))}
          </span>
        </span>
      }
      textLabel={t("Comment (optional)")}
      required={false}
      submitLabel={t("Save the rating")}
      onOpenChange={onOpenChange}
      onSubmit={async (comment) => {
        if (!stars) {
          toast.error(t("Pick how many stars"))
          throw new Error()
        }
        try {
          await ThunderSDK.rentals.rateMachine({
            params: { id: rental._id },
            body: { stars, ...(comment ? { comment } : {}) },
          })
          toast.success(t("Thanks for rating it"))
          onDone()
        } catch (e) {
          toast.error(errorMessage(e) ?? t("Could not save"))
          throw e
        }
      }}
    />
  )
}
