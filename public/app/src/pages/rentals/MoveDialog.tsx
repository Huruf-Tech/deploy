import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

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
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

/**
 * Moves a rental to another machine of its class (PLAN §26.10), after
 * saying how long it's offline: the copy goes straight between the two
 * machines, encrypted with the move's one-time key.
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
  const info = useCached(queries.moveTargets(rental)).data
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
                  "It's offline for about {{minutes}} min while its data is copied, encrypted, straight to the other machine (TCP port 51830 must be open on both). Its server, projects and domains stay the same.",
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
                "No other machine of this class takes rentals. Give a machine this class on its page, or let one take rentals again."
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
