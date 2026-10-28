import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Panel } from "@/components/console/panel"
import { KeyValue } from "@/components/console/key-value"
import { StatusBadge } from "@/components/console/status"
import { useCached } from "@/hooks/use-cached"
import { ago, day, sizeText, toCents, toDollars } from "@/lib/format"
import { money } from "@/lib/plans"
import { queries } from "@/lib/queries"
import { errorMessage } from "@/lib/utils"
import { isMachine, type TServer } from "@/pages/servers/server"
import { MoveDialog } from "./MoveDialog"
import { PromptDialog } from "./PromptDialog"
import { useIsOwner } from "./rental"

/** A month, in hours (PLAN §30.3). */
const HOURS = 730

type TMachine = NonNullable<
  Awaited<ReturnType<typeof ThunderSDK.hosting.machine>>
>
type TPrices = NonNullable<TMachine["rent"]>["prices"]
type TRequest = Awaited<ReturnType<typeof ThunderSDK.hosting.requests>>[number]

const PRICE_FIELDS = [
  ["vcpu", "Per vCPU"],
  ["memGb", "Per GB of memory"],
  ["diskGb", "Per GB of disk"],
  ["whole", "The whole machine (optional)"],
] as const

/**
 * Renting a machine out (PLAN §30), the owner's side on its page: prices and
 * switches, the requests waiting, the rentals on it with Stop renting and
 * Propose a move, and the machine's security. Admins also get their hand on
 * each rental (suspend, resume, delete, move). Each control shows only with
 * its own permission.
 */
export function HostingPanel({
  server,
  onChanged,
}: {
  server: TServer
  onChanged: () => void
}) {
  if (
    !isMachine(server) ||
    server.pool?.status !== "ready" ||
    !ThunderSDK.isPermitted("hosting", "machine")
  )
    return null
  return <Hosting server={server} onChanged={onChanged} />
}

function Hosting({
  server,
  onChanged,
}: {
  server: TServer
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const { data: info, reload } = useCached(queries.hostingMachine(server._id))
  const isOwner = useIsOwner()
  if (!info) return null
  const changed = () => {
    reload()
    queries.hostingRequests().invalidate()
    onChanged()
  }
  return (
    <Panel
      title={t("Rent it out")}
      description={t(
        "List this machine in the market: renters pay by the month, you earn after each month, minus Huruf's commission."
      )}
      bodyClassName="flex flex-col gap-4 py-2"
    >
      <Settings
        server={server._id}
        info={info}
        editable={isOwner && ThunderSDK.isPermitted("hosting", "updateMachine")}
        onChanged={changed}
      />
      <KeyValue
        items={[
          {
            label: t("Earns / costs a month"),
            value: `${money(info.revenue, "usd")} / ${
              info.monthlyCost ? money(info.monthlyCost, "usd") : "—"
            }`,
          },
          { label: t("Huruf's commission"), value: `${info.commission}%` },
          {
            label: t("Security held"),
            value: t("{{amount}} of {{cap}}", {
              amount: money(info.security.amount, "usd"),
              cap: money(info.security.cap, "usd"),
            }),
          },
        ]}
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        {t(
          "Half of each month at most fills the security, up to the machine's whole monthly price. It's paid out 14 days after the machine leaves properly, and goes to the renters if it leaves before their term."
        )}
      </p>
      <OwnerRequests machine={server._id} onChanged={changed} />
      <MachineRentals info={info} onChanged={changed} />
    </Panel>
  )
}

function Settings({
  server,
  info,
  editable,
  onChanged,
}: {
  server: string
  info: TMachine
  editable: boolean
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const saved = info.rent
  // Dollars per hour, as typed.
  const [prices, setPrices] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(
      PRICE_FIELDS.map(([k]) => [
        k,
        saved?.prices[k] !== undefined ? String(saved.prices[k] / 100) : "",
      ])
    )
  )
  const [traffic, setTraffic] = React.useState(
    saved ? String(toDollars(saved.prices.trafficGb)) : "0.1"
  )
  const [cost, setCost] = React.useState(
    info.monthlyCost ? String(toDollars(info.monthlyCost)) : ""
  )
  const [busy, setBusy] = React.useState(false)

  const cents = (k: string) =>
    prices[k] === "" ? undefined : Number(prices[k]) * 100
  const typed: TPrices | undefined = [
    cents("vcpu"),
    cents("memGb"),
    cents("diskGb"),
  ].every((v) => v !== undefined && v >= 0)
    ? {
        vcpu: cents("vcpu")!,
        memGb: cents("memGb")!,
        diskGb: cents("diskGb")!,
        ...(cents("whole") !== undefined ? { whole: cents("whole") } : {}),
        trafficGb: Math.max(0, toCents(traffic) || 0),
      }
    : undefined

  const save = async (patch: {
    enabled?: boolean
    autoAccept?: boolean
    accepting?: boolean
  }) => {
    if (!typed && (patch.enabled ?? saved?.enabled)) {
      return toast.error(t("Set the prices per vCPU, memory and disk first"))
    }
    setBusy(true)
    try {
      await ThunderSDK.hosting.updateMachine({
        params: { id: server },
        body: {
          ...(typed
            ? {
                rent: {
                  enabled: patch.enabled ?? saved?.enabled ?? false,
                  autoAccept: patch.autoAccept ?? saved?.autoAccept ?? false,
                  prices: typed,
                },
              }
            : {}),
          ...(patch.accepting !== undefined
            ? { accepting: patch.accepting }
            : {}),
          ...(cost !== "" && toCents(cost) >= 0
            ? { monthlyCost: toCents(cost) }
            : {}),
        },
      })
      toast.success(t("Saved"))
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save"))
    } finally {
      setBusy(false)
    }
  }

  const toggle = (
    label: string,
    hint: string,
    checked: boolean,
    onChange: (on: boolean) => void
  ) => (
    <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[13px]">
      <span>
        {label}
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch
        checked={checked}
        disabled={!editable || busy}
        onCheckedChange={onChange}
      />
    </label>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {toggle(
          t("For rent in the market"),
          t("Renters can find and request it."),
          !!saved?.enabled,
          (enabled) => save({ enabled })
        )}
        {toggle(
          t("Accept requests at once"),
          t("Without you: it starts when paid."),
          !!saved?.autoAccept,
          (autoAccept) => save({ autoAccept })
        )}
        {toggle(
          t("Takes new rentals"),
          t("Off keeps its rentals, takes no more."),
          info.accepting,
          (accepting) => save({ accepting })
        )}
      </div>
      <fieldset className="grid gap-3 sm:grid-cols-2" disabled={!editable}>
        <legend className="mb-2 text-[13px] font-medium">
          {t("Prices, in dollars per hour")}
        </legend>
        {PRICE_FIELDS.map(([k, label]) => (
          <div key={k} className="flex flex-col gap-1.5">
            <Label htmlFor={`price-${k}`}>{t(label)}</Label>
            <Input
              id={`price-${k}`}
              type="number"
              dir="ltr"
              min={0}
              step="0.0001"
              value={prices[k]}
              onChange={(e) => setPrices({ ...prices, [k]: e.target.value })}
            />
            <span className="text-xs text-muted-foreground tabular-nums">
              {cents(k) !== undefined
                ? t("{{price}} a month", {
                    price: money(Math.round(cents(k)! * HOURS), "usd"),
                  })
                : "—"}
            </span>
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price-traffic">
            {t("Traffic beyond the allowance ($ per GB)")}
          </Label>
          <Input
            id="price-traffic"
            type="number"
            dir="ltr"
            min={0}
            step="0.01"
            value={traffic}
            onChange={(e) => setTraffic(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price-cost">{t("Monthly cost ($)")}</Label>
          <Input
            id="price-cost"
            type="number"
            dir="ltr"
            min={0}
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">
            {t("What it costs you, for revenue against cost.")}
          </span>
        </div>
      </fieldset>
      {editable && (
        <Button
          size="sm"
          className="self-start"
          disabled={busy}
          onClick={() => save({})}
        >
          {t("Save prices")}
        </Button>
      )}
    </div>
  )
}

/**
 * Requests and resizes waiting for the workspace's machines (PLAN §30.5),
 * one machine's with `machine`. Unanswered requests are declined after 72
 * hours; nothing is charged until accepted.
 */
export function OwnerRequests({
  machine,
  onChanged,
}: {
  machine?: string
  onChanged?: () => void
}) {
  const { t } = useTranslation()
  const { data, reload } = useCached(queries.hostingRequests())
  const isOwner = useIsOwner()
  const [declining, setDeclining] = React.useState<TRequest>()
  const rows = (data ?? []).filter((r) => !machine || r.machine === machine)
  if (!rows.length) return null
  const changed = () => {
    reload()
    onChanged?.()
  }
  const accept = async (r: TRequest) => {
    try {
      if (r.resizeTo) {
        await ThunderSDK.hosting.acceptResize({ params: { id: r._id } })
        toast.success(t("Resize accepted"))
      } else {
        await ThunderSDK.hosting.accept({ params: { id: r._id } })
        toast.success(
          t(
            "Accepted: the first month is charged and the partition is on its way"
          )
        )
      }
      changed()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not accept it"))
    }
  }
  return (
    <section aria-labelledby="requests-title" className="flex flex-col gap-2">
      <h3 id={`requests-title`} className="text-[13px] font-medium">
        {machine
          ? t("Waiting for you")
          : t("Rental requests for your machines")}
      </h3>
      <ul className="flex flex-col divide-y rounded-lg border text-[13px]">
        {rows.map((r) => (
          <li
            key={r._id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2"
          >
            <span className="min-w-0 flex-[1_1_14rem]">
              <span className="font-medium">{r.tenantName ?? "—"}</span>
              {!machine && r.machineName && ` · ${r.machineName}`}
              <span className="block text-xs text-muted-foreground">
                {r.resizeTo
                  ? t("Resize to {{plan}} · {{price}} a month", {
                      plan: r.resizeTo.plan,
                      price: money(r.resizeTo.price, "usd"),
                    })
                  : `${r.whole ? t("The whole machine") : sizeText(r.size)} · ${t(
                      "{{price}} a month",
                      { price: money(r.price, "usd") }
                    )} · ${t("{{count}} months", { count: r.termMonths ?? 1 })}`}
                {" · "}
                {ago(r.requestedAt)}
              </span>
            </span>
            {isOwner && (
              <span className="flex gap-1">
                <Button size="sm" className="h-7" onClick={() => accept(r)}>
                  {t("Accept")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  onClick={() => setDeclining(r)}
                >
                  {t("Decline")}
                </Button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {declining && (
        <PromptDialog
          title={
            declining.resizeTo
              ? t("Decline the resize")
              : t("Decline the request")
          }
          description={t("The renter sees the reason. Nothing is charged.")}
          textLabel={t("Reason")}
          submitLabel={t("Decline")}
          destructive
          onOpenChange={(o) => !o && setDeclining(undefined)}
          onSubmit={async (reason) => {
            try {
              if (declining.resizeTo) {
                await ThunderSDK.hosting.declineResize({
                  params: { id: declining._id },
                  body: { reason },
                })
              } else {
                await ThunderSDK.hosting.decline({
                  params: { id: declining._id },
                  body: { reason },
                })
              }
              toast.success(t("Declined; the renter is told why"))
              changed()
            } catch (e) {
              toast.error(errorMessage(e) ?? t("Could not save"))
              throw e
            }
          }}
        />
      )}
    </section>
  )
}

const labelOf = (r: {
  tenantName?: string
  partition?: string
  plan?: string
}) => `${r.tenantName ?? r.partition} · ${r.plan ?? ""}`

/**
 * The rentals on a machine with their actions: the owner's (stop renting,
 * propose a move) and, with `asAdmin` or the permissions, an admin's.
 */
export function MachineRentals({
  info,
  onChanged,
  asAdmin,
}: {
  info: Pick<TMachine, "rentals">
  onChanged: () => void
  /** Admin → Rentals: no owner actions, whoever owns the workspace. */
  asAdmin?: boolean
}) {
  const { t } = useTranslation()
  const isOwner = useIsOwner() && !asAdmin
  const admin = (action: string) =>
    ThunderSDK.isPermitted("rentalsAdmin", action)
  const [moving, setMoving] = React.useState<{
    id: string
    label: string
    propose: boolean
  }>()
  const [ending, setEnding] = React.useState<TMachine["rentals"][number]>()
  const [canceling, setCanceling] = React.useState<string>()
  const [acting, setActing] = React.useState<{
    id: string
    label: string
    action: "suspend" | "terminate" | "refund"
  }>()
  if (!info.rentals.length) return null

  const act = async (
    id: string,
    action: "suspend" | "resume" | "terminate" | "refund",
    reason?: string
  ) => {
    try {
      if (action === "resume") {
        await ThunderSDK.rentalsAdmin.resume({ params: { id } })
      } else if (action === "refund") {
        const { amount } = await ThunderSDK.rentalsAdmin.refund({
          params: { id },
          body: reason ? { reason } : {},
        })
        toast.success(
          t("Refunded {{amount}} to the customer's wallet", {
            amount: money(amount, "usd"),
          })
        )
        setActing(undefined)
        return onChanged()
      } else {
        await ThunderSDK.rentalsAdmin[action]({
          params: { id },
          body: reason ? { reason } : {},
        })
      }
      toast.success(
        {
          suspend: t("Rental suspended"),
          resume: t("Rental resumed"),
          terminate: t("Rental deleted"),
        }[action]
      )
      setActing(undefined)
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save"))
    }
  }
  const end = async () => {
    if (!ending) return
    try {
      const { endAt } = await ThunderSDK.hosting.end({
        params: { id: ending._id },
      })
      toast.success(t("It ends on {{date}}", { date: day(endAt) }))
      setEnding(undefined)
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save"))
    }
  }
  const cancelMove = async (id: string) => {
    try {
      await ThunderSDK.rentalsAdmin.cancelMove({ params: { id } })
      toast.success(t("Move canceled: it starts again here"))
      setCanceling(undefined)
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not cancel"))
    }
  }

  return (
    <section aria-labelledby="rentals-title" className="flex flex-col gap-2">
      <h3 id="rentals-title" className="text-[13px] font-medium">
        {t("Rentals on it")}
      </h3>
      <ul className="flex flex-col divide-y rounded-lg border text-[13px]">
        {info.rentals.map((r) => (
          <li key={r._id} className="flex flex-col gap-1 px-3 py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <span className="font-medium">{labelOf(r)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {money(r.price, "usd")}
                {r.uptime !== undefined &&
                  ` · ${t("{{n}}% up", { n: r.uptime.toFixed(2) })}`}
              </span>
            </div>
            <span dir="ltr" className="text-xs text-muted-foreground">
              {r.whole ? t("The whole machine") : sizeText(r.size)}
              {r.term?.until &&
                ` · ${t("term until {{date}}", { date: day(r.term.until) })}`}
            </span>
            {r.endAt && (
              <span className="text-xs text-warning-foreground">
                {t("Ends on {{date}}: you stopped renting it out", {
                  date: day(r.endAt),
                })}
              </span>
            )}
            {r.overDisk !== undefined && (
              <span className="text-xs text-destructive-foreground">
                {t("Uses {{gb}} GB of disk, more than its size", {
                  gb: Math.ceil(r.overDisk / 2 ** 30),
                })}
              </span>
            )}
            {r.held && (
              <StatusBadge
                tone="warning"
                label={t("Suspended by an admin: not renewed until resumed")}
              />
            )}
            {r.proposal && (
              <span className="text-xs text-info-foreground">
                {t(
                  "Move to {{name}} proposed: the renter answers by {{date}}",
                  {
                    name: r.proposal.toName ?? r.proposal.to,
                    date: day(r.proposal.expiresAt),
                  }
                )}
              </span>
            )}
            {r.moving ? (
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-info-foreground">
                {t("Moving to {{name}}", {
                  name: r.moving.toName ?? r.moving.to,
                })}
                {admin("cancelMove") && (
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() => setCanceling(r._id)}
                  >
                    {t("Cancel move")}
                  </button>
                )}
              </div>
            ) : (
              <>
                {r.lastMove?.error && r.lastMove.error !== "Canceled" && (
                  <span className="text-xs text-destructive-foreground">
                    {t("The last move failed: {{error}}", {
                      error: r.lastMove.error,
                    })}
                  </span>
                )}
                <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground [&>button]:underline [&>button]:underline-offset-2 [&>button:hover]:text-foreground">
                  {isOwner &&
                    ThunderSDK.isPermitted("hosting", "propose") &&
                    r.status !== "suspended" &&
                    !r.proposal && (
                      <button
                        type="button"
                        onClick={() =>
                          setMoving({
                            id: r._id,
                            label: labelOf(r),
                            propose: true,
                          })
                        }
                      >
                        {t("Propose a move")}
                      </button>
                    )}
                  {isOwner &&
                    ThunderSDK.isPermitted("hosting", "end") &&
                    !r.endAt && (
                      <button type="button" onClick={() => setEnding(r)}>
                        {t("Stop renting it out")}
                      </button>
                    )}
                  {admin("move") &&
                    admin("moveTargets") &&
                    r.status !== "suspended" && (
                      <button
                        type="button"
                        onClick={() =>
                          setMoving({
                            id: r._id,
                            label: labelOf(r),
                            propose: false,
                          })
                        }
                      >
                        {t("Move (admin)")}
                      </button>
                    )}
                  {r.held
                    ? admin("resume") && (
                        <button
                          type="button"
                          onClick={() => act(r._id, "resume")}
                        >
                          {t("Resume")}
                        </button>
                      )
                    : admin("suspend") &&
                      r.status !== "suspended" && (
                        <button
                          type="button"
                          onClick={() =>
                            setActing({
                              id: r._id,
                              label: labelOf(r),
                              action: "suspend",
                            })
                          }
                        >
                          {t("Suspend")}
                        </button>
                      )}
                  {admin("refund") && (
                    <button
                      type="button"
                      onClick={() =>
                        setActing({
                          id: r._id,
                          label: labelOf(r),
                          action: "refund",
                        })
                      }
                    >
                      {t("Refund")}
                    </button>
                  )}
                  {admin("terminate") && (
                    <button
                      type="button"
                      className="text-destructive-foreground"
                      onClick={() =>
                        setActing({
                          id: r._id,
                          label: labelOf(r),
                          action: "terminate",
                        })
                      }
                    >
                      {t("Delete")}
                    </button>
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!ending}
        onOpenChange={(o) => !o && setEnding(undefined)}
        title={t("Stop renting it out?")}
        description={t(
          "It keeps running until the later of the end of its term and its paid month, then it's deleted. The renter is told now, so they can move."
        )}
        confirmLabel={t("Stop renting it out")}
        onConfirm={end}
      />
      <ConfirmDialog
        open={!!acting}
        onOpenChange={(o) => !o && setActing(undefined)}
        title={
          acting?.action === "terminate"
            ? t("Delete this rental?")
            : acting?.action === "refund"
              ? t("Refund this rental?")
              : t("Suspend this rental?")
        }
        description={
          acting?.action === "terminate"
            ? t(
                "{{label}} is deleted now with everything on it. Nothing is refunded.",
                { label: acting.label }
              )
            : acting?.action === "refund"
              ? t(
                  "Gives this period's charge back to the customer's wallet and removes the rental."
                )
              : t(
                  "{{label}} stops now and isn't renewed until you resume it. Its data is kept.",
                  { label: acting?.label }
                )
        }
        confirmLabel={
          acting?.action === "terminate"
            ? t("Delete")
            : acting?.action === "refund"
              ? t("Refund and remove")
              : t("Suspend")
        }
        reasonLabel={t("Reason for the customer (optional)")}
        onConfirm={(reason) => acting && act(acting.id, acting.action, reason)}
      />
      {moving && (
        <MoveDialog
          rental={moving.id}
          label={moving.label}
          propose={moving.propose}
          onOpenChange={(o) => !o && setMoving(undefined)}
          onDone={onChanged}
        />
      )}
      <ConfirmDialog
        open={!!canceling}
        onOpenChange={(o) => !o && setCanceling(undefined)}
        title={t("Cancel this move?")}
        description={t(
          "For a move that stopped reporting (an agent restarted during it). The partition starts again on this machine and the copy on the other one is removed."
        )}
        confirmLabel={t("Cancel move")}
        onConfirm={() => canceling && cancelMove(canceling)}
      />
    </section>
  )
}
