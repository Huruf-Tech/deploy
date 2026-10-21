import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useStream, type TStreamChunk } from "@/hooks/use-stream"

const SEND_EVERY_MS = 50
const READ_EVERY_MS = 300

type TInput = { seq: number; data?: string; cols?: number; rows?: number }

/**
 * An interactive shell over polling (PLAN §3.6): keystrokes are batched every
 * 50 ms; output is read every 300 ms while the server polls at terminal pace.
 * Nothing typed or printed is stored beyond ~2 minutes.
 */
function TerminalView({
  server,
  container,
}: {
  server: string
  container: string | null
}) {
  const { t } = useTranslation()
  const host = React.useRef<HTMLDivElement>(null)
  const term = React.useRef<Terminal | null>(null)
  const session = React.useRef<string | null>(null)
  const pending = React.useRef<TInput[]>([])
  const seq = React.useRef(0)
  const [lineMode, setLineMode] = React.useState(false)
  const [line, setLine] = React.useState("")

  const queue = React.useCallback((input: Omit<TInput, "seq">) => {
    seq.current += 1
    pending.current.push({ seq: seq.current, ...input })
  }, [])

  // The terminal and its size are set up once; the stream starts from its size.
  const size = React.useRef({ cols: 80, rows: 24 })
  React.useLayoutEffect(() => {
    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 13,
      theme: { background: "#0b0b0c", foreground: "#e6e6e6" },
    })
    const fit = new FitAddon()
    terminal.loadAddon(fit)
    terminal.open(host.current!)
    fit.fit()
    size.current = { cols: terminal.cols, rows: terminal.rows }
    term.current = terminal

    const typing = terminal.onData((data) => queue({ data }))
    const observer = new ResizeObserver(() => {
      fit.fit()
      queue({ cols: terminal.cols, rows: terminal.rows })
    })
    observer.observe(host.current!)
    terminal.focus()

    return () => {
      typing.dispose()
      observer.disconnect()
      terminal.dispose()
    }
  }, [queue])

  const open = React.useCallback(async () => {
    const body = { server, ...size.current }
    const { session: id } = container
      ? await ThunderSDK.streams.openTerminal({ body: { ...body, container } })
      : await ThunderSDK.streams.openHostTerminal({ body })
    session.current = id
    return id
  }, [server, container])

  const onChunk = React.useCallback((chunk: TStreamChunk) => {
    if (chunk.data) term.current?.write(chunk.data)
  }, [])

  const { status, error } = useStream(open, onChunk, READ_EVERY_MS)

  // Batch keystrokes: one request per 50 ms at most, in order.
  React.useEffect(() => {
    let sending = false
    const timer = setInterval(() => {
      const id = session.current
      if (!id || sending || pending.current.length === 0) return
      const items = pending.current.splice(0, 64)
      sending = true
      ThunderSDK.streams
        .input({ params: { id }, body: { items } })
        .catch(() => pending.current.unshift(...items)) // retried; seq dedupes
        .finally(() => {
          sending = false
        })
    }, SEND_EVERY_MS)
    return () => clearInterval(timer)
  }, [])

  const submitLine = (event: React.FormEvent) => {
    event.preventDefault()
    queue({ data: line + "\r" })
    setLine("")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-[#0b0b0c] p-2">
        <div ref={host} className="h-full w-full" />
        {(status === "done" || status === "error") && (
          <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-xs text-white">
            {status === "error" ? error : t("Session ended.")}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Switch
            id="line-mode"
            checked={lineMode}
            onCheckedChange={setLineMode}
          />
          <Label htmlFor="line-mode" className="text-xs">
            {t(
              "Line mode: type here, send with Enter (instant, screen-reader friendly)"
            )}
          </Label>
        </div>
        {lineMode && (
          <form onSubmit={submitLine}>
            <Input
              value={line}
              onChange={(e) => setLine(e.target.value)}
              className="font-mono"
              placeholder={t("Command")}
              aria-label={t("Command")}
              autoFocus
            />
          </form>
        )}
      </div>
    </div>
  )
}

export default function TerminalSheet({
  server,
  container,
  open,
  onOpenChange,
}: {
  server: string
  container: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Same data-[side] variant as the base classes, so these override its max-w-sm. */}
      <SheetContent className="flex flex-col data-[side=right]:w-full data-[side=right]:sm:max-w-5xl">
        <SheetHeader>
          <SheetTitle className="font-mono">
            {container ?? t("Host shell")}
          </SheetTitle>
          <SheetDescription>
            {container
              ? t("A shell inside the container.")
              : t("A root shell on the server. Use with care.")}{" "}
            {t("Nothing you type or see is stored.")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          {open && (
            <TerminalView
              key={container ?? "host"}
              server={server}
              container={container}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
