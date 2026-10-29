import * as React from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CodeBlock } from "@/components/console/code-block"
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
  body: { dryRun: boolean; removeSysbox?: boolean }
) {
  const { command } = await ThunderSDK.servers.cleanup({
    params: { id: server },
    body: { removeSysbox: false, ...body },
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
 * Remove a machine (PLAN §27.4): the agent lists what uninstalling removes
 * (its partitions with their data, and what is ours by label and name) and
 * keeps (Docker and anything another tool may use); Sysbox is the one
 * choice. Then the agent uninstalls itself and the machine leaves the
 * dashboard with its partitions. Offline machines get the command to run.
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
  const [removeSysbox, setRemoveSysbox] = React.useState(false)

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
    // Off its page first: forgetting its cache while the page is open makes
    // its panels fetch the removed server again (404s).
    onOpenChange(false)
    navigate("..", { relative: "path" })
    // After React has left the page.
    setTimeout(() => {
      void ThunderSDK.forgetCache(["servers", server._id], { subKeys: true })
    })
  }

  const remove = async () => {
    setBusy(true)
    try {
      if (online && steps) {
        await cleanup(server._id, {
          dryRun: false,
          removeSysbox: !!chosen.sysbox,
        })
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

  const command = `sudo huruf-deploy-agent uninstall -yes${removeSysbox ? " -remove-sysbox" : ""}`
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
              "The agent uninstalls itself and removes its partitions with their projects and data. Docker and anything another tool may use stay."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto text-[13px]">
          {!online ? (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground">
                  {t(
                    "The machine is offline, so it can't clean up now. Run this over SSH (without -yes it only shows the plan):"
                  )}
                </p>
                <CodeBlock code={command} wrap lang="shell" />
              </div>
              <label className="flex items-start gap-2">
                <Checkbox
                  checked={removeSysbox}
                  onCheckedChange={(on) => setRemoveSysbox(!!on)}
                  className="mt-0.5"
                />
                <span>
                  {t("Also remove Sysbox")}
                  <span className="block text-xs text-muted-foreground">
                    {t("Only if no other tool on the machine uses it.")}
                  </span>
                </span>
              </label>
            </>
          ) : error ? (
            <p
              role="alert"
              className="rounded-lg bg-destructive-soft p-3 text-destructive-foreground"
            >
              {error}
            </p>
          ) : !steps ? (
            <p
              aria-live="polite"
              className="flex items-center gap-2 text-muted-foreground"
            >
              <IconLoader2 className="size-4 animate-spin" aria-hidden />
              {t("Asking the agent what it would remove…")}
            </p>
          ) : (
            <ul className="flex flex-col" aria-label={t("Plan")}>
              {steps.map((s) => (
                <li key={s.id}>
                  <label
                    className={
                      s.choice
                        ? "flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 hover:bg-muted/60"
                        : "flex items-start gap-2 rounded-md px-1.5 py-1"
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
