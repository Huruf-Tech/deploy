import * as React from "react"
import z from "zod"
import { useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  IconCircleCheck,
  IconCircleX,
  IconClockHour4,
  IconPlugConnectedX,
  IconServer2,
} from "@tabler/icons-react"

import type { TCardProps } from "@/core/types"
import { zodToMongoProjection } from "@/core/lib/zodToMongoProjection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/ui/copy-button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { usePolling } from "@/hooks/use-polling"
import { AcceptServerDialog } from "./AcceptServerDialog"

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
    agentVersion: z.string(),
  }),
  resources: z
    .object({ cpu: z.number(), memFree: z.number(), diskFree: z.number() })
    .optional(),
})

type TServer = z.infer<typeof serverSchema>
type TLiveness = Awaited<ReturnType<typeof ThunderSDK.servers.liveness>>

const gib = (bytes: number) => `${(bytes / 2 ** 30).toFixed(1)} GiB`

function StatusBadge({
  server,
  live,
}: {
  server: TServer
  live?: TLiveness[number]
}) {
  const { t } = useTranslation()

  if (server.status === "pending")
    return (
      <Badge variant="outline">
        <IconClockHour4 aria-hidden /> {t("Waiting for approval")}
      </Badge>
    )
  if (server.status === "rejected")
    return (
      <Badge variant="destructive">
        <IconCircleX aria-hidden /> {t("Rejected")}
      </Badge>
    )
  if (live?.online)
    return (
      <Badge>
        <IconCircleCheck aria-hidden /> {t("Online")}
      </Badge>
    )
  return (
    <Badge variant="secondary">
      <IconPlugConnectedX aria-hidden /> {t("Offline")}
    </Badge>
  )
}

function AddServerHint() {
  const { t } = useTranslation()
  const { tenant } = useParams<{ tenant: string }>()
  const command = `deno task dev:agents --tenant ${tenant}`

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconServer2 />
        </EmptyMedia>
        <EmptyTitle>{t("Add your first server")}</EmptyTitle>
        <EmptyDescription>
          {t(
            "Install the agent on a machine with your tenant ID. It will appear here waiting for approval."
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex w-full items-center gap-2 rounded-md bg-muted px-3 py-2 font-mono text-xs">
          <span className="truncate">{command}</span>
          <CopyButton value={command} />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("Development: runs a simulated agent until the installer ships.")}
        </p>
      </EmptyContent>
    </Empty>
  )
}

export default function ServerCards({ data, isLoading, fetcher }: TCardProps) {
  const { t } = useTranslation()
  const [liveness, setLiveness] = React.useState<Map<string, TLiveness[number]>>(
    new Map()
  )
  const [accepting, setAccepting] = React.useState<TServer | null>(null)

  const refetch = React.useCallback(
    () => fetcher(zodToMongoProjection(serverSchema)),
    [fetcher]
  )
  React.useEffect(refetch, [refetch])

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
    const { seq } = await ThunderSDK.servers.ping({ params: { id: server._id } })
    toast.success(t("Ping sent as command #{{seq}}", { seq }))
  }

  if (isLoading)
    return (
      <div className="grid gap-3 p-2 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    )

  if (!servers.length) return <AddServerHint />

  return (
    <div className="grid gap-3 p-2 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
      {servers.map((server) => {
        const live = liveness.get(server._id)

        return (
          <Card key={server._id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <CardTitle className="truncate">{server.name}</CardTitle>
              <StatusBadge server={server} live={live} />
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                <dt>{t("Host")}</dt>
                <dd className="truncate font-mono text-foreground">
                  {server.inventory.hostname}
                </dd>
                <dt>{t("System")}</dt>
                <dd className="truncate text-foreground">
                  {server.inventory.os} · {server.inventory.arch}
                </dd>
                <dt>{t("Capacity")}</dt>
                <dd className="text-foreground">
                  {t("{{cores}} CPU", { cores: server.inventory.cpuCores })} ·{" "}
                  {gib(server.inventory.memory)}
                </dd>
                {server.resources && (
                  <>
                    <dt>{t("Free memory")}</dt>
                    <dd className="text-foreground">
                      {gib(server.resources.memFree)}
                    </dd>
                  </>
                )}
                <dt>{t("Agent")}</dt>
                <dd className="font-mono text-foreground">
                  {server.inventory.agentVersion}
                </dd>
                {server.status === "active" && live && !live.online && (
                  <>
                    <dt>{t("Last seen")}</dt>
                    <dd
                      className="text-foreground"
                      title={new Date(live.lastSeenAt).toLocaleString()}
                    >
                      {formatDistanceToNow(new Date(live.lastSeenAt), {
                        addSuffix: true,
                      })}
                    </dd>
                  </>
                )}
              </dl>

              {server.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setAccepting(server)}>
                    {t("Accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reject(server)}
                  >
                    {t("Reject")}
                  </Button>
                </div>
              )}
              {server.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="self-start"
                  disabled={!live?.online}
                  onClick={() => ping(server)}
                >
                  {t("Ping")}
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}

      {accepting && (
        <AcceptServerDialog
          server={accepting}
          open
          onOpenChange={(open) => !open && setAccepting(null)}
          onAccepted={refetch}
        />
      )}
    </div>
  )
}
