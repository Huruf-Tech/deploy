import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconBrandDocker,
  IconLoader2,
  IconRefresh,
  IconBrandUbuntu,
  IconCpu,
  IconKey,
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
import { AddServerButton } from "./AddServerButton"
import { onServersChanged } from "./events"
import { StatusPill } from "./StatusPill"
import {
  gib,
  serverSchema,
  stateOf,
  STATE_STYLE,
  type TLiveness,
  type TServer,
} from "./server"

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

function SetupChips({ setup }: { setup: TServer["setup"] }) {
  const { t } = useTranslation()

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
        <span
          className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-2 py-0.5 text-xs text-foreground"
          title={warnings.map((w) => `${w.name}: ${w.detail}`).join("\n")}
        >
          <IconAlertTriangle className="size-3.5" aria-hidden />
          {t("{{count}} host warnings", { count: warnings.length })}
        </span>
      )}
    </>
  )
}

function ServerCard({
  server,
  live,
  onAccept,
  onReject,
  onPing,
  onPrepare,
}: {
  server: TServer
  live?: TLiveness
  onAccept: () => void
  onReject: () => void
  onPing: () => void
  onPrepare: () => void
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
            <CardTitle className="truncate">
              <Link
                to={`./${server._id}`}
                state={{ name: server.name }}
                className="hover:underline focus-visible:underline"
              >
                {server.name}
              </Link>
            </CardTitle>
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
          {server.status === "active" && <SetupChips setup={server.setup} />}
        </div>

        {server.setup?.status === "failed" && (
          <div className="flex flex-col gap-2 rounded-2xl bg-destructive/10 p-3 text-xs text-destructive">
            <p>
              <span className="font-medium">{t("Host setup failed")}:</span>{" "}
              {server.setup.error}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              disabled={state !== "online"}
              onClick={onPrepare}
            >
              <IconRefresh aria-hidden /> {t("Retry setup")}
            </Button>
          </div>
        )}
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

function AddServerHint() {
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
        <AddServerButton />
      </EmptyContent>
    </Empty>
  )
}

export default function ServerCards({ data, isLoading, fetcher }: TCardProps) {
  const { t } = useTranslation()
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

  // The toolbar's "Add server" lives outside this component.
  React.useEffect(() => onServersChanged(refetch), [refetch])

  const servers = React.useMemo(
    () => (Array.isArray(data) ? serverSchema.array().parse(data) : []),
    [data]
  )
  // Refetch while something is in flight: pending approval or host setup.
  const hasPending = servers.some(
    (s) =>
      s.status === "pending" ||
      (s.status === "active" &&
        s.setup?.status !== "ready" &&
        s.setup?.status !== "failed")
  )

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
    <Container className="py-4">
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-4xl" />
          ))}
        </div>
      ) : !servers.length ? (
        <AddServerHint />
      ) : (
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
              onPrepare={() => prepare(server)}
            />
          ))}
        </div>
      )}

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
