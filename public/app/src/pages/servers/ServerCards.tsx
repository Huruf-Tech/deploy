import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconArrowLeft,
  IconFolderSymlink,
  IconBrandDocker,
  IconCloudDownload,
  IconLoader2,
  IconRefresh,
  IconBrandUbuntu,
  IconCpu,
  IconKey,
  IconServer2,
  IconTag,
  IconX,
} from "@tabler/icons-react"

import type { TCardProps } from "@/core/types"
import { Container } from "@/core/custom/Container"
import { zodToMongoProjection } from "@/core/lib/zodToMongoProjection"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/console/empty-state"
import { StatusBadge } from "@/components/console/status"
import { DataTable, type TColumn } from "@/components/console/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Meter } from "@/components/console/meter"
import { usePolling } from "@/hooks/use-polling"
import { ago, bytes, dateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { AcceptServerDialog } from "./AcceptServerDialog"
import { AddServerButton } from "./AddServerButton"
import { RentalRequests, RentServerButton } from "@/pages/rentals/Rentals"
import { OwnerRequests } from "@/pages/rentals/HostingPanel"
import { isAddServerOpen, onServersChanged } from "./events"
import { StatusPill } from "./StatusPill"
import { LabelChips } from "./ServerLabels"
import {
  grouped,
  isDirect,
  isMachine,
  isPartition,
  machineOf,
  serverSchema,
  stateOf,
  type TLiveness,
  type TServer,
} from "./server"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"
import {
  FolderActions,
  FolderDialog,
  FolderTile,
  MoveMenu,
  moveServers,
  type TFolder,
} from "@/pages/projects/folders"

function Chip({
  icon: Icon,
  children,
}: {
  icon?: typeof IconCpu
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  )
}

function SetupChips({ server: doc }: { server: TServer }) {
  const { t } = useTranslation()
  const server = doc._id
  const setup = doc.setup

  // A machine hosts partitions; its own setup is theirs (PLAN §27).
  if (isMachine(doc))
    return (
      <Chip>
        {doc.pool?.status !== "ready"
          ? t("Setting up for partitions")
          : t("{{count}} partitions", {
              count: doc.resources?.partitions?.length ?? 0,
            })}
      </Chip>
    )

  if (!setup || setup.status === "pending")
    return (
      <Chip icon={IconLoader2}>
        <span className="motion-safe:animate-pulse">
          {t("Preparing host…")}
        </span>
      </Chip>
    )

  const warnings = setup.checks?.filter((c) => !c.ok) ?? []

  return (
    <>
      {setup.dockerVersion && (
        <Chip icon={IconBrandDocker}>
          {t("Docker {{version}}", { version: setup.dockerVersion })}
        </Chip>
      )}
      {warnings.length > 0 && (
        // Opens the server page's Host setup section, which lists them.
        <Link
          to={`./${server}#host-setup`}
          className="inline-flex items-center gap-1 rounded-md bg-warning-soft px-1.5 py-0.5 text-[11px] text-warning-foreground underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          title={warnings.map((w) => `${w.name}: ${w.detail}`).join("\n")}
        >
          <IconAlertTriangle className="size-3.5" aria-hidden />
          {warnings.length === 1
            ? t("1 host warning")
            : t("{{count}} host warnings", { count: warnings.length })}
        </Link>
      )}
    </>
  )
}

function PendingNote({ server }: { server: TServer }) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-foreground">
      <IconKey className="size-4 shrink-0" aria-hidden />
      <p>
        {t(
          "Check the pairing code printed by the agent on this machine, then accept it."
        )}
        {server.pairingExpiresAt && (
          <span className="mt-0.5 block font-medium">
            {t("Code expires {{when}}", {
              when: ago(server.pairingExpiresAt),
            })}
          </span>
        )}
      </p>
    </div>
  )
}

function SetupFailed({
  server,
  canRetry,
  onPrepare,
}: {
  server: TServer
  canRetry: boolean
  onPrepare: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-xs text-destructive-foreground">
      <p className="min-w-0 flex-1">
        <span className="font-medium">{t("Host setup failed")}:</span>{" "}
        {server.setup?.error}
      </p>
      <Button
        size="xs"
        variant="outline"
        disabled={!canRetry}
        onClick={onPrepare}
      >
        <IconRefresh aria-hidden /> {t("Retry setup")}
      </Button>
    </div>
  )
}

function LastSeen({
  state,
  server,
  live,
}: {
  state: ReturnType<typeof stateOf>
  server: TServer
  live?: TLiveness
}) {
  const { t } = useTranslation()
  return (
    <span
      className="truncate text-xs text-muted-foreground"
      title={live ? dateTime(live.lastSeenAt) : undefined}
    >
      {state === "offline" && live
        ? t("Last seen {{when}}", {
            when: ago(live.lastSeenAt),
          })
        : t("Agent {{version}}", { version: server.inventory.agentVersion })}
    </span>
  )
}

function RowActions({
  state,
  onAccept,
  onReject,
  onPing,
}: {
  state: ReturnType<typeof stateOf>
  onAccept: () => void
  onReject: () => void
  onPing: () => void
}) {
  const { t } = useTranslation()
  if (state === "pending")
    return (
      <div className="flex shrink-0 justify-end gap-1.5">
        <Button size="sm" variant="ghost" onClick={onReject}>
          {t("Reject")}
        </Button>
        <Button size="sm" onClick={onAccept}>
          {t("Accept")}
        </Button>
      </div>
    )
  if (state === "online")
    return (
      <Button size="sm" variant="ghost" onClick={onPing}>
        <IconActivityHeartbeat aria-hidden /> {t("Ping")}
      </Button>
    )
  return null
}

function ServerCard({
  server,
  machine,
  live,
  onAccept,
  onReject,
  onPing,
  onPrepare,
  onLabel,
  selected,
  onSelect,
  move,
}: {
  server: TServer
  /** Listed above it: this is one of its partitions. */
  machine?: string
  /** "Move to folder". */
  move?: React.ReactNode
  live?: TLiveness
  onAccept: () => void
  onReject: () => void
  onPing: () => void
  onPrepare: () => void
  onLabel: (key: string, value: string) => void
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const state = stateOf(server, live)
  const { inventory, resources } = server

  return (
    <article
      className={cn(
        "flex flex-col rounded-[10px] border bg-card",
        state === "pending" && "border-warning/60",
        selected && "ring-2 ring-primary"
      )}
    >
      <header className="flex items-center gap-3 border-b px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">
            <Link
              to={`./${server._id}`}
              state={{ name: server.name }}
              className="hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {server.name}
            </Link>
          </h3>
          {machine ? (
            <p className="truncate text-xs text-muted-foreground">
              {t("Partition of {{machine}}", { machine })}
            </p>
          ) : (
            <p
              dir="ltr"
              className="truncate font-mono text-xs text-muted-foreground"
            >
              {inventory.hostname}
            </p>
          )}
        </div>
        <StatusPill state={state} />
        {move}
        <Checkbox
          aria-label={t("Select {{name}}", { name: server.name })}
          checked={selected}
          onCheckedChange={onSelect}
        />
      </header>

      <div className="flex flex-1 flex-col gap-2 px-3 py-2.5">
        {state === "pending" ? (
          <PendingNote server={server} />
        ) : resources ? (
          <>
            <Meter
              layout="row"
              label={t("CPU")}
              hue="sky"
              value={resources.cpu}
              total={1}
              text={`${Math.round(resources.cpu * 100)}%`}
            />
            <Meter
              layout="row"
              label={t("Memory")}
              hue="violet"
              value={inventory.memory - resources.memFree}
              total={inventory.memory}
              text={`${bytes(inventory.memory - resources.memFree)} / ${bytes(inventory.memory)}`}
            />
            <Meter
              layout="row"
              label={t("Disk")}
              hue="emerald"
              value={inventory.disk - resources.diskFree}
              total={inventory.disk}
              text={`${bytes(inventory.disk - resources.diskFree)} / ${bytes(inventory.disk)}`}
            />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("Usage appears after the agent's first report.")}
          </p>
        )}

        <div className="flex flex-wrap gap-1 pt-0.5">
          <Chip icon={IconBrandUbuntu}>{inventory.os}</Chip>
          <Chip icon={IconCpu}>
            {t("{{cores}} CPU", { cores: inventory.cpuCores })} ·{" "}
            {inventory.arch}
          </Chip>
          <Chip>{bytes(inventory.memory)}</Chip>
          {isPartition(server) && <Chip>{t("Partition")}</Chip>}
          {isDirect(server) && <Chip>{t("Runs apps directly")}</Chip>}
          {server.status === "active" && <SetupChips server={server} />}
        </div>
        <LabelChips labels={server.labels} onPick={onLabel} />

        {isMachine(server) &&
          server.pool?.status === "ready" &&
          !server.resources?.partitions?.length && (
            <Link
              to={server._id}
              state={{ name: server.name }}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              {t("Create a partition to deploy here")}
            </Link>
          )}
        {!isMachine(server) && server.setup?.status === "failed" && (
          <SetupFailed
            server={server}
            canRetry={state === "online"}
            onPrepare={onPrepare}
          />
        )}
      </div>

      <footer className="flex min-h-11 items-center justify-between gap-2 border-t px-3 py-1.5">
        <LastSeen state={state} server={server} live={live} />
        <RowActions
          state={state}
          onAccept={onAccept}
          onReject={onReject}
          onPing={onPing}
        />
      </footer>
    </article>
  )
}

const pct = (used: number, total: number) =>
  total > 0 ? `${Math.round((used / total) * 100)}%` : "—"

/** The default view: one dense row per server. */
function ServerTable({
  servers,
  liveness,
  selectedIds,
  toggleSelect,
  onAccept,
  onReject,
  onPing,
  onPrepare,
  onLabel,
  move,
}: {
  servers: TServer[]
  liveness: Map<string, TLiveness>
  selectedIds: string[]
  toggleSelect: (id: string) => void
  onAccept: (s: TServer) => void
  onReject: (s: TServer) => void
  onPing: (s: TServer) => void
  onPrepare: (s: TServer) => void
  onLabel: (key: string, value: string) => void
  /** "Move to folder" for one server. */
  move: (s: TServer) => React.ReactNode
}) {
  const { t } = useTranslation()
  const state = (s: TServer) => stateOf(s, liveness.get(s._id))
  const ORDER = { pending: 0, offline: 1, online: 2, rejected: 3 }

  const columns: TColumn<TServer>[] = [
    {
      id: "select",
      header: <span className="sr-only">{t("Select")}</span>,
      className: "w-8 pe-0",
      cell: (s) => (
        <Checkbox
          aria-label={t("Select {{name}}", { name: s.name })}
          checked={selectedIds.includes(s._id)}
          onCheckedChange={() => toggleSelect(s._id)}
        />
      ),
    },
    {
      id: "name",
      header: t("Server"),
      sortValue: (s) => s.name,
      cell: (s) => {
        const machine = machineOf(s, servers)
        return (
          <div
            className={cn(
              "min-w-40",
              machine && "ms-3 border-s-2 border-border ps-3"
            )}
          >
            <Link
              to={`./${s._id}`}
              state={{ name: s.name }}
              className="font-medium hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {s.name}
            </Link>
            <div className="truncate text-[11px] text-muted-foreground">
              {machine ? (
                t("Partition of {{machine}}", { machine: machine.name })
              ) : (
                <span dir="ltr" className="font-mono">
                  {s.inventory.hostname}
                </span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: "status",
      header: t("Status"),
      sortValue: (s) => ORDER[state(s)],
      cell: (s) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill state={state(s)} />
          {s.status === "active" && <SetupChips server={s} />}
        </div>
      ),
    },
    {
      id: "cpu",
      header: t("CPU"),
      className: "w-36",
      sortValue: (s) => s.resources?.cpu ?? -1,
      cell: (s) =>
        s.resources ? (
          <Meter
            layout="compact"
            label={t("CPU on {{name}}", { name: s.name })}
            hue="sky"
            value={s.resources.cpu}
            total={1}
            text={`${Math.round(s.resources.cpu * 100)}%`}
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "memory",
      header: t("Memory"),
      className: "w-36",
      sortValue: (s) =>
        s.resources ? 1 - s.resources.memFree / s.inventory.memory : -1,
      cell: (s) =>
        s.resources ? (
          <Meter
            layout="compact"
            label={
              t("Memory on {{name}}", { name: s.name }) +
              `: ${bytes(s.inventory.memory - s.resources.memFree)} / ${bytes(s.inventory.memory)}`
            }
            hue="violet"
            value={s.inventory.memory - s.resources.memFree}
            total={s.inventory.memory}
            text={pct(
              s.inventory.memory - s.resources.memFree,
              s.inventory.memory
            )}
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "disk",
      header: t("Disk"),
      className: "w-36",
      sortValue: (s) =>
        s.resources ? 1 - s.resources.diskFree / s.inventory.disk : -1,
      cell: (s) =>
        s.resources ? (
          <Meter
            layout="compact"
            label={
              t("Disk on {{name}}", { name: s.name }) +
              `: ${bytes(s.inventory.disk - s.resources.diskFree)} / ${bytes(s.inventory.disk)}`
            }
            hue="emerald"
            value={s.inventory.disk - s.resources.diskFree}
            total={s.inventory.disk}
            text={pct(
              s.inventory.disk - s.resources.diskFree,
              s.inventory.disk
            )}
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "specs",
      header: t("System"),
      className: "max-xl:hidden",
      cell: (s) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            {s.inventory.os} · {s.inventory.cpuCores} CPU · {s.inventory.arch}
          </span>
          <LabelChips labels={s.labels} onPick={onLabel} />
        </div>
      ),
    },
    {
      id: "seen",
      header: t("Agent"),
      className: "max-lg:hidden",
      cell: (s) => (
        <LastSeen state={state(s)} server={s} live={liveness.get(s._id)} />
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("Actions")}</span>,
      align: "end",
      cell: (s) =>
        s.setup?.status === "failed" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={state(s) !== "online"}
            onClick={() => onPrepare(s)}
            title={s.setup.error ?? undefined}
          >
            <IconRefresh aria-hidden /> {t("Retry setup")}
          </Button>
        ) : (
          <RowActions
            state={state(s)}
            onAccept={() => onAccept(s)}
            onReject={() => onReject(s)}
            onPing={() => onPing(s)}
          />
        ),
    },
    {
      id: "move",
      header: <span className="sr-only">{t("Move to folder")}</span>,
      align: "end",
      className: "w-10",
      sticky: true,
      cell: (s) => move(s),
    },
  ]

  return (
    <div aria-live="polite">
      <DataTable
        label={t("Servers")}
        columns={columns}
        rows={servers}
        rowId={(s) => s._id}
        isSelected={(s) => selectedIds.includes(s._id)}
      />
    </div>
  )
}

/**
 * Updates the agent on the selected servers that can take it: online, with
 * a binary that differs from the published one for their architecture.
 */
function BulkAgentUpdate({
  servers,
  selectedIds,
  liveness,
}: {
  servers: TServer[]
  selectedIds: string[]
  liveness: Map<string, TLiveness>
}) {
  const { t } = useTranslation()
  const { data } = useCached(queries.agentRelease())
  const [busy, setBusy] = React.useState(false)

  const selected = servers.filter((s) => selectedIds.includes(s._id))
  const outdated = selected.filter((s) => {
    const latest = data?.sums[s.inventory.arch]
    return (
      stateOf(s, liveness.get(s._id)) === "online" &&
      !!latest &&
      latest !== s.inventory.agentSha256
    )
  })
  if (!selected.length || !ThunderSDK.isPermitted("servers", "updateAgent"))
    return null

  const update = async () => {
    setBusy(true)
    const results = await Promise.allSettled(
      outdated.map((s) =>
        ThunderSDK.servers.updateAgent({ params: { id: s._id } })
      )
    )
    const failed = results.filter((r) => r.status === "rejected").length
    if (failed < outdated.length)
      toast.success(
        t(
          "Updating {{n}} agent(s): each restarts in a few seconds, then host setup runs.",
          { n: outdated.length - failed }
        )
      )
    if (failed) toast.error(t("{{n}} update(s) couldn't start.", { n: failed }))
    setBusy(false)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border bg-muted/40 px-3 py-2 text-[13px]">
      <span className="text-muted-foreground">
        {!outdated.length &&
          t("The selected servers run the latest agent (or are offline).")}
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={busy || !outdated.length}
        onClick={update}
      >
        {busy ? (
          <IconLoader2 className="animate-spin" aria-hidden />
        ) : (
          <IconCloudDownload aria-hidden />
        )}
        {t("Update selected servers")}
      </Button>
    </div>
  )
}

function AddServerHint() {
  const { t } = useTranslation()

  return (
    <EmptyState
      icon={IconServer2}
      title={t("Add your first server")}
      description={t(
        "Connect a machine over SSH, or run a one-line install on it. Your projects will run there."
      )}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <AddServerButton />
          <RentServerButton />
        </div>
      }
    />
  )
}

export default function ServerCards({
  data,
  isLoading,
  fetcher,
  setFilters,
  setPage,
  selectedIds,
  toggleSelect,
}: TCardProps) {
  const { t } = useTranslation()
  // Clicking a label chip shows only the servers that carry it, in any folder.
  const [label, setLabel] = React.useState<[string, string] | null>(null)
  const filterByLabel = (next: [string, string] | null) => setLabel(next)
  // Folders, as on the Projects page; the open one lives in the URL, so
  // back/forward and links work.
  const foldersQuery = useCached(queries.serverFolders())
  const folders: TFolder[] = foldersQuery.data ?? []
  const groupsQuery = useCached(queries.serverGroupsOf())
  const all = groupsQuery.data ?? []
  const [params, setParams] = useSearchParams()
  const open = folders.find((f) => f._id === params.get("folder"))
  const openFolder = (id: string | null) => setParams(id ? { folder: id } : {})
  const [editing, setEditing] = React.useState<TFolder | "new" | null>(null)
  // Servers to move into the folder being created from a "Move" menu.
  const [toMove, setToMove] = React.useState<string[]>([])
  const newFolderFor = (ids: string[]) => {
    setToMove(ids)
    setEditing("new")
  }
  const hasFolders = folders.length > 0
  // The open folder's servers; otherwise those in none, unless a label looks
  // everywhere.
  React.useEffect(() => {
    const filters = {
      ...(label ? { [`labels.${label[0]}`]: { $eq: label[1] } } : {}),
      ...(open
        ? { group: { $eq: { type: "objectId" as const, value: open._id } } }
        : hasFolders && !label
          ? { group: { $eq: { type: "null" as const, value: "" } } }
          : {}),
    }
    setPage(0)
    setFilters(Object.keys(filters).length ? filters : undefined)
    // setPage and setFilters come from the list page and may change identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label, open?._id, hasFolders])
  const [liveness, setLiveness] = React.useState<Map<string, TLiveness>>(
    new Map()
  )
  const [accepting, setAccepting] = React.useState<TServer | null>(null)

  const refetch = React.useCallback(() => {
    fetcher(zodToMongoProjection(serverSchema))
  }, [fetcher])

  // A block body: an effect must not return fetcher's result, React would call it as cleanup.
  React.useEffect(() => {
    refetch()
  }, [refetch])

  const refreshFolders = () => {
    refetch()
    foldersQuery.reload()
    groupsQuery.reload()
  }
  const moveMenu = (s: TServer) => (
    <MoveMenu
      kind="servers"
      ids={[s._id]}
      folders={folders}
      current={
        folders.some((f) => f._id === s.group)
          ? (s.group ?? undefined)
          : undefined
      }
      onMoved={refreshFolders}
      onNewFolder={newFolderFor}
    />
  )

  // The toolbar's "Add server" lives outside this component.
  React.useEffect(() => onServersChanged(refetch), [refetch])

  const servers = React.useMemo(
    () =>
      // One malformed document must not take the whole list down.
      (Array.isArray(data) ? data : []).flatMap((item) => {
        const parsed = serverSchema.safeParse(item)
        return parsed.success ? [parsed.data] : []
      }),
    [data]
  )
  // Refetch while something is in flight: pending approval or host setup.
  usePolling(() => {
    ThunderSDK.servers
      .liveness({})
      .then((rows) => setLiveness(new Map(rows.map((r) => [r.server, r]))))
      .catch(() => {})
    // The list too: a server installed by hand (or from another tab) appears
    // as soon as its agent says hello, and pending ones flip to active.
    // Core's list page shows skeletons instead of the toolbar while an empty
    // list reloads, which would close an open "Add server" dialog: hold off
    // while it's open, and with nothing listed, reload only once a server exists.
    if (isAddServerOpen()) return
    if (servers.length) return refetch()
    ThunderSDK.servers
      .get({
        params: {},
        query: {
          limit: 1,
          project: { _id: 1 },
          ...(label
            ? { filters: { [`labels.${label[0]}`]: { $eq: label[1] } } }
            : {}),
        },
      })
      .then(({ results }) => results.length && refetch())
      .catch(() => {})
  }, 5_000)

  const reject = async (server: TServer) => {
    await ThunderSDK.servers.reject({ params: { id: server._id } })
    toast.success(t("Server rejected"))
    refetch()
  }

  const prepare = async (server: TServer) => {
    await ThunderSDK.servers.prepare({ params: { id: server._id } })
    toast.success(t("Host setup restarted"))
    refetch()
  }

  const ping = async (server: TServer) => {
    const { seq } = await ThunderSDK.servers.ping({
      params: { id: server._id },
    })
    toast.success(t("Ping sent as command #{{seq}}", { seq }))
  }

  return (
    <Container className="flex flex-col gap-3 py-3">
      {label && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {t("Servers labeled")}
          <span className="inline-flex items-center gap-1 rounded-md border py-0.5 ps-2 pe-0.5 font-mono text-xs text-foreground">
            <IconTag className="size-3" aria-hidden />
            {label[1] ? `${label[0]}=${label[1]}` : label[0]}
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t("Clear the label filter")}
              onClick={() => filterByLabel(null)}
            >
              <IconX />
            </Button>
          </span>
        </div>
      )}
      <RentalRequests />
      <OwnerRequests />
      {open && (
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="self-start text-muted-foreground"
            onClick={() => openFolder(null)}
          >
            <IconArrowLeft className="icon-flip-rtl" aria-hidden />
            {t("All servers")}
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-baseline gap-2 text-lg font-semibold">
                <span className="truncate">{open.name}</span>
                <span className="text-xs font-normal text-muted-foreground tabular-nums">
                  {servers.length === 1
                    ? t("1 server")
                    : t("{{count}} servers", { count: servers.length })}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {open.description || t("A folder of servers.")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FolderActions
                kind="servers"
                folder={open}
                ids={all.filter((s) => s.group === open._id).map((s) => s._id)}
                onRename={() => setEditing(open)}
                onDeleted={() => {
                  openFolder(null)
                  refreshFolders()
                }}
              />
            </div>
          </div>
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="flex justify-end">
          <MoveMenu
            kind="servers"
            ids={selectedIds}
            folders={folders}
            current={open?._id}
            onMoved={refreshFolders}
            onNewFolder={newFolderFor}
            trigger={
              <Button size="sm" variant="outline">
                <IconFolderSymlink aria-hidden />
                {t("Move {{n}} to folder", { n: selectedIds.length })}
              </Button>
            }
          />
        </div>
      )}
      <BulkAgentUpdate
        servers={servers}
        selectedIds={selectedIds}
        liveness={liveness}
      />
      {!label && !open && hasFolders && (
        <>
          <section
            aria-labelledby="server-folders-title"
            className="flex flex-col gap-2"
          >
            <h2 id="server-folders-title" className="text-sm font-semibold">
              {t("Folders")}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {folders.map((f) => {
                const inside = all.filter((s) => s.group === f._id)
                const pending = inside.filter(
                  (s) => s.status === "pending"
                ).length
                const offline = inside.filter(
                  (s) => s.status === "active" && !liveness.get(s._id)?.online
                ).length
                return (
                  <FolderTile
                    key={f._id}
                    folder={f}
                    count={
                      inside.length === 1
                        ? t("1 server")
                        : t("{{count}} servers", { count: inside.length })
                    }
                    hasBadges={!!offline || !!pending}
                    badges={
                      <>
                        {!!offline && (
                          <StatusBadge
                            state="failed"
                            label={t("{{n}} offline", { n: offline })}
                          />
                        )}
                        {!!pending && (
                          <StatusBadge
                            state="building"
                            label={t("{{n}} pending", { n: pending })}
                          />
                        )}
                      </>
                    }
                    onOpen={() => openFolder(f._id)}
                  />
                )
              })}
            </ul>
          </section>
          <h2 className="-mb-1 text-sm font-semibold">
            {t("Not in a folder")}
          </h2>
        </>
      )}
      {isLoading ? (
        <Skeleton className="h-40 rounded-[10px]" />
      ) : !servers.length && !label && (open || (hasFolders && all.length)) ? (
        <p className="rounded-[10px] border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {open
            ? t("This folder is empty. Move servers here from their menu.")
            : t("Every server is in a folder.")}
        </p>
      ) : !servers.length && !label ? (
        <AddServerHint />
      ) : (
        <>
          {/* Desktop: the dense table; phones: cards. */}
          <div className="max-md:hidden">
            <ServerTable
              servers={grouped(servers)}
              liveness={liveness}
              selectedIds={selectedIds}
              toggleSelect={toggleSelect}
              onAccept={setAccepting}
              onReject={reject}
              onPing={ping}
              onPrepare={prepare}
              onLabel={(key, value) => filterByLabel([key, value])}
              move={moveMenu}
            />
          </div>
          <div
            className="grid gap-3 sm:grid-cols-2 md:hidden"
            aria-live="polite"
          >
            {grouped(servers).map((server) => (
              <ServerCard
                key={server._id}
                server={server}
                machine={machineOf(server, servers)?.name}
                live={liveness.get(server._id)}
                onAccept={() => setAccepting(server)}
                onReject={() => reject(server)}
                onPing={() => ping(server)}
                onPrepare={() => prepare(server)}
                onLabel={(key, value) => filterByLabel([key, value])}
                selected={selectedIds.includes(server._id)}
                onSelect={() => toggleSelect(server._id)}
                move={moveMenu(server)}
              />
            ))}
          </div>
        </>
      )}

      {accepting && (
        <AcceptServerDialog
          server={accepting}
          open
          onOpenChange={(open) => !open && setAccepting(null)}
          onAccepted={refetch}
        />
      )}

      <FolderDialog
        kind="servers"
        open={!!editing}
        folder={editing === "new" ? undefined : (editing ?? undefined)}
        onOpenChange={(o) => {
          if (o) return
          setEditing(null)
          setToMove([])
        }}
        onSaved={async (id) => {
          if (toMove.length && (await moveServers(toMove, id)))
            toast.error(t("Could not move the servers into the folder"))
          refreshFolders()
          if (editing === "new") openFolder(id)
        }}
      />
    </Container>
  )
}
