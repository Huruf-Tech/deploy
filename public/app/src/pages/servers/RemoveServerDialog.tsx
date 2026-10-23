import * as React from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import { IconCircleCheck, IconLoader2, IconTrash } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CopyButton } from "@/components/ui/copy-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { errorMessage } from "@/lib/utils"
import type { TServer } from "./server"

type TStep = { item: string; remove: boolean; reason?: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Issues `host.cleanup` and waits for the agent's answer. */
async function cleanup(server: string, dryRun: boolean, purgeData: boolean) {
  const { command } = await ThunderSDK.servers.cleanup({
    params: { id: server },
    body: { dryRun, purgeData },
  })
  for (let i = 0; i < 60; i++) {
    await sleep(1_500)
    const outcome = await ThunderSDK.servers.command({
      params: { id: server, command },
    })
    if (outcome.status === "done")
      return ((outcome.result?.steps as TStep[] | undefined) ?? []) as TStep[]
    if (outcome.status === "failed")
      throw new Error(outcome.error ?? "The agent couldn't plan the cleanup")
  }
  throw new Error("The agent didn't answer in time")
}

/**
 * Remove server (PLAN §16): the agent shows what uninstalling removes and
 * keeps (other tools on the host, e.g. Dokploy, stay), then uninstalls itself
 * and the server leaves the dashboard. Offline servers get the command to run.
 */
export function RemoveServerDialog({
  server,
  online,
  open,
  onOpenChange,
}: {
  server: TServer
  online: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [purgeData, setPurgeData] = React.useState(false)
  const [steps, setSteps] = React.useState<TStep[] | null>(null)
  const [error, setError] = React.useState<string>()
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!open || !online) return
    let cancelled = false
    setSteps(null)
    setError(undefined)
    cleanup(server._id, true, purgeData)
      .then((s) => !cancelled && setSteps(s))
      .catch((e) => !cancelled && setError(errorMessage(e) ?? String(e)))
    return () => {
      cancelled = true
    }
  }, [open, online, server._id, purgeData])

  const forget = async () => {
    await ThunderSDK.servers.del({ params: { id: server._id } })
    onOpenChange(false)
    navigate("..", { relative: "path" })
  }

  const remove = async () => {
    setBusy(true)
    try {
      if (online) await cleanup(server._id, false, purgeData)
      await forget()
      toast.success(
        online
          ? t("Server removed. The agent uninstalls itself in a few seconds.")
          : t("Server removed from the dashboard")
      )
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not remove the server"))
    } finally {
      setBusy(false)
    }
  }

  const command = `sudo huruf-deploy-agent uninstall${purgeData ? " -purge-data" : ""}`
  const removed = steps?.filter((s) => s.remove) ?? []
  const kept = steps?.filter((s) => !s.remove) ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t("Remove {{name}}", { name: server.name })}
          </DialogTitle>
          <DialogDescription>
            {t(
              "The agent uninstalls itself and everything it created. Anything else on the server stays, Docker included."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto text-sm">
          {!online ? (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">
                {t(
                  "The server is offline, so it can't clean up now. Over SSH, this shows what would go; add -yes to remove it:"
                )}
              </p>
              <div className="flex items-center gap-2 rounded-xl bg-muted p-3 font-mono text-xs">
                <span className="min-w-0 flex-1 break-all">{command}</span>
                <CopyButton value={command} />
              </div>
            </div>
          ) : error ? (
            <p className="rounded-xl bg-destructive/10 p-3 text-destructive">
              {error}
            </p>
          ) : !steps ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" aria-hidden />
              {t("Asking the agent what it would remove…")}
            </p>
          ) : (
            <>
              <section aria-label={t("Will be removed")}>
                <h3 className="mb-1.5 font-medium">{t("Will be removed")}</h3>
                <ul className="flex flex-col gap-1">
                  {removed.map((s) => (
                    <li key={s.item} className="flex gap-2">
                      <IconTrash
                        className="mt-0.5 size-4 shrink-0 text-destructive"
                        aria-hidden
                      />
                      <span className="min-w-0 break-words">{s.item}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-label={t("Will be kept")}>
                <h3 className="mb-1.5 font-medium">{t("Will be kept")}</h3>
                <ul className="flex flex-col gap-1.5">
                  {kept.map((s) => (
                    <li key={s.item} className="flex gap-2">
                      <IconCircleCheck
                        className="mt-0.5 size-4 shrink-0 text-success"
                        aria-hidden
                      />
                      <span className="min-w-0 break-words">
                        {s.item}
                        {s.reason && (
                          <span className="block text-xs text-muted-foreground">
                            {s.reason}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          <label className="flex items-start gap-2">
            <Checkbox
              checked={purgeData}
              onCheckedChange={(on) => setPurgeData(!!on)}
              className="mt-0.5"
            />
            <span>
              {t("Also delete project data volumes")}
              <span className="block text-xs text-muted-foreground">
                {t(
                  "Databases and uploads stored on this server. This can't be undone."
                )}
              </span>
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2">
          {online && (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() =>
                forget().catch((e) =>
                  toast.error(
                    errorMessage(e) ?? t("Could not remove the server")
                  )
                )
              }
            >
              {t("Remove from dashboard only")}
            </Button>
          )}
          <Button
            variant="destructive"
            disabled={busy || (online && !steps)}
            onClick={remove}
          >
            {busy && <IconLoader2 className="animate-spin" aria-hidden />}
            {online ? t("Uninstall and remove") : t("Remove from dashboard")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
