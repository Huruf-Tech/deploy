import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

import { use } from "@/core/hooks/use"
import { Button } from "@/components/ui/button"
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
import { money } from "@/lib/plans"
import { errorMessage } from "@/lib/utils"
import { isMachine, type TServer } from "@/pages/servers/server"
import { MoveDialog } from "./MoveDialog"

/** Picked in the class select: the machine isn't for rent. */
const NOT_FOR_RENT = "none"

/**
 * Rentals on one of the platform's machines (PLAN §28), for admins: a
 * machine is for rent once it has a class; whether it takes new rentals
 * (draining), its cost against what it earns, and the rentals on it with
 * their uptime and Move. Its partitions are in the Partitions panel.
 */
export function PoolPanel({
  server,
  onChanged,
}: {
  server: TServer
  onChanged: () => void
}) {
  const allowed =
    isMachine(server) && ThunderSDK.isPermitted("rentalsAdmin", "pool")
  const request = ThunderSDK.useCaching(
    ["rentalsAdmin", "pool", server._id],
    async ({ signal }) =>
      allowed
        ? await ThunderSDK.rentalsAdmin.pool({
            params: { id: server._id },
            signal,
          })
        : null
  )
  const info = use(request).data
  if (!info?.platform || server.pool?.status !== "ready") return null
  return (
    <RentalsDetails
      server={server}
      info={info}
      onChanged={() => {
        request.invalidate()
        onChanged()
      }}
    />
  )
}

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
  const classes = use(
    ThunderSDK.useCaching(
      ["serverClasses", "all"],
      async ({ signal }) =>
        await ThunderSDK.serverClasses.get({
          params: {},
          query: { limit: 50 },
          signal,
        })
    )
  ).data?.results
  const [moving, setMoving] = React.useState<{ id: string; label: string }>()
  const [canceling, setCanceling] = React.useState<string>()
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
            value={cost ?? (pool.monthlyCost ? pool.monthlyCost / 100 : "")}
            onChange={(e) => setCost(e.target.value)}
            onBlur={() =>
              cost !== undefined &&
              update({ monthlyCost: Math.round(Number(cost) * 100) })
            }
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
                <span className="font-medium">
                  {r.tenantName ?? r.partition} · {r.plan}
                </span>
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
              {r.moving ? (
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-info-foreground">
                  {t("Moving to {{name}}", {
                    name: r.moving.toName ?? r.moving.to,
                  })}
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() => setCanceling(r._id)}
                  >
                    {t("Cancel move")}
                  </button>
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
                  {r.status !== "suspended" && (
                    <button
                      type="button"
                      className="self-start text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      onClick={() =>
                        setMoving({
                          id: r._id,
                          label: `${r.tenantName ?? r.partition} · ${r.plan ?? ""}`,
                        })
                      }
                    >
                      {t("Move to another machine")}
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {moving && (
        <MoveDialog
          rental={moving.id}
          label={moving.label}
          onOpenChange={(o) => !o && setMoving(undefined)}
          onDone={onChanged}
        />
      )}
      <Dialog
        open={!!canceling}
        onOpenChange={(o) => !o && setCanceling(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Cancel this move?")}</DialogTitle>
            <DialogDescription>
              {t(
                "For a move that stopped reporting (an agent restarted during it). The partition starts again on this machine and the copy on the other one is removed."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => canceling && cancelMove(canceling)}
            >
              {t("Cancel move")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
