import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Panel } from "@/components/console/panel"
import { KeyValue } from "@/components/console/key-value"
import { useCached } from "@/hooks/use-cached"
import { toCents, toDollars } from "@/lib/format"
import { money } from "@/lib/plans"
import { queries } from "@/lib/queries"
import { errorMessage } from "@/lib/utils"
import { isMachine, type TServer } from "@/pages/servers/server"
import { MoveDialog } from "./MoveDialog"

/** Picked in the class select: the machine isn't for rent. */
const NOT_FOR_RENT = "none"

const can = (action: string) => ThunderSDK.isPermitted("rentalsAdmin", action)

/**
 * Rentals on one of the platform's machines (PLAN §28), for admins: a
 * machine is for rent once it has a class; whether it takes new rentals
 * (draining), its cost against what it earns, and the rentals on it with
 * their uptime and Move. Its partitions are in the Partitions panel. Each
 * control shows only with its own permission.
 */
export function PoolPanel({
  server,
  onChanged,
}: {
  server: TServer
  onChanged: () => void
}) {
  if (!isMachine(server) || !can("pool")) return null
  return <MachineRentals server={server} onChanged={onChanged} />
}

function MachineRentals({
  server,
  onChanged,
}: {
  server: TServer
  onChanged: () => void
}) {
  const { data: info, reload } = useCached(queries.machineRentals(server._id))
  if (!info?.platform || server.pool?.status !== "ready") return null
  return (
    <RentalsDetails
      server={server}
      info={info}
      onChanged={() => {
        reload()
        onChanged()
      }}
    />
  )
}

const labelOf = (r: {
  tenantName?: string
  partition?: string
  plan?: string
}) => `${r.tenantName ?? r.partition} · ${r.plan ?? ""}`

function RentalsDetails({
  server,
  info,
  onChanged,
}: {
  server: TServer
  info: Awaited<ReturnType<typeof ThunderSDK.rentalsAdmin.pool>>
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const canUpdate = can("updatePool")
  const canMove = can("move") && can("moveTargets")
  const classes = useCached(queries.serverClasses()).data?.results
  const [moving, setMoving] = React.useState<{ id: string; label: string }>()
  const [canceling, setCanceling] = React.useState<string>()
  const [acting, setActing] = React.useState<{
    id: string
    label: string
    action: "suspend" | "terminate"
  }>()
  const [cost, setCost] = React.useState<string>()
  const pool = server.pool!
  const forRent = !!pool.class

  const update = async (body: {
    class?: string | null
    accepting?: boolean
    monthlyCost?: number
  }) => {
    try {
      await ThunderSDK.rentalsAdmin.updatePool({
        params: { id: server._id },
        body,
      })
      toast.success(t("Saved"))
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save"))
    }
  }
  const saveCost = () => {
    if (cost === undefined) return
    const cents = toCents(cost)
    // Empty or not a number: back to the saved cost.
    if (!(cents >= 0)) return setCost(undefined)
    if (cents !== (pool.monthlyCost ?? 0)) update({ monthlyCost: cents })
  }
  const act = async (
    id: string,
    action: "suspend" | "resume" | "terminate",
    reason?: string
  ) => {
    try {
      if (action === "resume") {
        await ThunderSDK.rentalsAdmin.resume({ params: { id } })
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
    <Panel
      title={t("Rentals (admins)")}
      description={t(
        "Give this machine a class to rent its free capacity to customers."
      )}
      bodyClassName="flex flex-col gap-4 py-2"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pool-class">{t("Class")}</Label>
          <Select
            items={[
              { value: NOT_FOR_RENT, label: t("Not for rent") },
              ...(classes ?? []).map((c) => ({
                value: String(c._id),
                label: c.name,
              })),
            ]}
            value={pool.class ?? NOT_FOR_RENT}
            disabled={!canUpdate}
            onValueChange={(v) =>
              update({ class: v === NOT_FOR_RENT ? null : (v as string) })
            }
          >
            <SelectTrigger id="pool-class" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NOT_FOR_RENT}>{t("Not for rent")}</SelectItem>
              {(classes ?? []).map((c) => (
                <SelectItem key={String(c._id)} value={String(c._id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pool-cost">{t("Monthly cost ($)")}</Label>
          <Input
            id="pool-cost"
            type="number"
            min={0}
            step="0.01"
            disabled={!canUpdate}
            value={
              cost ?? (pool.monthlyCost ? toDollars(pool.monthlyCost) : "")
            }
            onChange={(e) => setCost(e.target.value)}
            onBlur={saveCost}
          />
        </div>
        {forRent && (
          <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[13px] sm:col-span-2">
            <span>
              {t("Takes new rentals")}
              <span className="block text-xs text-muted-foreground">
                {t(
                  "Off drains it: move its rentals to other machines, then it can be removed."
                )}
              </span>
            </span>
            <Switch
              checked={pool.accepting !== false}
              disabled={!canUpdate}
              onCheckedChange={(accepting) => update({ accepting })}
            />
          </label>
        )}
      </div>

      {(forRent || info.rentals.length > 0) && (
        <KeyValue
          items={[
            {
              label: t("Earns / costs a month"),
              value: `${money(info.revenue, "usd")} / ${
                pool.monthlyCost ? money(pool.monthlyCost, "usd") : "—"
              }`,
            },
          ]}
        />
      )}

      {info.rentals.length > 0 && (
        <ul className="flex flex-col divide-y rounded-lg border text-[13px]">
          {info.rentals.map((r) => (
            <li key={r._id} className="flex flex-col gap-1 px-3 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="font-medium">{labelOf(r)}</span>
                {r.uptime !== undefined && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t("{{n}}% up", { n: r.uptime.toFixed(2) })}
                  </span>
                )}
              </div>
              {r.overDisk !== undefined && (
                <span className="text-xs text-destructive-foreground">
                  {t("Uses {{gb}} GB of disk, more than its size", {
                    gb: Math.ceil(r.overDisk / 2 ** 30),
                  })}
                </span>
              )}
              {r.held && (
                <span className="text-xs text-warning-foreground">
                  {t("Suspended by an admin: not renewed until resumed")}
                </span>
              )}
              {r.moving ? (
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-info-foreground">
                  {t("Moving to {{name}}", {
                    name: r.moving.toName ?? r.moving.to,
                  })}
                  {can("cancelMove") && (
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
                    {canMove && r.status !== "suspended" && (
                      <button
                        type="button"
                        onClick={() =>
                          setMoving({ id: r._id, label: labelOf(r) })
                        }
                      >
                        {t("Move to another machine")}
                      </button>
                    )}
                    {r.held
                      ? can("resume") && (
                          <button
                            type="button"
                            onClick={() => act(r._id, "resume")}
                          >
                            {t("Resume")}
                          </button>
                        )
                      : can("suspend") &&
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
                    {can("terminate") && (
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
      )}

      <ConfirmDialog
        open={!!acting}
        onOpenChange={(o) => !o && setActing(undefined)}
        title={
          acting?.action === "terminate"
            ? t("Delete this rental?")
            : t("Suspend this rental?")
        }
        description={
          acting?.action === "terminate"
            ? t(
                "{{label}} is deleted now with everything on it. Nothing is refunded.",
                { label: acting.label }
              )
            : t(
                "{{label}} stops now and isn't renewed until you resume it. Its data is kept.",
                { label: acting?.label }
              )
        }
        confirmLabel={
          acting?.action === "terminate" ? t("Delete") : t("Suspend")
        }
        reasonLabel={t("Reason for the customer (optional)")}
        onConfirm={(reason) => acting && act(acting.id, acting.action, reason)}
      />
      {moving && (
        <MoveDialog
          rental={moving.id}
          label={moving.label}
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
    </Panel>
  )
}
