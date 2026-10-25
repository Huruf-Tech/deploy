import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import {
  IconChevronDown,
  IconChevronUp,
  IconTerminal2,
  IconX,
} from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Kbd } from "@/components/console/kbd"
import { StatusDot } from "@/components/console/status"
import { cn } from "@/lib/utils"

// xterm.js loads only when the shell first opens (PLAN §15.5).
const TerminalView = React.lazy(() =>
  import("@/pages/servers/TerminalSheet").then((m) => ({
    default: m.TerminalView,
  }))
)

export const canOpenShell = () =>
  ThunderSDK.isPermitted("streams", "openHostTerminal") &&
  ThunderSDK.isPermitted("projects", "placementInfo")

/**
 * The global shell (DESIGN §4): a bar at the bottom of every page that opens
 * a panel with a host terminal on whichever server you pick. Ctrl/⌘ + `
 * toggles it. The session ends when the panel closes or the server changes.
 */
export function ShellDock({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const [server, setServer] = React.useState<string | null>(null)
  const [tall, setTall] = React.useState(false)
  const mac = /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <section
      aria-label={t("Shell")}
      className="shrink-0 border-t bg-background"
    >
      <div className="flex h-9 items-center gap-2 px-2 md:px-3">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 rounded-md px-2 text-xs text-muted-foreground"
          aria-expanded={open}
          aria-keyshortcuts={mac ? "Meta+`" : "Control+`"}
          onClick={() => onOpenChange(!open)}
        >
          <IconTerminal2 aria-hidden />
          {t("Shell")}
          <Kbd className="max-sm:hidden">{mac ? "⌘`" : "Ctrl `"}</Kbd>
        </Button>
        {open && (
          <>
            <ServerPicker value={server} onChange={setServer} />
            <div className="ms-auto flex items-center gap-1">
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={tall ? t("Smaller") : t("Larger")}
                onClick={() => setTall((v) => !v)}
              >
                {tall ? <IconChevronDown /> : <IconChevronUp />}
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={t("Close the shell")}
                onClick={() => onOpenChange(false)}
              >
                <IconX />
              </Button>
            </div>
          </>
        )}
      </div>
      {open && (
        <div
          className={cn(
            "flex flex-col border-t px-2 pt-2 pb-2 md:px-3",
            tall ? "h-[70svh]" : "h-[min(40svh,360px)] min-h-56"
          )}
        >
          {!server ? (
            <p className="m-auto text-[13px] text-muted-foreground">
              {t("Pick a server to open a root shell on it.")}
            </p>
          ) : (
            <React.Suspense fallback={<Skeleton className="h-full" />}>
              <TerminalView key={server} server={server} container={null} />
            </React.Suspense>
          )}
        </div>
      )}
    </section>
  )
}

/** Online servers first; offline ones are listed but can't be picked. */
function ServerPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (server: string) => void
}) {
  const { t } = useTranslation()
  const request = ThunderSDK.useCaching(
    ["projects", "placement"],
    async ({ signal }) => await ThunderSDK.projects.placementInfo({ signal })
  )
  const servers = [...(use(request).data ?? [])].sort(
    (a, b) =>
      Number(b.online) - Number(a.online) || a.name.localeCompare(b.name)
  )

  return (
    <Select
      items={servers.map((s) => ({ value: s.server, label: s.name }))}
      value={value ?? ""}
      onValueChange={(v) => v && onChange(v)}
    >
      <SelectTrigger
        size="sm"
        className="w-48 rounded-md py-0 text-xs data-[size=sm]:h-7"
        aria-label={t("Server")}
      >
        <SelectValue placeholder={t("Select a server")} />
      </SelectTrigger>
      <SelectContent className="text-xs">
        {servers.map((s) => (
          <SelectItem key={s.server} value={s.server} disabled={!s.online}>
            <StatusDot state={s.online ? "online" : "offline"} />
            {s.name}
            {!s.online && (
              <span className="text-xs text-muted-foreground">
                {t("Offline")}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
