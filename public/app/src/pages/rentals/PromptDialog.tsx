import * as React from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toCents, toDollars } from "@/lib/format"

/**
 * Asks for a text (a reason, a dispute, a report) and, with `amount`, a sum
 * in dollars up to its `max` cents. `onSubmit` gets the text and the cents;
 * the dialog closes when it resolves.
 */
export function PromptDialog({
  title,
  description,
  textLabel,
  minLength = 1,
  required = true,
  amount,
  submitLabel,
  destructive,
  onOpenChange,
  onSubmit,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  textLabel: string
  minLength?: number
  required?: boolean
  amount?: { label: string; max: number; initial?: number }
  submitLabel: React.ReactNode
  destructive?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (text: string, cents: number) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const id = React.useId()
  const [text, setText] = React.useState("")
  const [dollars, setDollars] = React.useState(
    amount ? String(toDollars(amount.initial ?? amount.max)) : ""
  )
  const [busy, setBusy] = React.useState(false)
  const cents = amount ? toCents(dollars) : 0
  const badAmount = !!amount && !(cents >= 0 && cents <= amount.max)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      await onSubmit(text.trim(), cents)
      onOpenChange(false)
    } catch {
      // The caller tells what went wrong; the dialog stays open.
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          {amount && (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-amount`}>{amount.label}</Label>
              <Input
                id={`${id}-amount`}
                type="number"
                dir="ltr"
                min={0}
                max={toDollars(amount.max)}
                step="0.01"
                value={dollars}
                aria-invalid={badAmount}
                onChange={(e) => setDollars(e.target.value)}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-text`}>{textLabel}</Label>
            <Textarea
              id={`${id}-text`}
              required={required}
              minLength={required ? minLength : undefined}
              maxLength={2_000}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {required && minLength > 1 && (
              <p className="text-xs text-muted-foreground">
                {t("At least {{count}} characters", { count: minLength })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              disabled={busy || badAmount}
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
