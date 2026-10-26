import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

import { use } from "@/core/hooks/use"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { errorMessage } from "@/lib/utils"
import { MachinePicker } from "./MachinePicker"
import { usable } from "./rental"

/**
 * Moves a rental to another pool machine of its class (PLAN §26.10), after
 * saying how long it's offline: the copy runs over the private network.
 */
export function MoveDialog({
  rental,
  label,
  onOpenChange,
  onDone,
}: {
  rental: string
  /** Who and what is moving, for the title. */
  label: string
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const info = use(
    ThunderSDK.useCaching(
      ["rentalsAdmin", "move", rental],
      async ({ signal }) =>
        await ThunderSDK.rentalsAdmin.moveTargets({
          params: { id: rental },
          signal,
        })
    )
  ).data
  const [host, setHost] = React.useState<string>()
  const pick = host ?? info?.targets.find(usable)?.server
  const [busy, setBusy] = React.useState(false)
  const move = async () => {
    if (!pick) return
    setBusy(true)
    try {
      await ThunderSDK.rentalsAdmin.move({
        params: { id: rental },
        body: { to: pick },
      })
      toast.success(
        t("Moving: it's offline until it starts on the new machine")
      )
      onDone()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not move it"))
    } finally {
      setBusy(false)
    }
  }
  const minutes = info ? Math.max(1, Math.round(info.downtimeSec / 60)) : 0
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Move {{what}}", { what: label })}</DialogTitle>
          <DialogDescription>
            {info
              ? t(
                  "It's offline for about {{minutes}} min while its data is copied to the other machine. Its server, projects and domains stay the same.",
                  { minutes }
                )
              : t("Loading…")}
          </DialogDescription>
        </DialogHeader>
        {info &&
          (info.targets.length ? (
            <MachinePicker
              machines={info.targets}
              pick={pick}
              onPick={setHost}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t(
                "No other pool machine of this class takes rentals. Add one, or let one take rentals again."
              )}
            </p>
          ))}
        <DialogFooter>
          <Button onClick={move} disabled={busy || !pick || info?.moving}>
            {t("Move")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
