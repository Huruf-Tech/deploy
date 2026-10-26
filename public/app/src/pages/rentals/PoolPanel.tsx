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
import { DataTable } from "@/components/console/data-table"
import { StatusBadge, StatusDot } from "@/components/console/status"
import { money } from "@/lib/plans"
import { errorMessage } from "@/lib/utils"
import type { TServer } from "@/pages/servers/server"
import { MoveDialog } from "./MoveDialog"

const gb = (bytes: number) => `${(bytes / 2 ** 30).toFixed(1)} GB`
const gbOfMb = (mb: number) => `${Math.round((mb / 1024) * 10) / 10} GB`

/**
 * A pool machine on its server page (PLAN §26.8), for admins: make one, its
 * class, whether it takes rentals, its cost against what it earns, and its
 * partitions. Nothing for anyone else, or for a customer's own servers.
 */
export function PoolPanel({
  server,
  onChanged,
}: {
  server: TServer
  onChanged: () => void
}) {
  const allowed = ThunderSDK.isPermitted("rentalsAdmin", "pool")
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
  if (!info?.platform) return null
  return (
    <PoolDetails
      server={server}
      info={info}
      onChanged={() => {
        request.invalidate()
        onChanged()
      }}
    />
  )
}

function PoolDetails({
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
  const [making, setMaking] = React.useState(false)
  const [moving, setMoving] = React.useState<{ id: string; label: string }>()
  const [canceling, setCanceling] = React.useState<string>()
  const [cost, setCost] = React.useState<string>()
  const pool = server.pool
  const partitions = server.resources?.partitions ?? []

  const update = async (body: {
    class?: string
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
  const addRemainder = async () => {
    try {
      await ThunderSDK.rentalsAdmin.createRemainder({
        params: { id: server._id },
      })
      toast.success(t("Huruf's partition is being created"))
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not create it"))
    }
  }

  // Any machine has host setup (PLAN §27); renting needs the pool layout,
  // which a machine only takes while it has no partitions.
  if (!pool || pool.mode !== "pool") {
    // Only a machine with nothing on it yet (PLAN §26.5): not a partition.
    if (server.provider?.kind !== "machine" || partitions.length) return null
    return (
      <Panel
        title={t("Rent out (admins)")}
        description={t("Optional: offer this machine's capacity to customers")}
      >
        <p className="mb-3 text-[13px] text-muted-foreground">
          {t(
            "Turns an empty Huruf machine into a pool machine whose partitions customers can rent: Docker moves onto the partition volume and rented partitions are kept apart. Not needed to use the machine yourself."
          )}
        </p>
        <Button size="sm" variant="outline" onClick={() => setMaking(true)}>
          {t("Make a pool machine")}
        </Button>
        {making && (
          <MakePoolDialog
            server={server._id}
            onOpenChange={setMaking}
            onDone={onChanged}
          />
        )}
      </Panel>
    )
  }

  const all = pool.allocatable
  const rented = partitions.filter((p) => !p.remainder)
  const used = rented.reduce(
    (u, p) => ({
      cpus: u.cpus + p.size.cpus,
      memMb: u.memMb + p.size.memMb,
      diskGb: u.diskGb + p.size.diskGb,
    }),
    { cpus: 0, memMb: 0, diskGb: 0 }
  )
  const rentalOf = (name: string) =>
    info.rentals.find((r) => r.partition === name)
  const statusTone =
    pool.status === "ready"
      ? "success"
      : pool.status === "failed"
        ? "danger"
        : "info"

  return (
    <Panel
      title={t("Pool machine")}
      actions={
        <StatusBadge
          tone={statusTone}
          label={
            pool.status === "ready"
              ? t("Ready")
              : pool.status === "failed"
                ? t("Failed")
                : t("Preparing")
          }
        />
      }
      bodyClassName="flex flex-col gap-4 py-2"
    >
      {pool.error && (
        <p className="rounded-lg bg-destructive-soft px-3 py-2 text-[13px] text-destructive-foreground">
          {pool.error}
        </p>
      )}
      {all && (
        <KeyValue
          items={[
            {
              label: t("For partitions"),
              value: `${all.cpus} vCPU · ${gbOfMb(all.memMb)} · ${all.diskGb} GB`,
            },
            {
              label: t("Rented"),
              value: `${used.cpus} vCPU · ${gbOfMb(used.memMb)} · ${used.diskGb} GB`,
            },
            {
              label: t("Earns / costs a month"),
              value: `${money(info.revenue, "usd")} / ${
                pool.monthlyCost ? money(pool.monthlyCost, "usd") : "—"
              }`,
            },
            ...(pool.sysbox ? [{ label: "Sysbox", value: pool.sysbox }] : []),
          ]}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pool-class">{t("Class")}</Label>
          <Select
            items={(classes ?? []).map((c) => ({
              value: String(c._id),
              label: c.name,
            }))}
            value={pool.class ?? ""}
            onValueChange={(v) => update({ class: v as string })}
          >
            <SelectTrigger id="pool-class" className="w-full">
              <SelectValue placeholder={t("Pick a class")} />
            </SelectTrigger>
            <SelectContent>
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
      </div>

      {pool.status === "ready" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[13px] font-semibold">{t("Partitions")}</h3>
            {!partitions.some((p) => p.remainder) && (
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                onClick={addRemainder}
              >
                {t("Add Huruf's partition")}
              </Button>
            )}
          </div>
          <DataTable
            label={t("Partitions")}
            rows={partitions}
            rowId={(p) => p.name}
            empty={t("No partitions yet.")}
            columns={[
              {
                id: "name",
                header: t("Partition"),
                cell: (p) => {
                  const r = rentalOf(p.name)
                  return (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-medium">
                        <StatusDot
                          state={p.state === "running" ? "running" : "stopped"}
                        />
                        <span className="sr-only">{p.state}</span>
                        {p.remainder ? t("Huruf's") : (r?.tenantName ?? p.name)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.remainder
                          ? t("Uses whatever isn't rented")
                          : (r?.plan ?? p.name)}
                        {r?.uptime !== undefined &&
                          ` · ${t("{{n}}% up", { n: r.uptime.toFixed(2) })}`}
                      </div>
                      {r?.moving ? (
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-info-foreground">
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
                        r && (
                          <>
                            {r.lastMove?.error &&
                              r.lastMove.error !== "Canceled" && (
                                <div className="mt-1 text-xs text-destructive-foreground">
                                  {t("The last move failed: {{error}}", {
                                    error: r.lastMove.error,
                                  })}
                                </div>
                              )}
                            {r.status !== "suspended" && (
                              <button
                                type="button"
                                className="mt-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                                onClick={() =>
                                  setMoving({
                                    id: r._id,
                                    label: `${r.tenantName ?? p.name} · ${r.plan ?? ""}`,
                                  })
                                }
                              >
                                {t("Move to another machine")}
                              </button>
                            )}
                          </>
                        )
                      )}
                    </div>
                  )
                },
              },
              {
                // The panel sits in the side column: one cell for all usage.
                id: "usage",
                header: t("Usage"),
                className: "whitespace-nowrap tabular-nums text-xs",
                cell: (p) => (
                  <div dir="ltr" className="text-end rtl:text-start">
                    <div>
                      {gbOfMb(p.memUsed / 2 ** 20)} / {gbOfMb(p.size.memMb)}
                    </div>
                    <div className="text-muted-foreground">
                      {gb(p.diskUsed)} / {p.size.diskGb} GB ·{" "}
                      {gb(p.rxBytes + p.txBytes)}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
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

function MakePoolDialog({
  server,
  onOpenChange,
  onDone,
}: {
  server: string
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [device, setDevice] = React.useState("")
  const [loop, setLoop] = React.useState("100")
  const [busy, setBusy] = React.useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      await ThunderSDK.rentalsAdmin.ensurePool({
        params: { id: server },
        body: device.trim()
          ? { device: device.trim() }
          : { loopSizeGb: Number(loop) },
      })
      toast.success(t("Preparing the pool machine: this takes a few minutes"))
      onDone()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not start it"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("Make a pool machine")}</DialogTitle>
            <DialogDescription>
              {t(
                "Partitions keep their data on an XFS volume with quotas: a dedicated disk (formatted only if it's empty), or a file on the system disk."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pool-device">{t("Disk device (optional)")}</Label>
            <Input
              id="pool-device"
              dir="ltr"
              className="font-mono"
              placeholder="/dev/nvme1n1"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
            />
          </div>
          {!device.trim() && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="pool-loop">{t("Volume file size (GB)")}</Label>
              <Input
                id="pool-loop"
                type="number"
                min={10}
                required
                value={loop}
                onChange={(e) => setLoop(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {t("Make a pool machine")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
