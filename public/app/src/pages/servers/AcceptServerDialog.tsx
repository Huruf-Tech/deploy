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
import { errorMessage } from "@/lib/utils"

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
      const accepted = (await ThunderSDK.servers.accept({
        params: { id: server._id },
        body: { pairingCode: code },
      })) as { server?: string; superseded?: number }
      // The code may belong to a newer registration of the same machine (it
      // was installed again): that one is accepted, the old entries go.
      toast.success(
        accepted.server && accepted.server !== server._id
          ? t("Server accepted: the code belongs to its newer installation")
          : t("Server accepted"),
        accepted.superseded
          ? {
              description: t(
                "{{n}} older registration(s) of this machine were removed.",
                { n: accepted.superseded }
              ),
            }
          : undefined
      )
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
