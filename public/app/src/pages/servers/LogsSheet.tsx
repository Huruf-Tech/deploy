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

/** The browser keeps at most this many lines (PLAN §20.4). */
const MAX_LINES = 10_000

// ponytail: colours are stripped; a small ANSI parser can render them later (PLAN §15.3).
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]/g

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
      <div className="relative min-h-0 flex-1 rounded-2xl bg-muted/50 font-mono text-xs">
        {lines.length === 0 ? (
          <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
            {status === "error" ? (
              <span className="text-destructive">{error}</span>
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
            itemContent={(_, line) => (
              <div className="px-3 py-0.5 break-all whitespace-pre-wrap">
                {line}
              </div>
            )}
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
      <SheetContent className="flex w-full flex-col sm:max-w-3xl">
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
