import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import { IconInbox, IconLoader2 } from "@tabler/icons-react"
import { usePolling } from "@/hooks/use-polling"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
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
import { FastForwardDialog } from "./FastForwardDialog"
import { PromptDialog } from "./PromptDialog"
import { useIsOwner } from "./rental"

/** A month, in hours (PLAN §30.3). */
const HOURS = 730

type TMachine = NonNullable<
  Awaited<ReturnType<typeof ThunderSDK.hosting.machine>>
>
type TPrices = NonNullable<TMachine["rent"]>["prices"]
type TRequest = Awaited<ReturnType<typeof ThunderSDK.hosting.requests>>[number]

const PRICE_FIELDS = [["vcpu"], ["memGb"], ["diskGb"], ["whole"]] as const

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
  // A resize applies on the machine in the background: follow it.
  usePolling(() => {
    if (info?.rentals.some((r) => r.resizing)) reload()
  }, 5_000)
  if (!info) return null
  const changed = () => {
    reload()
    queries.hostingRequests().invalidate()
    onChanged()
  }
  const listed = !!info.rent?.enabled
  return (
    <Panel
      title={t("Rent it out")}
      description={t(
        "Renters pay by the month; you earn after each month, minus Huruf's commission."
      )}
      bodyClassName="flex flex-col gap-5"
    >
      <Settings
        // Saved values reset the form.
        key={JSON.stringify([info.rent, info.monthlyCost])}
        server={server._id}
        allocatable={server.pool?.allocatable}
        info={info}
        editable={isOwner && ThunderSDK.isPermitted("hosting", "updateMachine")}
        onChanged={changed}
      />
      {(listed || info.rentals.length > 0 || info.security.amount > 0) && (
        <section className="flex flex-col gap-1">
          <KeyValue
            items={[
              {
                label: t("Security held"),
                value: t("{{amount}} of {{cap}}", {
                  amount: money(info.security.amount, "usd"),
                  cap: money(info.security.cap, "usd"),
                }),
              },
            ]}
          />
          <p className="text-xs text-pretty text-muted-foreground">
            {t(
              "Half of each month at most goes to the security, until it holds one month of the machine's whole price. It's paid out 14 days after the machine leaves properly, and goes to its renters if it leaves before their term."
            )}
          </p>
        </section>
      )}
      <MachineRentals info={info} onChanged={changed} />
    </Panel>
  )
}

/** A price field: dollars with a unit, and what it comes to a month. */
function PriceRow({
  id,
  label,
  hint,
  unit,
  value,
  placeholder,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  unit: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-[13px] leading-5">
          {label}
        </Label>
        {hint && (
          <p className="text-[11px] leading-4 text-muted-foreground tabular-nums">
            {hint}
          </p>
        )}
      </div>
      <InputGroup className="h-7 w-36 shrink-0 rounded-md">
        <InputGroupAddon className="ps-2 text-xs">$</InputGroupAddon>
        <InputGroupInput
          id={id}
          type="number"
          inputMode="decimal"
          dir="ltr"
          min={0}
          step="any"
          className="h-7 [appearance:textfield] px-1 text-[13px] tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        <InputGroupAddon align="inline-end" className="pe-2 text-[11px]">
          {unit}
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function Settings({
  server,
  allocatable,
  info,
  editable,
  onChanged,
}: {
  server: string
  /** What partitions may use in all: the whole machine. */
  allocatable?: { cpus: number; memMb: number; diskGb: number } | null
  info: TMachine
  editable: boolean
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const saved = info.rent
  // Dollars per hour, as typed; an empty whole price means "the sum of the parts".
  const initial = React.useMemo<Record<string, string>>(
    () => ({
      ...Object.fromEntries(
        PRICE_FIELDS.map(([k]) => {
          const v = saved?.prices[k]
          return [k, v ? String(Math.round(v * 1e4) / 1e6) : ""]
        })
      ),
      traffic: saved ? String(toDollars(saved.prices.trafficGb)) : "0.1",
      cost: info.monthlyCost ? String(toDollars(info.monthlyCost)) : "",
    }),
    [saved, info.monthlyCost]
  )
  const [form, setForm] = React.useState<Record<string, string>>(initial)
  const [busy, setBusy] = React.useState(false)
  const dirty = Object.keys(initial).some((k) => form[k] !== initial[k])
  const set = (k: string) => (v: string) => setForm({ ...form, [k]: v })

  const cents = (k: string) => {
    const n = Number(form[k])
    return form[k] === "" || !Number.isFinite(n) || n < 0 ? undefined : n * 100
  }
  const monthly = (k: string) =>
    cents(k)
      ? t("{{price}} a month", {
          price: money(Math.round(cents(k)! * HOURS), "usd"),
        })
      : undefined
  const typed: TPrices | undefined = (
    ["vcpu", "memGb", "diskGb"] as const
  ).every((k) => cents(k) !== undefined)
    ? {
        vcpu: cents("vcpu")!,
        memGb: cents("memGb")!,
        diskGb: cents("diskGb")!,
        ...(cents("whole") ? { whole: cents("whole") } : {}),
        trafficGb: Math.max(0, toCents(form.traffic) || 0),
      }
    : undefined

  const save = async (patch: {
    enabled?: boolean
    autoAccept?: boolean
    accepting?: boolean
    prices?: boolean
  }) => {
    // A switch keeps the saved prices; "Save" sends the typed ones.
    const kept = saved && {
      ...saved.prices,
      // Saved before 0 meant "none": the parts add up.
      whole: saved.prices.whole || undefined,
    }
    const prices = patch.prices ? typed : (kept ?? typed)
    const enabled = patch.enabled ?? saved?.enabled ?? false
    if (!prices && (enabled || patch.prices)) {
      return toast.error(t("Set the prices per vCPU, memory and disk first"))
    }
    setBusy(true)
    try {
      await ThunderSDK.hosting.updateMachine({
        params: { id: server },
        body: {
          ...(prices
            ? {
                rent: {
                  enabled,
                  autoAccept: patch.autoAccept ?? saved?.autoAccept ?? false,
                  prices,
                },
              }
            : {}),
          ...(patch.accepting !== undefined
            ? { accepting: patch.accepting }
            : {}),
          ...(patch.prices && form.cost !== "" && toCents(form.cost) >= 0
            ? { monthlyCost: toCents(form.cost) }
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

  const switches = [
    {
      id: "rent-enabled",
      label: t("For rent in the market"),
      hint: t("Renters can find this machine and request it."),
      checked: !!saved?.enabled,
      onChange: (enabled: boolean) => save({ enabled }),
    },
    {
      id: "rent-auto",
      label: t("Accept requests at once"),
      hint: t("A paid request starts without waiting for you."),
      checked: !!saved?.autoAccept,
      onChange: (autoAccept: boolean) => save({ autoAccept }),
    },
    {
      id: "rent-accepting",
      label: t("Takes new rentals"),
      hint: t("Off: its rentals stay, no new ones."),
      checked: info.accepting,
      onChange: (accepting: boolean) => save({ accepting }),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col divide-y rounded-lg border">
        {switches.map((s) => (
          <li key={s.id} className="flex items-center gap-4 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <Label htmlFor={s.id} className="text-[13px]">
                {s.label}
              </Label>
              <p className="text-xs text-pretty text-muted-foreground">
                {s.hint}
              </p>
            </div>
            <Switch
              id={s.id}
              checked={s.checked}
              disabled={!editable || busy}
              onCheckedChange={s.onChange}
            />
          </li>
        ))}
      </ul>

      <fieldset disabled={!editable} className="min-w-0">
        <legend className="text-sm font-semibold">{t("Prices")}</legend>
        <p className="text-xs text-pretty text-muted-foreground">
          {t(
            "By the hour; a month is 730 hours. Renters see the monthly price."
          )}
        </p>
        <div className="mt-1.5 divide-y">
          <PriceRow
            id="price-vcpu"
            label={t("Per vCPU")}
            hint={monthly("vcpu")}
            unit={t("/ hour")}
            value={form.vcpu}
            onChange={set("vcpu")}
          />
          <PriceRow
            id="price-memGb"
            label={t("Per GB of memory")}
            hint={monthly("memGb")}
            unit={t("/ hour")}
            value={form.memGb}
            onChange={set("memGb")}
          />
          <PriceRow
            id="price-diskGb"
            label={t("Per GB of disk")}
            hint={monthly("diskGb")}
            unit={t("/ hour")}
            value={form.diskGb}
            onChange={set("diskGb")}
          />
          <PriceRow
            id="price-whole"
            label={t("The whole machine")}
            hint={monthly("whole") ?? t("Optional: empty adds up the parts")}
            unit={t("/ hour")}
            value={form.whole}
            placeholder={t("Optional")}
            onChange={set("whole")}
          />
          <PriceRow
            id="price-traffic"
            label={t("Traffic over the allowance")}
            hint={t("Beyond the traffic each rental includes")}
            unit={t("/ GB")}
            value={form.traffic}
            onChange={set("traffic")}
          />
          <PriceRow
            id="price-cost"
            label={t("What it costs you")}
            hint={t("Only for you: revenue against cost")}
            unit={t("/ month")}
            value={form.cost}
            onChange={set("cost")}
          />
        </div>
      </fieldset>
      <Earnings
        full={
          allocatable && typed
            ? Math.ceil(
                (typed.whole ??
                  allocatable.cpus * typed.vcpu +
                    (allocatable.memMb / 1024) * typed.memGb +
                    allocatable.diskGb * typed.diskGb) *
                  HOURS -
                  1e-9
              )
            : undefined
        }
        now={info.revenue}
        commission={info.commission}
        cost={toCents(form.cost) || 0}
      />
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={busy || !dirty}
            onClick={() => save({ prices: true })}
          >
            {t("Save prices")}
          </Button>
          {dirty && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setForm(initial)}
            >
              {t("Discard")}
            </Button>
          )}
        </div>
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
  // When the page opened: deadlines count down from there.
  const [now] = React.useState(() => Date.now())
  const rows = (data ?? []).filter((r) => !machine || r.machine === machine)
  if (!rows.length) return null
  const changed = () => {
    reload()
    onChanged?.()
  }
  const accept = async (r: TRequest) => {
    try {
      if (r.resizeTo) {
        const done = await ThunderSDK.hosting.acceptResize({
          params: { id: r._id },
        })
        toast.success(
          done.result === "scheduled" && done.at
            ? t(
                "Accepted: the smaller size starts at their next renewal, on {{date}}",
                { date: day(done.at) }
              )
            : t("Resize accepted: it applies now")
        )
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
    <section
      aria-labelledby="requests-title"
      className="flex flex-col gap-2 rounded-[10px] border border-primary/50 bg-primary/5 p-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2
          id="requests-title"
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <IconInbox className="size-4 text-brand-text" aria-hidden />
          {t("{{count}} rental requests waiting for you", {
            count: rows.length,
          })}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("Not accepted within 72 hours, a request is declined.")}
        </p>
      </div>
      <ul className="flex flex-col divide-y rounded-lg border bg-card text-[13px]">
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
                {!r.resizeTo && (
                  <>
                    {" · "}
                    <span className="text-warning-foreground">
                      {t("declined in {{hours}} h unless accepted", {
                        hours: Math.max(
                          0,
                          Math.ceil(
                            (new Date(r.requestedAt).getTime() +
                              72 * 3_600_000 -
                              now) /
                              3_600_000
                          )
                        ),
                      })}
                    </span>
                  </>
                )}
              </span>
              {r.resizeTo && !r.resizeTo.fits && (
                <span className="block text-xs text-warning-foreground">
                  {t(
                    "It doesn't fit on this machine now: propose a move to a machine with room (in the rentals below), then accept."
                  )}
                </span>
              )}
              {r.autoAcceptError && (
                <span className="block text-xs text-destructive">
                  {t("Didn't start at once: {{reason}}", {
                    reason: r.autoAcceptError,
                  })}
                </span>
              )}
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
  // The testing tool, when it's on (admins).
  const fastForwardOn = !!useCached(queries.fastForward()).data?.enabled
  const [forwarding, setForwarding] =
    React.useState<TMachine["rentals"][number]>()
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
  const retry = async (id: string) => {
    try {
      const after = await ThunderSDK.hosting.retryRenewal({ params: { id } })
      if (after.status === "active") toast.success(t("Renewed"))
      else
        toast.error(
          t("Still unpaid: {{reason}}", {
            reason: after.lastError ?? t("the payment didn't go through"),
          })
        )
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
            {r.pastDueSince && (
              <span className="text-xs text-destructive">
                {t("Payment due since {{date}}: {{reason}}", {
                  date: day(r.pastDueSince),
                  reason: r.lastError ?? t("the payment didn't go through"),
                })}
              </span>
            )}
            {r.resizing && (
              <span
                role="status"
                className="flex items-center gap-1 text-xs text-info-foreground"
              >
                <IconLoader2 className="size-3 animate-spin" aria-hidden />
                {t("Resizing on this machine…")}
              </span>
            )}
            {r.resizeError && (
              <span className="text-xs text-destructive">
                {t("The resize didn't apply: {{reason}}", {
                  reason: r.resizeError,
                })}
              </span>
            )}
            {r.nextSize && (
              <span className="text-xs text-info-foreground">
                {t("Next size: {{plan}} from {{date}}", {
                  plan: r.nextSize.plan,
                  date: day(r.nextSize.at),
                })}
              </span>
            )}
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
                    r.pastDueSince &&
                    ThunderSDK.isPermitted("hosting", "retryRenewal") && (
                      <button type="button" onClick={() => retry(r._id)}>
                        {t("Try renewing again")}
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
                  {fastForwardOn && admin("fastForwardSubscription") && (
                    <button type="button" onClick={() => setForwarding(r)}>
                      {t("Fast-forward")}
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
      {forwarding && (
        <FastForwardDialog
          rental={forwarding._id}
          label={labelOf(forwarding)}
          periodEnd={forwarding.currentPeriodEnd}
          onOpenChange={(open) => !open && setForwarding(undefined)}
          onDone={onChanged}
        />
      )}
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

/**
 * What the owner earns a month (PLAN §30.7): rented in full at the prices
 * typed (the whole price, else the parts), Huruf's commission, what's left,
 * and after the machine's cost; and what the rentals on it bring now.
 */
function Earnings({
  full,
  now,
  commission,
  cost,
}: {
  full?: number
  now: number
  commission: number
  cost: number
}) {
  const { t } = useTranslation()
  if (full === undefined) return null
  // As the security's cap is worked out (PLAN §30.7).
  const earn = Math.round((full * (100 - commission)) / 100)
  const cut = full - earn
  const row = "flex justify-between gap-3 tabular-nums"
  return (
    <section
      aria-label={t("What you earn")}
      className="flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-[13px]"
    >
      <div className={row}>
        <span className="text-muted-foreground">
          {t("Fully rented, a month")}
        </span>
        <span>{money(full, "usd")}</span>
      </div>
      <div className={row}>
        <span className="text-muted-foreground">
          {t("Huruf's commission ({{pct}}%)", { pct: commission })}
        </span>
        <span>−{money(cut, "usd")}</span>
      </div>
      <div className={`${row} border-t pt-1.5 font-semibold`}>
        <span>{t("You earn")}</span>
        <span>{money(earn, "usd")}</span>
      </div>
      {cost > 0 && (
        <div className={row}>
          <span className="text-muted-foreground">
            {t("After its cost of {{cost}}", { cost: money(cost, "usd") })}
          </span>
          <span className={earn - cost < 0 ? "text-destructive" : ""}>
            {money(earn - cost, "usd")}
          </span>
        </div>
      )}
      <p className="pt-1 text-[11px] text-muted-foreground tabular-nums">
        {t("Rented now: {{now}} a month, you earn {{earn}}.", {
          now: money(now, "usd"),
          earn: money(now - Math.round((now * commission) / 100), "usd"),
        })}
      </p>
    </section>
  )
}
