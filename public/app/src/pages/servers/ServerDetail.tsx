import * as React from "react"
import z from "zod"
import { useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { format } from "date-fns"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  IconFileText,
  IconTerminal2,
  IconPlugConnectedX,
  IconServer2,
} from "@tabler/icons-react"

import { Container } from "@/core/custom/Container"
import { use } from "@/core/hooks/use"
import { useBreadcrumbTitle } from "@/core/layouts/shared/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePolling } from "@/hooks/use-polling"
import { useStream, type TStreamChunk } from "@/hooks/use-stream"
import { cn } from "@/lib/utils"
import { LogsSheet } from "./LogsSheet"

// xterm.js is loaded only when a terminal opens (PLAN §15.5 per-route bundles).
const TerminalSheet = React.lazy(() => import("./TerminalSheet"))
import { StatusPill } from "./StatusPill"
import {
  gib,
  serverSchema,
  stateOf,
  STATE_STYLE,
  type TLiveness,
} from "./server"

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

const chartConfig = {
  cpu: { label: "CPU", color: "var(--chart-1)" },
  mem: { label: "Memory", color: "var(--chart-3)" },
} satisfies ChartConfig

function Stat({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-heading text-2xl tabular-nums">{value}</span>
        {detail && (
          <span className="text-xs text-muted-foreground">{detail}</span>
        )}
      </CardContent>
    </Card>
  )
}

function UsageChart({
  title,
  data,
  dataKey,
}: {
  title: string
  data: { t: number; cpu: number; mem: number }[]
  dataKey: "cpu" | "mem"
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-48 w-full"
        >
          <AreaChart data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t: number) => format(t, "HH:mm")}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={percent}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, items) =>
                    format(items?.[0]?.payload?.t ?? 0, "HH:mm:ss")
                  }
                  formatter={(value) => percent(Number(value))}
                />
              }
            />
            <Area
              dataKey={dataKey}
              type="monotone"
              stroke={`var(--color-${dataKey})`}
              fill={`var(--color-${dataKey})`}
              fillOpacity={0.15}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
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
  const containers =
    [...samples].reverse().find((s) => s.containers)?.containers ?? []
  const series = React.useMemo(
    () =>
      samples.map((s) => ({
        t: s.t,
        cpu: s.cpu,
        mem: s.memTotal ? s.memUsed / s.memTotal : 0,
      })),
    [samples]
  )

  if (status === "error")
    return (
      <p className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </p>
    )

  if (!latest)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-4xl" />
        ))}
      </div>
    )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("CPU")} value={percent(latest.cpu)} />
        <Stat
          label={t("Memory")}
          value={percent(
            latest.memTotal ? latest.memUsed / latest.memTotal : 0
          )}
          detail={`${gib(latest.memUsed)} / ${gib(latest.memTotal)}`}
        />
        <Stat
          label={t("Disk")}
          value={percent(
            latest.diskTotal ? latest.diskUsed / latest.diskTotal : 0
          )}
          detail={`${gib(latest.diskUsed)} / ${gib(latest.diskTotal)}`}
        />
        <Stat
          label={t("Network")}
          value={rate(latest.netRx + latest.netTx)}
          detail={`↓ ${rate(latest.netRx)} · ↑ ${rate(latest.netTx)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UsageChart title={t("CPU")} data={series} dataKey="cpu" />
        <UsageChart title={t("Memory")} data={series} dataKey="mem" />
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">{t("Containers")}</CardTitle>
        </CardHeader>
        <CardContent>
          {containers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t(
                "No containers yet. They appear here once the host is prepared and projects are deployed."
              )}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Container image")}</TableHead>
                  <TableHead>{t("State")}</TableHead>
                  <TableHead className="text-end">{t("CPU")}</TableHead>
                  <TableHead className="text-end">{t("Memory")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">
                      {c.name}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-xs text-muted-foreground">
                      {c.image}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.state === "running" ? "secondary" : "outline"
                        }
                      >
                        {c.state}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {percent(c.cpu)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {(c.mem / 2 ** 20).toFixed(0)} MiB
                    </TableCell>
                    <TableCell className="text-end">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LogsSheet
        server={server}
        container={logs}
        onOpenChange={(open) => !open && setLogs(null)}
      />
    </div>
  )
}

/** A server's page (PLAN §15.4): essentials up top, live data on demand. */
export default function ServerDetail() {
  const { t } = useTranslation()
  const { id = "" } = useParams<{ id: string }>()
  const [live, setLive] = React.useState<TLiveness>()
  const [terminal, setTerminal] = React.useState<{
    container: string | null
  } | null>(null)

  // Same pattern as core's ListPage: cached request at the top level, read with use().
  const request = ThunderSDK.useCaching(
    ["servers", id],
    async ({ signal }) =>
      (await ThunderSDK.servers.get({ signal, params: { id }, query: {} })) as {
        results: unknown[]
      }
  )
  const { data, isLoading } = use(request)
  const server = React.useMemo(() => {
    const parsed = serverSchema.safeParse(data?.results?.[0])
    return parsed.success ? parsed.data : undefined
  }, [data])
  useBreadcrumbTitle(server?.name)

  usePolling(() => {
    ThunderSDK.servers
      .liveness({})
      .then((rows) => setLive(rows.find((r) => r.server === id)))
      .catch(() => {})
  }, 5_000)

  if (isLoading || !server)
    return (
      <Container className="flex flex-col gap-4 py-4">
        <Skeleton className="h-20 rounded-4xl" />
        <Skeleton className="h-64 rounded-4xl" />
      </Container>
    )

  const state = stateOf(server, live)

  return (
    <Container className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            STATE_STYLE[state].tile
          )}
        >
          <IconServer2 className="size-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-xl">{server.name}</h1>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {server.inventory.hostname} · {server.inventory.os} ·{" "}
            {server.inventory.arch}
            {server.setup?.dockerVersion &&
              ` · Docker ${server.setup.dockerVersion}`}
          </p>
        </div>
        <StatusPill state={state} />
        {state === "online" &&
          ThunderSDK.isPermitted("streams", "openHostTerminal") && (
            <Button
              variant="outline"
              onClick={() => setTerminal({ container: null })}
            >
              <IconTerminal2 aria-hidden /> {t("Terminal")}
            </Button>
          )}
      </div>

      {state === "online" ? (
        <LiveMetrics
          server={server._id}
          onShell={(container) => setTerminal({ container })}
        />
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconPlugConnectedX />
            </EmptyMedia>
            <EmptyTitle>{t("Live data needs the server online")}</EmptyTitle>
            <EmptyDescription>
              {t(
                "Metrics and logs stay on the server and are streamed only while it is connected."
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

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
    </Container>
  )
}
