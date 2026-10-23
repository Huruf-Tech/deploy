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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <Card ref={section} id="host-setup" className="scroll-mt-4">
      <CardHeader>
        <CardTitle className="text-base">{t("Host setup")}</CardTitle>
        <CardDescription>
          {!setup || setup.status === "pending"
            ? t("Preparing the host: Docker, its settings and the edge proxy…")
            : setup.status === "failed"
              ? t("Host setup failed.")
              : warnings.length
                ? warnings.length === 1
                  ? t("Ready, with 1 warning to look at.")
                  : t("Ready, with {{count}} warnings to look at.", {
                      count: warnings.length,
                    })
                : t("Ready.")}
        </CardDescription>
        <CardAction>
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
            {t("Run setup again")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {setup?.error && (
          <p className="rounded-xl bg-destructive/10 p-3 text-destructive">
            {setup.error}
          </p>
        )}
        {!!warnings.length && (
          <ul className="flex flex-col gap-2" aria-label={t("Warnings")}>
            {warnings.map((w) => (
              <li
                key={w.name}
                className="flex gap-2 rounded-xl bg-warning/10 p-3"
              >
                <IconAlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-warning"
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
                <IconInfoCircle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
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
                    className="mt-0.5 size-4 shrink-0 text-success"
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
      </CardContent>
    </Card>
  )
}
