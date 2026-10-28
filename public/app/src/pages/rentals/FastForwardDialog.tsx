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
import { day } from "@/lib/format"
import { errorMessage } from "@/lib/utils"

const DAY_MS = 86_400_000

/**
 * A testing tool for admins: a rental as if days had passed (renewal,
 * maturing, the earnings hold), with real money moving as it would. The
 * server refuses it unless ADMIN_FAST_FORWARD is set.
 */
export function FastForwardDialog({
  rental,
  label,
  periodEnd,
  onOpenChange,
  onDone,
}: {
  rental: string
  label: string
  /** The paid period's end, for "to the end of this month". */
  periodEnd?: string | Date
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [now] = React.useState(() => Date.now())
  const toPeriodEnd = periodEnd
    ? Math.max(1, Math.ceil((new Date(periodEnd).getTime() - now) / DAY_MS))
    : undefined
  const [days, setDays] = React.useState(String(toPeriodEnd ?? 30))
  const [busy, setBusy] = React.useState(false)
  const n = Number(days)
  const valid = Number.isInteger(n) && n >= 1 && n <= 400

  const go = async () => {
    setBusy(true)
    try {
      const after = await ThunderSDK.rentalsAdmin.fastForwardSubscription({
        params: { id: rental },
        body: { days: n },
      })
      toast.success(
        t("{{days}} days later: {{status}}, paid until {{date}}", {
          days: n,
          status: t(after.status),
          date: day(after.currentPeriodEnd),
        })
      )
      onDone()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not fast-forward it"))
    } finally {
      setBusy(false)
    }
  }

  const presets: [string, number][] = [
    ...(toPeriodEnd
      ? [[t("To the end of this month"), toPeriodEnd] as [string, number]]
      : []),
    [t("+14 days (the earnings hold)"), 15],
    [t("+30 days"), 30],
  ]

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("Fast-forward {{what}}", { what: label })}
          </DialogTitle>
          <DialogDescription>
            {t(
              "For testing: its dates move into the past, then what would happen runs: the renewal when due (the customer is charged), the month maturing (downtime refunded, the owner's share held), held earnings released. Real money moves."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {presets.map(([text, value]) => (
            <Button
              key={text}
              size="sm"
              variant={n === value ? "secondary" : "outline"}
              onClick={() => setDays(String(value))}
            >
              {text}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ff-days">{t("Days")}</Label>
          <Input
            id="ff-days"
            type="number"
            inputMode="numeric"
            dir="ltr"
            min={1}
            max={400}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={go} disabled={busy || !valid}>
            {t("Fast-forward {{count}} days", { count: valid ? n : 0 })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
