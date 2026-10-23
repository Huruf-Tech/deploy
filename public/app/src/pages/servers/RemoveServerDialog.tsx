import * as React from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
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

/** One line of the agent's plan (agent/internal/cleanup). */
type TStep = {
  id: string
  item: string
  remove: boolean
  reason?: string
  required?: boolean
  choice: boolean
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Issues `host.cleanup` and waits for the agent's answer. */
async function cleanup(
  server: string,
  body: { dryRun: boolean; keep?: string[]; remove?: string[] }
) {
  const { command } = await ThunderSDK.servers.cleanup({
    params: { id: server },
    body: { purgeData: false, ...body },
  })
  for (let i = 0; i < 60; i++) {
    await sleep(1_500)
    const outcome = await ThunderSDK.servers.command({
      params: { id: server, command },
    })
    if (outcome.status === "done")
      return (outcome.result?.steps as TStep[] | undefined) ?? []
    if (outcome.status === "failed")
      throw new Error(outcome.error ?? "The agent couldn't plan the cleanup")
  }
  throw new Error("The agent didn't answer in time")
}

/**
 * Remove server (PLAN §16): the agent plans what uninstalling removes and
 * keeps (other tools on the host, e.g. Dokploy, stay); checked items are
 * removed and the admin can change any optional one. Then the agent
 * uninstalls itself and the server leaves the dashboard. Offline servers get
 * the command to run.
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
  const [steps, setSteps] = React.useState<TStep[] | null>(null)
  const [chosen, setChosen] = React.useState<Record<string, boolean>>({})
  const [error, setError] = React.useState<string>()
  const [busy, setBusy] = React.useState(false)
  const [purgeData, setPurgeData] = React.useState(false)

  React.useEffect(() => {
    if (!open || !online) return
    let cancelled = false
    cleanup(server._id, { dryRun: true })
      .then((plan) => {
        if (cancelled) return
        setSteps(plan)
        setChosen(Object.fromEntries(plan.map((s) => [s.id, s.remove])))
      })
      .catch((e) => !cancelled && setError(errorMessage(e) ?? String(e)))
    return () => {
      cancelled = true
    }
  }, [open, online, server._id])

  const forget = async () => {
    await ThunderSDK.servers.del({ params: { id: server._id } })
    onOpenChange(false)
    navigate("..", { relative: "path" })
  }

  const remove = async () => {
    setBusy(true)
    try {
      if (online && steps) {
        // Only what differs from the plan travels.
        const keep = steps
          .filter((s) => s.remove && !chosen[s.id])
          .map((s) => s.id)
        const extra = steps
          .filter((s) => !s.remove && chosen[s.id])
          .map((s) => s.id)
        await cleanup(server._id, { dryRun: false, keep, remove: extra })
      }
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

  const command = `sudo huruf-deploy-agent uninstall${purgeData ? " -remove data-volumes" : ""}`
  const count = steps?.filter((s) => chosen[s.id]).length ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t("Remove {{name}}", { name: server.name })}
          </DialogTitle>
          <DialogDescription>
            {t(
              "The agent uninstalls itself and what it created. Checked items are removed; unchecked ones stay. Anything else on the server stays, Docker included."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto text-sm">
          {!online ? (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground">
                  {t(
                    "The server is offline, so it can't clean up now. Over SSH, this shows the plan; add -yes to remove, and -keep / -remove with the ids it prints to change it:"
                  )}
                </p>
                <div className="flex items-center gap-2 rounded-xl bg-muted p-3 font-mono text-xs">
                  <span className="min-w-0 flex-1 break-all">{command}</span>
                  <CopyButton value={command} />
                </div>
              </div>
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
            </>
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
            <ul className="flex flex-col gap-1" aria-label={t("Plan")}>
              {steps.map((s) => (
                <li key={s.id}>
                  <label
                    className={
                      s.choice
                        ? "flex cursor-pointer items-start gap-2 rounded-lg p-1.5 hover:bg-muted/60"
                        : "flex items-start gap-2 rounded-lg p-1.5"
                    }
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={!!chosen[s.id]}
                      disabled={!s.choice}
                      onCheckedChange={(on) =>
                        setChosen({ ...chosen, [s.id]: !!on })
                      }
                    />
                    <span className="min-w-0 flex-1 break-words">
                      {s.item}
                      {s.required && (
                        <Badge variant="outline" className="ms-2 align-middle">
                          {t("Required")}
                        </Badge>
                      )}
                      {chosen[s.id] !== s.remove && (
                        <Badge
                          variant="secondary"
                          className="ms-2 align-middle"
                        >
                          {t("Changed")}
                        </Badge>
                      )}
                      {s.reason && (
                        <span className="block text-xs text-muted-foreground">
                          {s.reason}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
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
            {online
              ? t("Uninstall and remove ({{count}})", { count })
              : t("Remove from dashboard")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
