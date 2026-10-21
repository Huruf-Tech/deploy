import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const errorMessage = (error: unknown) => {
  const data = (error as { response?: { data?: unknown } }).response?.data
  return typeof data === "string" && data ? data : null
}

export function AcceptServerDialog({
  server,
  open,
  onOpenChange,
  onAccepted,
}: {
  server: { _id: string; name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccepted: () => void
}) {
  const { t } = useTranslation()
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)

    try {
      await ThunderSDK.servers.accept({
        params: { id: server._id },
        body: { pairingCode: code },
      })
      toast.success(t("Server accepted"))
      onOpenChange(false)
      onAccepted()
    } catch (e) {
      setError(errorMessage(e) ?? t("Could not accept the server"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {t("Accept {{name}}", { name: server.name })}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Enter the pairing code printed by the agent on that machine. Only accept servers you installed yourself."
              )}
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="pairing-code">{t("Pairing code")}</FieldLabel>
            <Input
              id="pairing-code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/\s/g, ""))
              }
              maxLength={6}
              autoComplete="off"
              autoFocus
              className="font-mono tracking-widest uppercase"
              aria-invalid={!!error}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>

          <DialogFooter>
            <Button type="submit" disabled={code.length !== 6 || busy}>
              {t("Accept")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
