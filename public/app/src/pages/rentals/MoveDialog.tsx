import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
 * Moves a rental to another machine (PLAN §26.10), after saying how long
 * it's offline: the copy goes straight between the two machines, or through
 * the tunnel server when they can't reach each other, encrypted with the
 * move's one-time key. `propose`: the machine's owner asks the customer
 * instead (PLAN §30.8), to their own machines or ones that accept at once.
 */
export function MoveDialog({
  rental,
  label,
  propose,
  onOpenChange,
  onDone,
}: {
  rental: string
  /** Who and what is moving, for the title. */
  label: string
  propose?: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const proposed = useCached(queries.hostingMoveTargets(propose ? rental : ""))
  const admin = useCached(queries.moveTargets(propose ? "" : rental))
  const info = propose ? proposed.data : admin.data
  const [host, setHost] = React.useState<string>()
  const [reason, setReason] = React.useState("")
  const pick = host ?? info?.targets.find(usable)?.server
  const [busy, setBusy] = React.useState(false)
  const move = async () => {
    if (!pick) return
    setBusy(true)
    try {
      if (propose) {
        await ThunderSDK.hosting.propose({
          params: { id: rental },
          body: {
            to: pick,
            ...(reason.trim() ? { reason: reason.trim() } : {}),
          },
        })
        toast.success(t("Proposed: the customer has 72 hours to answer"))
      } else {
        await ThunderSDK.rentalsAdmin.move({
          params: { id: rental },
          body: { to: pick },
        })
        toast.success(
          t("Moving: it's offline until it starts on the new machine")
        )
      }
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
          <DialogTitle>
            {propose
              ? t("Propose moving {{what}}", { what: label })
              : t("Move {{what}}", { what: label })}
          </DialogTitle>
          <DialogDescription>
            {!info
              ? t("Loading…")
              : propose
                ? t(
                    "The customer decides within 72 hours. If they agree, it moves (offline about {{minutes}} min), its term carries over and the new machine's price starts at their next renewal; you pay any gap this month.",
                    { minutes }
                  )
                : t(
                    "It's offline for about {{minutes}} min while its data is copied, encrypted, to the other machine: straight across when it can reach this one (TCP port 51830), else through Huruf's tunnel server, so no port has to be open. Its server, projects and domains stay the same.",
                    { minutes }
                  )}
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
              {propose
                ? t(
                    "None of your other machines, and no machine that accepts at once, has room for it."
                  )
                : t("No other machine for rent has room for it.")}
            </p>
          ))}
        {propose && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="move-reason">
              {t("Why (the customer sees it)")}
            </Label>
            <Input
              id="move-reason"
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
        <DialogFooter>
          <Button onClick={move} disabled={busy || !pick || info?.moving}>
            {propose ? t("Send the proposal") : t("Move")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
