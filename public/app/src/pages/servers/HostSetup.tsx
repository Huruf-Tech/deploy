import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Panel } from "@/components/console/panel"
import { CodeBlock } from "@/components/console/code-block"
import { errorMessage } from "@/lib/utils"
import type { TServer } from "./server"

/**
 * What host setup found and did (PLAN §16 Phase 2): failed checks with their
 * detail, notes such as settings waiting for a Docker restart, and a way to
 * run it again. The cards' "host warnings" badge links here.
 */
export function HostSetup({
  server,
  online,
  onChanged,
}: {
  server: TServer
  online: boolean
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = React.useState(false)
  const setup = server.setup
  const warnings = setup?.checks?.filter((c) => !c.ok) ?? []
  const passed = setup?.checks?.filter((c) => c.ok) ?? []
  const section = React.useRef<HTMLDivElement>(null)
  // Minutes host setup has been running, once it's unusually long (≥ 3).
  const startedAt = setup?.updatedAt ? new Date(setup.updatedAt).getTime() : 0
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])
  const minutes = startedAt ? Math.floor((now - startedAt) / 60_000) : 0
  const slow = minutes >= 3 ? minutes : 0

  // Opened from a card's "host warnings" badge: bring this section into view.
  React.useEffect(() => {
    if (window.location.hash === "#host-setup") {
      section.current?.scrollIntoView({ block: "start" })
    }
  }, [])

  const rerun = async () => {
    setBusy(true)
    try {
      await ThunderSDK.servers.prepare({ params: { id: server._id } })
      toast.success(t("Host setup is running again"))
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not start host setup"))
    } finally {
      setBusy(false)
    }
  }

  if (server.status !== "active") return null

  return (
    <Panel
      ref={section}
      id="host-setup"
      className="scroll-mt-4"
      title={t("Host setup")}
      description={
        !setup || setup.status === "pending"
          ? t("Preparing the host: Docker, its settings and the edge proxy…")
          : setup.status === "failed"
            ? t("Host setup failed.")
            : warnings.length
              ? warnings.length === 1
                ? t("Ready, with 1 warning to look at.")
                : t("Ready, with {{count}} warnings to look at.", {
                    count: warnings.length,
                  })
              : t("Ready.")
      }
      actions={
        <Button
          variant="outline"
          size="sm"
          disabled={!online || busy || setup?.status === "pending"}
          onClick={rerun}
        >
          {busy || setup?.status === "pending" ? (
            <IconLoader2 className="animate-spin" aria-hidden />
          ) : (
            <IconRefresh aria-hidden />
          )}
          {t("Run again")}
        </Button>
      }
      bodyClassName="flex flex-col gap-3 text-[13px]"
    >
      {setup?.status === "pending" && slow && (
        <div className="flex flex-col gap-2 rounded-lg bg-warning-soft px-3 py-2 text-warning-foreground">
          <p>
            {t(
              "Still running after {{n}} minutes. On the server, this shows what it's doing:",
              { n: slow }
            )}
          </p>
          <CodeBlock
            code="sudo journalctl -u huruf-deploy-agent -n 50 --no-pager"
            lang="shell"
            wrap
            className="bg-background text-foreground"
          />
        </div>
      )}
      {setup?.error && (
        <p className="rounded-lg bg-destructive-soft px-3 py-2 text-destructive-foreground">
          {setup.error}
        </p>
      )}
      {!!warnings.length && (
        <ul className="flex flex-col gap-2" aria-label={t("Warnings")}>
          {warnings.map((w) => (
            <li
              key={w.name}
              className="flex gap-2 rounded-lg bg-warning-soft px-3 py-2"
            >
              <IconAlertTriangle
                className="mt-0.5 size-4 shrink-0 text-warning-foreground"
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block font-medium">{w.name}</span>
                <span className="block break-words text-muted-foreground">
                  {w.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {!!setup?.notes?.length && (
        <ul className="flex flex-col gap-1.5" aria-label={t("Notes")}>
          {setup.notes.map((note) => (
            <li key={note} className="flex gap-2 text-muted-foreground">
              <IconInfoCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">{note}</span>
            </li>
          ))}
        </ul>
      )}
      {!!passed.length && (
        <details className="text-muted-foreground">
          <summary className="cursor-pointer">
            {passed.length === 1
              ? t("1 check passed")
              : t("{{count}} checks passed", { count: passed.length })}
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {passed.map((c) => (
              <li key={c.name} className="flex gap-2">
                <IconCircleCheck
                  className="mt-0.5 size-4 shrink-0 text-success-foreground"
                  aria-hidden
                />
                <span className="min-w-0 break-words">
                  {c.name}: {c.detail}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Panel>
  )
}
