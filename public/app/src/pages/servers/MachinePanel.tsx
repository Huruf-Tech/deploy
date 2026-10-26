import * as React from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import { IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
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
import { usePolling } from "@/hooks/use-polling"
import { errorMessage } from "@/lib/utils"
import type { TServer } from "./server"

type TSize = { cpus: number; memMb: number; diskGb: number }
type TPartitionServer = { _id: string; name: string; partition?: string }

const gbOfMb = (mb: number) => Math.floor((mb / 1024) * 2) / 2
const gb = (bytes: number) => `${(bytes / 2 ** 30).toFixed(1)} GB`
const sizeText = (s: TSize) =>
  `${s.cpus} vCPU · ${gbOfMb(s.memMb)} GB · ${s.diskGb} GB`

/**
 * A machine's partitions (PLAN §27.2): the part of the machine Huruf Deploy
 * gets, chosen by its owner; the rest stays free for other tools on it.
 * Pool machines (rented out, §26) show the Pool machine panel instead.
 */
export function MachinePanel({
  server,
  onChanged,
}: {
  server: TServer
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const pool = server.pool
  const partitions = (server.resources?.partitions ?? []).filter(
    (p) => !p.remainder
  )
  const [servers, setServers] = React.useState<TPartitionServer[]>()
  const [creating, setCreating] = React.useState(false)
  const [resizing, setResizing] = React.useState<{
    name: string
    size: TSize
  }>()
  const [removing, setRemoving] = React.useState<string>()
  const canChange = ThunderSDK.isPermitted("servers", "createPartition")

  const load = React.useCallback(() => {
    ThunderSDK.servers
      .get({
        params: {},
        query: {
          limit: 100,
          project: { _id: 1, name: 1, "provider.partition": 1 },
          filters: {
            "provider.host": { $eq: { type: "objectId", value: server._id } },
          },
        },
      })
      .then(({ results }) =>
        setServers(
          (
            results as {
              _id: string
              name: string
              provider?: { partition?: string }
            }[]
          ).map((s) => ({
            _id: s._id,
            name: s.name,
            partition: s.provider?.partition,
          }))
        )
      )
      .catch(() => {})
  }, [server._id])
  React.useEffect(load, [load])
  // A new partition's server appears once its agent joins.
  usePolling(() => {
    if (partitions.some((p) => !servers?.some((s) => s.partition === p.name)))
      load()
  }, 5_000)

  if (!pool) return null
  const all = pool.allocatable
  const used = partitions.reduce(
    (u, p) => ({
      cpus: u.cpus + p.size.cpus,
      memMb: u.memMb + p.size.memMb,
      diskGb: u.diskGb + p.size.diskGb,
    }),
    { cpus: 0, memMb: 0, diskGb: 0 }
  )
  const free = all && {
    cpus: all.cpus,
    memMb: all.memMb - used.memMb,
    diskGb: all.diskGb - used.diskGb,
  }

  const remove = async (name: string) => {
    try {
      await ThunderSDK.servers.removePartition({
        params: { id: server._id, name },
      })
      toast.success(t("Partition removed with its projects and data"))
      setRemoving(undefined)
      onChanged()
      load()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not remove it"))
    }
  }

  return (
    <Panel
      title={t("Partitions")}
      description={t(
        "The part of this machine Huruf Deploy uses. The rest stays free for other tools on it."
      )}
      actions={
        pool.status === "ready" ? (
          canChange &&
          !!partitions.length && (
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => setCreating(true)}
            >
              <IconPlus aria-hidden /> {t("Partition")}
            </Button>
          )
        ) : (
          <StatusBadge
            tone={pool.status === "failed" ? "danger" : "info"}
            label={
              pool.status === "failed" ? t("Setup failed") : t("Setting up")
            }
          />
        )
      }
      bodyClassName="flex flex-col gap-3 py-2"
    >
      {pool.status === "pending" && (
        <p className="text-[13px] text-muted-foreground">
          {t(
            "Installing Sysbox and preparing partitions. Docker and anything else on the machine keep running."
          )}
        </p>
      )}
      {pool.error && (
        <p className="rounded-lg bg-destructive-soft px-3 py-2 text-[13px] text-destructive-foreground">
          {pool.error}
        </p>
      )}
      {pool.status === "ready" && free && (
        <KeyValue
          items={[
            { label: t("For partitions"), value: all && sizeText(all) },
            { label: t("Free"), value: sizeText(free) },
          ]}
        />
      )}
      {pool.status === "ready" && !partitions.length && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed px-3 py-3">
          <p className="text-[13px]">
            {t(
              "Create a partition to deploy here: choose how much of the machine it gets."
            )}
          </p>
          {canChange && (
            <Button size="sm" onClick={() => setCreating(true)}>
              {t("Create a partition")}
            </Button>
          )}
        </div>
      )}
      {!!partitions.length && (
        <DataTable
          label={t("Partitions")}
          rows={partitions}
          rowId={(p) => p.name}
          columns={[
            {
              id: "name",
              header: t("Partition"),
              cell: (p) => {
                const s = servers?.find((x) => x.partition === p.name)
                return (
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-medium">
                      <StatusDot
                        state={p.state === "running" ? "running" : "stopped"}
                      />
                      <span className="sr-only">{p.state}</span>
                      {s ? (
                        <Link
                          to={`../${s._id}`}
                          relative="path"
                          className="underline-offset-2 hover:underline"
                        >
                          {s.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("Joining…")}
                        </span>
                      )}
                    </div>
                    <div dir="ltr" className="text-xs text-muted-foreground">
                      {sizeText(p.size)}
                    </div>
                    {canChange && (
                      <div className="mt-1 flex gap-3 text-xs">
                        <button
                          type="button"
                          className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                          onClick={() =>
                            setResizing({ name: p.name, size: p.size })
                          }
                        >
                          {t("Resize")}
                        </button>
                        <button
                          type="button"
                          className="text-destructive-foreground underline underline-offset-2"
                          onClick={() => setRemoving(p.name)}
                        >
                          {t("Remove")}
                        </button>
                      </div>
                    )}
                  </div>
                )
              },
            },
            {
              id: "usage",
              header: t("Usage"),
              className: "whitespace-nowrap tabular-nums text-xs",
              cell: (p) => (
                <div dir="ltr" className="text-end rtl:text-start">
                  <div>
                    {gb(p.memUsed)} / {gbOfMb(p.size.memMb)} GB
                  </div>
                  <div className="text-muted-foreground">
                    {gb(p.diskUsed)} / {p.size.diskGb} GB
                  </div>
                </div>
              ),
            },
          ]}
        />
      )}

      {creating && free && (
        <SizeDialog
          title={t("Create a partition")}
          description={t(
            "Its server appears in a minute or two. You can resize it later."
          )}
          max={free}
          initial={{
            cpus: Math.max(0.5, Math.floor(free.cpus * 2) / 2),
            memMb: Math.max(512, Math.floor(free.memMb / 512) * 512),
            diskGb: Math.max(5, Math.floor(free.diskGb / 5) * 5),
          }}
          withName
          defaultName={server.name}
          submitLabel={t("Create partition")}
          onOpenChange={setCreating}
          onSubmit={async (size, name) => {
            await ThunderSDK.servers.createPartition({
              params: { id: server._id },
              body: { size, ...(name ? { name } : {}) },
            })
            toast.success(t("Creating the partition: its server appears soon"))
            onChanged()
          }}
        />
      )}
      {resizing && free && (
        <SizeDialog
          title={t("Resize the partition")}
          description={t(
            "It changes live, without a restart. It can't shrink below what it uses."
          )}
          max={{
            cpus: free.cpus,
            memMb: free.memMb + resizing.size.memMb,
            diskGb: free.diskGb + resizing.size.diskGb,
          }}
          initial={resizing.size}
          submitLabel={t("Resize")}
          onOpenChange={(o) => !o && setResizing(undefined)}
          onSubmit={async (size) => {
            await ThunderSDK.servers.resizePartition({
              params: { id: server._id, name: resizing.name },
              body: { size },
            })
            toast.success(t("Resizing: it applies in a few seconds"))
            onChanged()
          }}
        />
      )}
      <Dialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Remove this partition?")}</DialogTitle>
            <DialogDescription>
              {t(
                "It's deleted with its projects' containers and data, and its server goes from the list. The machine keeps running."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => removing && remove(removing)}
            >
              {t("Remove partition")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}

function SizeDialog({
  title,
  description,
  max,
  initial,
  withName,
  defaultName,
  submitLabel,
  onOpenChange,
  onSubmit,
}: {
  title: string
  description: string
  max: TSize
  initial: TSize
  withName?: boolean
  defaultName?: string
  submitLabel: string
  onOpenChange: (open: boolean) => void
  onSubmit: (size: TSize, name?: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [name, setName] = React.useState(defaultName ?? "")
  const [cpus, setCpus] = React.useState(String(initial.cpus))
  const [mem, setMem] = React.useState(String(gbOfMb(initial.memMb)))
  const [disk, setDisk] = React.useState(String(initial.diskGb))
  const [busy, setBusy] = React.useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      await onSubmit(
        {
          cpus: Number(cpus),
          memMb: Math.round(Number(mem) * 1024),
          diskGb: Number(disk),
        },
        withName ? name.trim() : undefined
      )
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save"))
    } finally {
      setBusy(false)
    }
  }
  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    step: number,
    min: number,
    limit: number
  ) => (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={limit}
        required
        value={value}
        onChange={(e) => set(e.target.value)}
      />
      <FieldDescription>{t("Up to {{n}}", { n: limit })}</FieldDescription>
    </Field>
  )
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {withName && (
            <Field>
              <FieldLabel htmlFor="partition-name">{t("Name")}</FieldLabel>
              <Input
                id="partition-name"
                maxLength={64}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {field(
              "partition-cpus",
              t("vCPU"),
              cpus,
              setCpus,
              0.5,
              0.5,
              max.cpus
            )}
            {field(
              "partition-mem",
              t("Memory (GB)"),
              mem,
              setMem,
              0.5,
              0.5,
              gbOfMb(max.memMb)
            )}
            {field(
              "partition-disk",
              t("Disk (GB)"),
              disk,
              setDisk,
              5,
              5,
              max.diskGb
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
