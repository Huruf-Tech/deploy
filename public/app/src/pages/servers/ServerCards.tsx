import * as React from "react"
import z from "zod"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  IconActivityHeartbeat,
  IconBrandUbuntu,
  IconCpu,
  IconKey,
  IconPlus,
  IconServer2,
} from "@tabler/icons-react"

import type { TCardProps } from "@/core/types"
import { Container } from "@/core/custom/Container"
import { zodToMongoProjection } from "@/core/lib/zodToMongoProjection"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { ResourceBar } from "@/components/resource-bar"
import { usePolling } from "@/hooks/use-polling"
import { cn } from "@/lib/utils"
import { AcceptServerDialog } from "./AcceptServerDialog"
import { AddServerDialog } from "./AddServerDialog"

const serverSchema = z.object({
  _id: z.string(),
  name: z.string(),
  status: z.enum(["pending", "active", "rejected"]),
  pairingExpiresAt: z.coerce.date().optional(),
  inventory: z.object({
    hostname: z.string(),
    os: z.string(),
    arch: z.string(),
    cpuCores: z.number(),
    memory: z.number(),
    disk: z.number(),
    agentVersion: z.string(),
  }),
  resources: z
    .object({ cpu: z.number(), memFree: z.number(), diskFree: z.number() })
    .optional(),
})

type TServer = z.infer<typeof serverSchema>
type TLiveness = Awaited<ReturnType<typeof ThunderSDK.servers.liveness>>
type TState = "pending" | "online" | "offline" | "rejected"

const gib = (bytes: number) => `${(bytes / 2 ** 30).toFixed(1)} GiB`

const stateOf = (server: TServer, live?: TLiveness[number]): TState =>
  server.status === "active"
    ? live?.online
      ? "online"
      : "offline"
    : server.status

const STATE_STYLE: Record<TState, { dot: string; pill: string; tile: string }> =
  {
    online: {
      dot: "bg-success",
      pill: "bg-success/10 text-success",
      tile: "bg-primary/10 text-primary",
    },
    offline: {
      dot: "bg-muted-foreground",
      pill: "bg-muted text-muted-foreground",
      tile: "bg-muted text-muted-foreground",
    },
    pending: {
      dot: "bg-warning",
      pill: "bg-warning/15 text-foreground",
      tile: "bg-warning/15 text-foreground",
    },
    rejected: {
      dot: "bg-destructive",
      pill: "bg-destructive/10 text-destructive",
      tile: "bg-destructive/10 text-destructive",
    },
  }

function StatusPill({ state }: { state: TState }) {
  const { t } = useTranslation()
  const label = {
    online: t("Online"),
    offline: t("Offline"),
    pending: t("Waiting for approval"),
    rejected: t("Rejected"),
  }[state]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        STATE_STYLE[state].pill
      )}
    >
      <span className="relative flex size-2">
        {state === "online" && (
          <span className="absolute inline-flex size-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            STATE_STYLE[state].dot
          )}
        />
      </span>
      {label}
    </span>
  )
}

function Chip({
  icon: Icon,
  children,
}: {
  icon?: typeof IconCpu
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  )
}

function ServerCard({
  server,
  live,
  onAccept,
  onReject,
  onPing,
}: {
  server: TServer
  live?: TLiveness[number]
  onAccept: () => void
  onReject: () => void
  onPing: () => void
}) {
  const { t } = useTranslation()
  const state = stateOf(server, live)
  const { inventory, resources } = server

  return (
    <Card
      size="sm"
      className={cn(
        "transition-shadow duration-200 hover:shadow-lg",
        state === "pending" && "ring-2 ring-warning/40",
        state === "offline" && "opacity-80"
      )}
    >
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-2xl",
              STATE_STYLE[state].tile
            )}
          >
            <IconServer2 className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate">{server.name}</CardTitle>
            <CardDescription className="truncate font-mono text-xs">
              {inventory.hostname}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <StatusPill state={state} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5">
        {state === "pending" ? (
          <div className="flex gap-3 rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
            <IconKey className="size-4 shrink-0 text-foreground" aria-hidden />
            <p>
              {t(
                "Check the pairing code printed by the agent on this machine, then accept it."
              )}
              {server.pairingExpiresAt && (
                <span className="mt-1 block text-foreground">
                  {t("Code expires {{when}}", {
                    when: formatDistanceToNow(server.pairingExpiresAt, {
                      addSuffix: true,
                    }),
                  })}
                </span>
              )}
            </p>
          </div>
        ) : resources ? (
          <>
            <ResourceBar
              label={t("CPU")}
              used={resources.cpu}
              total={1}
              detail={`${Math.round(resources.cpu * 100)}%`}
            />
            <ResourceBar
              label={t("Memory")}
              used={inventory.memory - resources.memFree}
              total={inventory.memory}
              detail={`${gib(inventory.memory - resources.memFree)} / ${gib(inventory.memory)}`}
            />
            <ResourceBar
              label={t("Disk")}
              used={inventory.disk - resources.diskFree}
              total={inventory.disk}
              detail={`${gib(inventory.disk - resources.diskFree)} / ${gib(inventory.disk)}`}
            />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("Usage appears after the agent's first report.")}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Chip icon={IconBrandUbuntu}>{inventory.os}</Chip>
          <Chip icon={IconCpu}>
            {t("{{cores}} CPU", { cores: inventory.cpuCores })} ·{" "}
            {inventory.arch}
          </Chip>
          <Chip>{gib(inventory.memory)}</Chip>
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-2 border-t">
        <span
          className="truncate text-xs text-muted-foreground"
          title={live ? new Date(live.lastSeenAt).toLocaleString() : undefined}
        >
          {state === "offline" && live
            ? t("Last seen {{when}}", {
                when: formatDistanceToNow(new Date(live.lastSeenAt), {
                  addSuffix: true,
                }),
              })
            : t("Agent {{version}}", { version: inventory.agentVersion })}
        </span>

        {state === "pending" && (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="ghost" onClick={onReject}>
              {t("Reject")}
            </Button>
            <Button size="sm" onClick={onAccept}>
              {t("Accept")}
            </Button>
          </div>
        )}
        {state === "online" && (
          <Button size="sm" variant="outline" onClick={onPing}>
            <IconActivityHeartbeat aria-hidden /> {t("Ping")}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function AddServerHint({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation()

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconServer2 />
        </EmptyMedia>
        <EmptyTitle>{t("Add your first server")}</EmptyTitle>
        <EmptyDescription>
          {t(
            "Connect a machine over SSH, or run a one-line install on it. Your projects will run there."
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onAdd}>
          <IconPlus aria-hidden /> {t("Add server")}
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export default function ServerCards({ data, isLoading, fetcher }: TCardProps) {
  const { t } = useTranslation()
  const [liveness, setLiveness] = React.useState<
    Map<string, TLiveness[number]>
  >(new Map())
  const [accepting, setAccepting] = React.useState<TServer | null>(null)
  const [adding, setAdding] = React.useState(false)

  const refetch = React.useCallback(() => {
    fetcher(zodToMongoProjection(serverSchema))
  }, [fetcher])

  // A block body: an effect must not return fetcher's result, React would call it as cleanup.
  React.useEffect(() => {
    refetch()
  }, [refetch])

  const servers = React.useMemo(
    () => (Array.isArray(data) ? serverSchema.array().parse(data) : []),
    [data]
  )
  const hasPending = servers.some((s) => s.status === "pending")

  usePolling(() => {
    ThunderSDK.servers
      .liveness({})
      .then((rows) => setLiveness(new Map(rows.map((r) => [r.server, r]))))
      .catch(() => {})
    // Pending servers flip to active from another tab or the agent's side.
    if (hasPending) refetch()
  }, 5_000)

  const reject = async (server: TServer) => {
    await ThunderSDK.servers.reject({ params: { id: server._id } })
    toast.success(t("Server rejected"))
    refetch()
  }

  const ping = async (server: TServer) => {
    const { seq } = await ThunderSDK.servers.ping({
      params: { id: server._id },
    })
    toast.success(t("Ping sent as command #{{seq}}", { seq }))
  }

  return (
    <Container className="py-4">
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-4xl" />
          ))}
        </div>
      ) : !servers.length ? (
        <AddServerHint onAdd={() => setAdding(true)} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAdding(true)}>
              <IconPlus aria-hidden /> {t("Add server")}
            </Button>
          </div>
          <div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            aria-live="polite"
          >
            {servers.map((server) => (
              <ServerCard
                key={server._id}
                server={server}
                live={liveness.get(server._id)}
                onAccept={() => setAccepting(server)}
                onReject={() => reject(server)}
                onPing={() => ping(server)}
              />
            ))}
          </div>
        </div>
      )}

      <AddServerDialog
        open={adding}
        onOpenChange={setAdding}
        onAdded={refetch}
      />

      {accepting && (
        <AcceptServerDialog
          server={accepting}
          open
          onOpenChange={(open) => !open && setAccepting(null)}
          onAccepted={refetch}
        />
      )}
    </Container>
  )
}
