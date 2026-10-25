import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso"
import { IconArrowDown } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { useStream, type TStreamChunk } from "@/hooks/use-stream"
import { cn } from "@/lib/utils"
import { parseLogLine, type TLogLevel } from "./log-line"

/** The browser keeps at most this many lines (PLAN §20.4). */
const MAX_LINES = 10_000

// ponytail: ANSI colours are stripped and lines are coloured by level instead; render ANSI if apps rely on it (PLAN §15.3).
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]/g

const LEVEL_STYLE: Record<TLogLevel, string> = {
  error: "bg-destructive-soft text-destructive-foreground",
  warn: "bg-warning-soft text-warning-foreground",
  info: "bg-info-soft text-info-foreground",
  debug: "bg-muted text-muted-foreground",
}

const time = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

const LogLine = React.memo(function LogLine({ raw }: { raw: string }) {
  const line = React.useMemo(() => parseLogLine(raw), [raw])
  return (
    <div
      className={cn(
        "flex gap-3 border-s-2 border-transparent px-3 py-0.5 hover:bg-muted",
        line.level === "error" && "border-destructive bg-destructive-soft/50",
        line.level === "warn" && "border-warning"
      )}
    >
      {line.time && (
        <time
          dateTime={line.time.toISOString()}
          title={line.time.toLocaleString()}
          className="shrink-0 text-muted-foreground tabular-nums"
        >
          {time.format(line.time)}
        </time>
      )}
      <span
        className={cn(
          "h-fit w-12 shrink-0 rounded px-1 text-center text-[10px] leading-4 font-semibold uppercase",
          line.level ? LEVEL_STYLE[line.level] : "invisible"
        )}
      >
        {line.level ?? "-"}
      </span>
      <span className="min-w-0 break-words whitespace-pre-wrap">
        <span className="text-foreground">{line.message}</span>
        {line.fields.map(([key, value]) => (
          <span key={key} className="ms-3 inline-block break-all">
            <span className="font-medium text-foreground/80">{key}</span>
            <span className="text-muted-foreground">=</span>
            <span className="text-muted-foreground">{value}</span>
          </span>
        ))}
      </span>
    </div>
  )
})

function LogLines({
  server,
  container,
}: {
  server: string
  container: string
}) {
  const { t } = useTranslation()
  const [lines, setLines] = React.useState<string[]>([])
  const [follow, setFollow] = React.useState(true)
  const list = React.useRef<VirtuosoHandle>(null)
  const partial = React.useRef("")

  const open = React.useCallback(
    () =>
      ThunderSDK.streams
        .openLogs({ body: { server, container, tail: 200 } })
        .then((r) => r.session),
    [server, container]
  )

  const onChunk = React.useCallback((chunk: TStreamChunk) => {
    const text = partial.current + chunk.data.replace(ANSI, "")
    const parts = text.split("\n")
    partial.current = parts.pop() ?? ""
    if (parts.length) {
      setLines((current) => [...current, ...parts].slice(-MAX_LINES))
    }
  }, [])

  const { status, error } = useStream(open, onChunk)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div
        dir="ltr"
        className="relative min-h-0 flex-1 rounded-lg border bg-muted/50 font-mono text-xs"
      >
        {lines.length === 0 ? (
          <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
            {status === "error" ? (
              <span className="text-destructive-foreground">{error}</span>
            ) : (
              <>
                <Spinner /> {t("Waiting for output…")}
              </>
            )}
          </div>
        ) : (
          <Virtuoso
            ref={list}
            data={lines}
            className="h-full"
            followOutput={follow ? "auto" : false}
            atBottomStateChange={setFollow}
            itemContent={(_, line) => <LogLine raw={line} />}
          />
        )}
        {!follow && lines.length > 0 && (
          <Button
            size="sm"
            className="absolute end-3 bottom-3"
            onClick={() => {
              setFollow(true)
              list.current?.scrollToIndex({ index: lines.length - 1 })
            }}
          >
            <IconArrowDown aria-hidden /> {t("Follow")}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status === "done"
          ? t("The container stopped.")
          : status === "error"
            ? error
            : t("Live, refreshed every second.")}
      </p>
    </div>
  )
}

export function LogsSheet({
  server,
  container,
  onOpenChange,
}: {
  server: string
  container: string | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <Sheet open={!!container} onOpenChange={onOpenChange}>
      {/* Same data-[side] variant as the base classes, so these override its max-w-sm. */}
      <SheetContent className="flex flex-col data-[side=right]:w-full data-[side=right]:sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle className="font-mono">{container}</SheetTitle>
          <SheetDescription>
            {t("Logs stay on the server; they are streamed only while open.")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          {container && (
            <LogLines key={container} server={server} container={container} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
