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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { errorMessage } from "@/lib/utils"

export type TScope = "global" | "tenant"
export type TVariable = Awaited<
  ReturnType<typeof ThunderSDK.variables.list>
>[number]

type TKind = TVariable["kind"]
type TStage = TVariable["stage"]

/** Create (no `variable`) or edit one. Secrets are never prefilled: an empty value keeps it. */
export function VariableDialog({
  scope,
  variable,
  open,
  onOpenChange,
  onSaved,
}: {
  scope: TScope
  variable?: TVariable
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [key, setKey] = React.useState("")
  const [value, setValue] = React.useState("")
  const [isSecret, setSecret] = React.useState(false)
  const [kind, setKind] = React.useState<TKind>("env")
  const [stage, setStage] = React.useState<TStage>("runtime")
  const [description, setDescription] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setKey(variable?.key ?? "")
    setValue(variable?.value ?? "")
    setSecret(variable?.isSecret ?? false)
    setKind(variable?.kind ?? "env")
    setStage(variable?.stage ?? "runtime")
    setDescription(variable?.description ?? "")
    setError(null)
  }, [open, variable])

  const keepsSecret = !!variable?.isSecret && value === ""

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const settings = { isSecret, kind, stage, description }
    try {
      if (variable) {
        await ThunderSDK.variables.update({
          params: { id: variable._id },
          body: { scope, ...settings, ...(keepsSecret ? {} : { value }) },
        })
      } else {
        await ThunderSDK.variables.create({
          body: { scope, key, value, ...settings },
        })
      }
      toast.success(variable ? t("Variable saved") : t("Variable added"))
      onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(errorMessage(e) ?? t("Could not save the variable"))
    } finally {
      setBusy(false)
    }
  }

  const kinds: { value: TKind; label: string }[] = [
    { value: "env", label: t("Environment variable") },
    { value: "file", label: t("File in /run/secrets") },
  ]
  const stages: { value: TStage; label: string }[] = [
    { value: "runtime", label: t("Runtime") },
    { value: "build", label: t("Build") },
    { value: "both", label: t("Build and runtime") },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {variable
                ? t("Edit {{key}}", { key: variable.key })
                : t("Add variable")}
            </DialogTitle>
            <DialogDescription>
              {t("Values are encrypted before they are stored.")}{" "}
              {/* Passed as values: i18next would read the braces as placeholders. */}
              {t("Reference other variables with {{local}} or {{global}}.", {
                local: "${{KEY}}",
                global: "${{global.KEY}}",
                interpolation: { escapeValue: false },
              })}
            </DialogDescription>
          </DialogHeader>

          {!variable && (
            <Field>
              <FieldLabel htmlFor="variable-key">{t("Key")}</FieldLabel>
              <Input
                id="variable-key"
                value={key}
                onChange={(e) => setKey(e.target.value.replace(/\s/g, "_"))}
                placeholder="DATABASE_URL"
                autoComplete="off"
                autoFocus
                required
                className="font-mono"
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="variable-value">{t("Value")}</FieldLabel>
            <Textarea
              id="variable-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={kind === "file" ? 8 : 3}
              autoComplete="off"
              spellCheck={false}
              placeholder={
                variable?.isSecret
                  ? t("Leave empty to keep the current value")
                  : ""
              }
              autoFocus={!!variable}
              className="font-mono text-xs"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>{t("Type")}</FieldLabel>
              <Select
                items={kinds}
                value={kind}
                onValueChange={(v) => v && setKind(v as TKind)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kinds.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>{t("Available at")}</FieldLabel>
              <Select
                items={stages}
                value={stage}
                onValueChange={(v) => v && setStage(v as TStage)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="variable-secret">{t("Secret")}</FieldLabel>
              <FieldDescription>
                {t("Hidden in lists; shown only when you reveal it.")}
              </FieldDescription>
            </FieldContent>
            <Switch
              id="variable-secret"
              checked={isSecret}
              onCheckedChange={setSecret}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="variable-description">
              {t("Description")}
            </FieldLabel>
            <Input
              id="variable-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder={t("Optional")}
            />
          </Field>

          {error && <FieldError>{error}</FieldError>}

          <DialogFooter>
            <Button type="submit" disabled={busy || (!variable && !key)}>
              {variable ? t("Save") : t("Add variable")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
