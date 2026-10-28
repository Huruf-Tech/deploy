import * as React from "react"
import z from "zod"
import { Link, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import {
  IconCloudDownload,
  IconFileText,
  IconTerminal2,
  IconPlugConnectedX,
  IconTrash,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { useBreadcrumbTitle } from "@/core/layouts/shared/breadcrumb"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Panel } from "@/components/console/panel"
import { Stat, StatStrip } from "@/components/console/stat"
import { StatusBadge } from "@/components/console/status"
import { DataTable } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { KeyValue } from "@/components/console/key-value"
import { TimeSeries } from "@/components/charts/presets"
import { usePolling } from "@/hooks/use-polling"
import { useStream, type TStreamChunk } from "@/hooks/use-stream"
import { errorMessage } from "@/lib/utils"
import { bytes } from "@/lib/format"
import { toast } from "sonner"
import { LogsSheet } from "./LogsSheet"

// xterm.js is loaded only when a terminal opens (PLAN §15.5 per-route bundles).
const TerminalSheet = React.lazy(() => import("./TerminalSheet"))
import { StatusPill } from "./StatusPill"
import { ServerLabels, ServerName } from "./ServerLabels"
import { HostSetup } from "./HostSetup"
import { RemoveServerDialog } from "./RemoveServerDialog"
import { RentalPanel } from "@/pages/rentals/Rentals"
import { PoolPanel } from "@/pages/rentals/PoolPanel"
import { PageHeader } from "@/components/console/page-header"
import {
  isMachine,
  serverSchema,
  stateOf,
  type TLiveness,
  type TServer,
} from "./server"
import { MachinePanel } from "./MachinePanel"
import { MeasurementsPanel } from "./MeasurementsPanel"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

/** 24 h of history plus ~30 min of live samples, bounded (PLAN §20.4). */
const MAX_SAMPLES = 2_400

const $sample = z.object({
  t: z.number(),
  cpu: z.number(),
  memUsed: z.number(),
  memTotal: z.number(),
  diskUsed: z.number(),
  diskTotal: z.number(),
  netRx: z.number(),
  netTx: z.number(),
  containers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        image: z.string(),
        state: z.string(),
        cpu: z.number(),
        mem: z.number(),
      })
    )
    .optional(),
})
type TSample = z.infer<typeof $sample>

const percent = (value: number) => `${Math.round(value * 100)}%`
const rate = (bytesPerSecond: number) =>
  bytesPerSecond >= 2 ** 20
    ? `${(bytesPerSecond / 2 ** 20).toFixed(1)} MiB/s`
    : `${(bytesPerSecond / 2 ** 10).toFixed(1)} KiB/s`

/** Charts draw at most this many points; older samples are thinned out. */
const CHART_POINTS = 240

function thin<T>(rows: T[]) {
  const step = Math.ceil(rows.length / CHART_POINTS)
  return step <= 1
    ? rows
    : rows.filter((_, i) => i % step === 0 || i === rows.length - 1)
}

function LiveMetrics({
  server,
  onShell,
}: {
  server: string
  onShell: (container: string) => void
}) {
  const canShell = ThunderSDK.isPermitted("streams", "openTerminal")
  const { t } = useTranslation()
  const [samples, setSamples] = React.useState<TSample[]>([])
  const [logs, setLogs] = React.useState<string | null>(null)

  const open = React.useCallback(
    () =>
      ThunderSDK.streams
        .openMetrics({ body: { server } })
        .then((r) => r.session),
    [server]
  )
  const onChunk = React.useCallback((chunk: TStreamChunk) => {
    const parsed = $sample.array().safeParse(JSON.parse(chunk.data || "[]"))
    if (parsed.success) {
      setSamples((current) => [...current, ...parsed.data].slice(-MAX_SAMPLES))
    }
  }, [])
  const { status, error } = useStream(open, onChunk)

  const latest = samples.at(-1)
  // undefined until a sample with container stats arrives (they follow ~2 s later).
  const containers = [...samples]
    .reverse()
    .find((s) => s.containers)?.containers
  const [range, setRange] = React.useState<"15m" | "24h">("15m")
  const series = React.useMemo(
    () =>
      thin(
        range === "24h"
          ? samples
          : samples.filter((s) => s.t >= (samples.at(-1)?.t ?? 0) - 15 * 60_000)
      ).map((s) => ({
        date: new Date(s.t),
        cpu: s.cpu,
        mem: s.memTotal ? s.memUsed / s.memTotal : 0,
      })),
    [samples, range]
  )

  if (status === "error")
    return (
      <p className="rounded-lg bg-destructive-soft px-3 py-2 text-[13px] text-destructive-foreground">
        {error}
      </p>
    )

  if (!latest)
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-18 rounded-[10px]" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-[10px]" />
      </div>
    )

  return (
    <div className="flex flex-col gap-4">
      <StatStrip className="lg:grid-cols-4">
        <Stat label={t("CPU")} value={percent(latest.cpu)} />
        <Stat
          label={t("Memory")}
          value={percent(
            latest.memTotal ? latest.memUsed / latest.memTotal : 0
          )}
          hint={`${bytes(latest.memUsed)} / ${bytes(latest.memTotal)}`}
        />
        <Stat
          label={t("Disk")}
          value={percent(
            latest.diskTotal ? latest.diskUsed / latest.diskTotal : 0
          )}
          hint={`${bytes(latest.diskUsed)} / ${bytes(latest.diskTotal)}`}
        />
        <Stat
          label={t("Network")}
          value={rate(latest.netRx + latest.netTx)}
          hint={`↓ ${rate(latest.netRx)} · ↑ ${rate(latest.netTx)}`}
        />
      </StatStrip>

      <Panel
        title={t("CPU and memory")}
        description={
          range === "15m"
            ? t("The last 15 minutes, then live every 2 seconds")
            : t("The last 24 hours, then live every 2 seconds")
        }
        actions={
          <ToggleGroup
            value={range}
            onValueChange={(v) => setRange(v as "15m" | "24h")}
            aria-label={t("Range")}
          >
            <ToggleGroupItem value="15m" className="px-2 py-0.5 text-xs">
              {t("15 min")}
            </ToggleGroupItem>
            <ToggleGroupItem value="24h" className="px-2 py-0.5 text-xs">
              {t("24 h")}
            </ToggleGroupItem>
          </ToggleGroup>
        }
      >
        {series.length < 2 ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : (
          <TimeSeries
            data={series}
            series={[
              { key: "cpu", label: t("CPU") },
              { key: "mem", label: t("Memory") },
            ]}
            format={percent}
            aspectRatio="4 / 1"
          />
        )}
      </Panel>

      <section
        aria-labelledby="containers-title"
        className="flex flex-col gap-2"
      >
        <h2 id="containers-title" className="text-sm font-semibold">
          {t("Containers")}
        </h2>
        <DataTable
          label={t("Containers")}
          rows={containers}
          loading={!containers}
          rowId={(c) => c.id}
          empty={t(
            "No containers yet. They appear here once the host is prepared and projects are deployed."
          )}
          columns={[
            {
              id: "name",
              header: t("Name"),
              sortValue: (c) => c.name,
              cell: (c) => <span className="font-mono text-xs">{c.name}</span>,
            },
            {
              id: "image",
              header: t("Container image"),
              className: "max-md:hidden",
              cell: (c) => (
                <span className="block max-w-56 truncate text-xs text-muted-foreground">
                  {c.image}
                </span>
              ),
            },
            {
              id: "state",
              header: t("State"),
              sortValue: (c) => c.state,
              cell: (c) => <StatusBadge state={c.state} label={c.state} />,
            },
            {
              id: "cpu",
              header: t("CPU"),
              align: "end",
              sortValue: (c) => c.cpu,
              cell: (c) => (
                <span className="font-mono text-xs">{percent(c.cpu)}</span>
              ),
            },
            {
              id: "mem",
              header: t("Memory"),
              align: "end",
              sortValue: (c) => c.mem,
              cell: (c) => (
                <span className="font-mono text-xs">
                  {(c.mem / 2 ** 20).toFixed(0)} MiB
                </span>
              ),
            },
            {
              id: "actions",
              header: <span className="sr-only">{t("Actions")}</span>,
              align: "end",
              cell: (c) => (
                <div className="flex justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setLogs(c.name)}
                  >
                    <IconFileText aria-hidden /> {t("Logs")}
                  </Button>
                  {canShell && c.state === "running" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onShell(c.name)}
                    >
                      <IconTerminal2 aria-hidden /> {t("Shell")}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </section>

      <LogsSheet
        server={server}
        container={logs}
        onOpenChange={(open) => !open && setLogs(null)}
      />
    </div>
  )
}

/** A server's page (PLAN §15.4): essentials up top, live data on demand. */
/**
 * Offers the published agent when this server runs another build (PLAN §16
 * Phase 12). The agent verifies the download, restarts, then host setup
 * brings its dependencies up to date.
 */
function AgentUpdate({
  server,
}: {
  server: {
    _id: string
    inventory: { arch: string; agentSha256?: string | null }
  }
}) {
  const { t } = useTranslation()
  const { data } = useCached(queries.agentRelease())
  const [busy, setBusy] = React.useState(false)
  const latest = data?.sums[server.inventory.arch]
  if (!latest || latest === server.inventory.agentSha256) return null

  const update = async () => {
    setBusy(true)
    try {
      await ThunderSDK.servers.updateAgent({ params: { id: server._id } })
      toast.success(
        t(
          "Updating: the agent restarts in a few seconds, then host setup runs."
        )
      )
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not update the agent"))
      setBusy(false)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={update} disabled={busy}>
      <IconCloudDownload aria-hidden /> {t("Update agent")}
    </Button>
  )
}

export default function ServerDetail() {
  const { t } = useTranslation()
  const { id = "" } = useParams<{ id: string }>()
  const [live, setLive] = React.useState<TLiveness>()
  const [removing, setRemoving] = React.useState(false)
  const [terminal, setTerminal] = React.useState<{
    container: string | null
  } | null>(null)

  const { data, reload } = useCached(queries.server(id))
  // Newer copy fetched while host setup runs (see the polling below).
  const [latest, setLatest] = React.useState<unknown>()
  const server = React.useMemo(() => {
    const parsed = serverSchema.safeParse(latest ?? data?.results?.[0])
    return parsed.success ? parsed.data : undefined
  }, [data, latest])
  useBreadcrumbTitle(server?.name)
  // A reload of the cached request (labels, rename) supersedes the copy.
  React.useEffect(() => setLatest(undefined), [data])

  usePolling(() => {
    ThunderSDK.servers
      .liveness({})
      .then((rows) => setLive(rows.find((r) => r.server === id)))
      .catch(() => {})
    // Host setup reports when it's done: follow it here, without reloading
    // the cached request (which would swap the page for a skeleton).
    // A machine's own setup is `pool.status`; a partition's, `setup.status`.
    const setup = server && isMachine(server) ? server.pool : server?.setup
    if (
      server?.status === "active" &&
      setup?.status !== "ready" &&
      setup?.status !== "failed"
    ) {
      ThunderSDK.servers
        .get({ params: { id }, query: {} })
        .then((res) => setLatest((res as { results: unknown[] }).results?.[0]))
        .catch(() => {})
    }
  }, 5_000)

  // Only before the first load: a refetch keeps showing what's there.
  if (!server)
    return (
      <Page className="flex flex-col gap-4 py-5">
        <Skeleton className="h-14 rounded-[10px]" />
        <Skeleton className="h-64 rounded-[10px]" />
      </Page>
    )

  const state = stateOf(server, live)
  const { inventory } = server

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={
          <ServerName server={server._id} name={server.name} onSaved={reload} />
        }
        status={<StatusPill state={state} />}
        description={
          <span dir="ltr" className="font-mono text-xs">
            {inventory.hostname}
          </span>
        }
        actions={
          <>
            {state === "online" && <AgentUpdate server={server} />}
            {state === "online" &&
              ThunderSDK.isPermitted("streams", "openHostTerminal") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTerminal({ container: null })}
                >
                  <IconTerminal2 aria-hidden /> {t("Terminal")}
                </Button>
              )}
            {/* A rented server goes with its rental (PLAN §26.9). */}
            {ThunderSDK.isPermitted("servers", "del") &&
              server.provider?.kind !== "rented" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive-foreground"
                  onClick={() => setRemoving(true)}
                >
                  <IconTrash aria-hidden /> {t("Remove")}
                </Button>
              )}
          </>
        }
      />
      {server.provider?.kind === "partition" ? (
        <RemovePartitionDialog
          server={server}
          open={removing}
          onOpenChange={setRemoving}
        />
      ) : (
        <RemoveServerDialog
          server={server}
          online={state === "online"}
          open={removing}
          onOpenChange={setRemoving}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          {state === "online" ? (
            <LiveMetrics
              server={server._id}
              onShell={(container) => setTerminal({ container })}
            />
          ) : (
            <EmptyState
              icon={IconPlugConnectedX}
              title={t("Live data needs the server online")}
              description={t(
                "Metrics and logs stay on the server and are streamed only while it is connected."
              )}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          {server.provider?.kind === "rented" && (
            <RentalPanel server={server._id} />
          )}
          {isMachine(server) && (
            <MachinePanel server={server} onChanged={reload} />
          )}
          <PoolPanel server={server} onChanged={reload} />
          <Panel title={t("Machine")} bodyClassName="py-1">
            <KeyValue
              items={[
                {
                  label: t("Hostname"),
                  value: inventory.hostname,
                  copy: inventory.hostname,
                },
                { label: t("Operating system"), value: inventory.os },
                {
                  label: t("CPU"),
                  value:
                    t("{{cores}} CPU", { cores: inventory.cpuCores }) +
                    ` · ${inventory.arch}`,
                },
                { label: t("Memory"), value: bytes(inventory.memory) },
                { label: t("Disk"), value: bytes(inventory.disk) },
                ...(server.setup?.dockerVersion
                  ? [{ label: "Docker", value: server.setup.dockerVersion }]
                  : []),
                { label: t("Agent"), value: inventory.agentVersion },
                ...(server.provider?.kind === "partition" &&
                server.provider.host
                  ? [
                      {
                        label: t("Partition of"),
                        value: (
                          <Link
                            to={`../${server.provider.host}`}
                            relative="path"
                            className="underline underline-offset-2"
                          >
                            {t("its machine")}
                          </Link>
                        ),
                      },
                    ]
                  : []),
                { label: t("Server ID"), value: server._id, copy: server._id },
              ]}
            />
          </Panel>
          <MeasurementsPanel server={server._id} machine={isMachine(server)} />
          <Panel title={t("Labels")}>
            <ServerLabels
              server={server._id}
              labels={server.labels}
              onSaved={reload}
            />
          </Panel>
          {/* A machine runs no projects: its setup is in the Partitions panel. */}
          {!isMachine(server) && (
            <HostSetup
              server={server}
              online={state === "online"}
              onChanged={reload}
            />
          )}
        </div>
      </div>

      {terminal && (
        <React.Suspense fallback={null}>
          <TerminalSheet
            server={server._id}
            container={terminal.container}
            open
            onOpenChange={(open) => !open && setTerminal(null)}
          />
        </React.Suspense>
      )}
    </Page>
  )
}

/** A partition goes from its machine with its projects and data (PLAN §27.4). */
function RemovePartitionDialog({
  server,
  open,
  onOpenChange,
}: {
  server: TServer
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const remove = async () => {
    try {
      await ThunderSDK.servers.del({ params: { id: server._id } })
      await ThunderSDK.forgetCache(["servers", server._id], { subKeys: true })
      toast.success(t("Partition removed with its projects and data"))
      onOpenChange(false)
      navigate("..", { relative: "path" })
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not remove it"))
    }
  }
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("Remove {{name}}", { name: server.name })}
      description={t(
        "This partition is deleted from its machine with its projects' containers and data. The machine keeps running."
      )}
      confirmLabel={t("Remove partition")}
      onConfirm={remove}
    />
  )
}
