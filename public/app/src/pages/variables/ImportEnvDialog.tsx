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
import { Switch } from "@/components/ui/switch"
import { EnvEditor, type TEnvVariable } from "@/components/env-import"
import { errorMessage } from "@/lib/utils"
import type { TScope } from "./VariableDialog"

/** Imports a pasted, dropped or uploaded .env into one scope, in one request. */
export function ImportEnvDialog({
  scope,
  existing,
  open,
  onOpenChange,
  onImported,
}: {
  scope: TScope
  existing: Set<string>
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}) {
  const { t } = useTranslation()
  const [variables, setVariables] = React.useState<TEnvVariable[]>([])
  const [overwrite, setOverwrite] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const clashes = variables.filter((v) => existing.has(v.key)).length

  const close = (next: boolean) => {
    if (!next) {
      setVariables([])
      setOverwrite(false)
      setError(null)
    }
    onOpenChange(next)
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const { created, updated, skipped } =
        await ThunderSDK.variables.importEnv({
          body: { ...scope, variables, overwrite },
        })
      toast.success(
        [
          created.length && t("{{count}} added", { count: created.length }),
          updated.length && t("{{count}} replaced", { count: updated.length }),
          skipped.length &&
            t("{{count}} kept as they were", { count: skipped.length }),
        ]
          .filter(Boolean)
          .join(" · ")
      )
      onImported()
      close(false)
    } catch (e) {
      setError(errorMessage(e) ?? t("Could not import the variables"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-x-hidden overflow-y-auto sm:max-w-2xl [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle>{t("Import a .env file")}</DialogTitle>
          <DialogDescription>
            {t(
              "Drop a file, pick one, or paste its content. Values are encrypted when saved; names that look like credentials start as secrets."
            )}
          </DialogDescription>
        </DialogHeader>
        <EnvEditor
          value={variables}
          onChange={setVariables}
          existing={existing}
        />
        {!!clashes && (
          <Field orientation="horizontal">
            <Switch
              id="env-overwrite"
              checked={overwrite}
              onCheckedChange={setOverwrite}
            />
            <FieldLabel htmlFor="env-overwrite">
              {t("Replace the {{count}} that already exist", {
                count: clashes,
              })}
            </FieldLabel>
          </Field>
        )}
        {error && <FieldError>{error}</FieldError>}
        <DialogFooter>
          <Button onClick={submit} disabled={!variables.length || busy}>
            {busy
              ? t("Importing…")
              : t("Import {{count}} variables", { count: variables.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
