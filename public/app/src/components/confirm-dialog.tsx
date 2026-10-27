import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/**
 * Asks before a destructive action: title, what happens, the action button
 * (busy while it runs) and, with `reasonLabel`, an optional reason passed to
 * `onConfirm`. `onConfirm` closes the dialog when it worked and reports its
 * own errors.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  reasonLabel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description: React.ReactNode
  confirmLabel: React.ReactNode
  reasonLabel?: string
  onConfirm: (reason?: string) => unknown
}) {
  const id = React.useId()
  const [reason, setReason] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm(reason.trim() || undefined)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setReason("")
        onOpenChange(o)
      }}
    >
      <DialogContent role="alertdialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {reasonLabel && (
          <div className="flex flex-col gap-2">
            <Label htmlFor={id}>{reasonLabel}</Label>
            <Textarea
              id={id}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="destructive" disabled={busy} onClick={confirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
