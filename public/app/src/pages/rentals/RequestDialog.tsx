import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/confirm-dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useCached } from "@/hooks/use-cached"
import { gbOfMb } from "@/lib/format"
import { money } from "@/lib/plans"
import { queries } from "@/lib/queries"
import { errorMessage } from "@/lib/utils"
import { confirmPayment } from "@/pages/billing/stripe"
import { freeSize, stepSize, type TMarketMachine } from "./rental"
import { COMMUNITY_CONSENT_VERSION, CommunityConsent } from "./CommunityConsent"

type TSize = { vcpu: number; memMb: number; diskGb: number }

const TERMS = [1, 3, 6, 12] as const

const stepped = (s: TSize): TSize => stepSize(s)

/**
 * Rent a machine from the market, or resize a rental on its machine
 * (PLAN §30.5): a size or the whole machine, priced live, and a committed
 * term. The first month goes into the wallet now (3-D Secure in the browser)
 * and is charged when the owner accepts.
 */
export function RequestDialog({
  open,
  onOpenChange,
  onDone,
  machine,
  resize,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
  /** Requesting: the market's machine. */
  machine?: TMarketMachine
  /** Resizing a rental: its machine and current size. */
  resize?: { rental: string; machine: string; size: TSize }
}) {
  const { t } = useTranslation()
  const machineId = machine?._id ?? resize!.machine
  const [whole, setWhole] = React.useState(false)
  const [size, setSize] = React.useState<TSize>(
    // Everything free, as the market's card prices it.
    resize?.size ??
      (machine ? freeSize(machine) : { vcpu: 1, memMb: 2048, diskGb: 25 })
  )
  const [term, setTerm] = React.useState<(typeof TERMS)[number]>(1)
  const [waived, setWaived] = React.useState(false)
  // A community machine (PLAN §30.4): its risks, accepted twice.
  const community = !!machine && !machine.official
  const [riskAccepted, setRiskAccepted] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const choice = whole ? { whole: "true" as const } : stepped(size)
  const quote = useCached(
    queries.marketQuote(
      resize
        ? { rental: resize.rental, ...choice }
        : { machine: machineId, ...choice }
    )
  ).data

  const submit = async () => {
    setBusy(true)
    try {
      if (resize) {
        await ThunderSDK.rentals.resize({
          params: { id: resize.rental },
          body: stepped(size),
        })
        toast.success(t("Resize requested: the machine's owner accepts it"))
      } else {
        const result = await ThunderSDK.rentals.request({
          body: {
            machine: machineId,
            ...(whole ? { whole: true } : stepped(size)),
            termMonths: term,
            waiveWithdrawal: waived,
            ...(community && riskAccepted
              ? { communityConsent: COMMUNITY_CONSENT_VERSION }
              : {}),
          },
        })
        if (result.result === "pending" && result.topup) {
          toast.info(t("Confirming the payment with your bank…"))
          await confirmPayment({
            topup: result.topup,
            clientSecret: result.clientSecret,
          })
        }
        toast.success(
          result.result === "active"
            ? t("Accepted: your server is being set up")
            : t("Request sent: the owner has 72 hours to accept it")
        )
      }
      onDone()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not send the request"))
    } finally {
      setBusy(false)
    }
  }

  const field = (
    key: keyof TSize,
    label: string,
    step: number,
    scale = 1,
    max?: number
  ) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`rent-${key}`}>{label}</Label>
      <Input
        id={`rent-${key}`}
        type="number"
        dir="ltr"
        min={step}
        max={max}
        step={step}
        value={size[key] / scale}
        onChange={(e) =>
          setSize({ ...size, [key]: Number(e.target.value) * scale })
        }
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {resize
              ? t("Resize this server")
              : t("Rent {{name}}", { name: machine?.name })}
          </DialogTitle>
          <DialogDescription>
            {resize
              ? t(
                  "A larger size starts once the owner accepts, charged for the rest of this month; a smaller one starts at your next renewal."
                )
              : t(
                  "You deploy to it like any server. The owner accepts within 72 hours, or at once when the machine accepts automatically."
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {machine?.dedicated && (
            <ToggleGroup
              value={whole ? "whole" : "part"}
              onValueChange={(v) => v && setWhole(v === "whole")}
              aria-label={t("Size")}
            >
              <ToggleGroupItem value="part">
                {t("A part of it")}
              </ToggleGroupItem>
              <ToggleGroupItem value="whole">
                {t("The whole machine")}
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          {!whole && (
            <div className="grid gap-3 sm:grid-cols-3">
              {field("vcpu", t("vCPU"), 0.25, 1, machine?.free.cpus)}
              {field(
                "memMb",
                t("Memory (GB)"),
                0.25,
                1024,
                machine ? gbOfMb(machine.free.memMb) : undefined
              )}
              {field("diskGb", t("Disk (GB)"), 1, 1, machine?.free.diskGb)}
              {machine && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto justify-self-start px-0 text-brand-text sm:col-span-3"
                  onClick={() => setSize(freeSize(machine))}
                >
                  {t("Use all available")}
                </Button>
              )}
            </div>
          )}

          {!resize && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="rent-term">
                {t("How long you plan to use it")}
              </Label>
              <Select
                items={TERMS.map((m) => ({
                  value: String(m),
                  label: t("{{count}} months", { count: m }),
                }))}
                value={String(term)}
                onValueChange={(v) =>
                  setTerm(Number(v) as (typeof TERMS)[number])
                }
              >
                <SelectTrigger id="rent-term" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {t("{{count}} months", { count: m })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t(
                  "The owner commits to keep the machine for this term. You can cancel any time: it runs to the end of the paid month. A paid month isn't refunded; downtime is, by the hour."
                )}
              </p>
            </div>
          )}

          <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-[13px]">
            <p className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{t("Per month")}</span>
              <span dir="ltr" className="text-base font-semibold tabular-nums">
                {quote ? money(quote.price, "usd") : "…"}
              </span>
            </p>
            {quote && !quote.fits && (
              <p className="mt-1 text-xs text-destructive-foreground">
                {t("The machine has no room for this size.")}
              </p>
            )}
            {quote && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t(
                  "Includes {{traffic}} GB of traffic a month; beyond it {{rate}} per GB. The price includes {{mb}} MB for the server's own system.",
                  {
                    traffic: quote.trafficGb,
                    rate: money(quote.trafficRatePerGb, "usd"),
                    mb: quote.overheadMb,
                  }
                )}
              </p>
            )}
            {!resize && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t(
                  "The first month goes into your wallet now and is charged when the owner accepts. Nothing is charged otherwise."
                )}
              </p>
            )}
          </div>

          {community && (
            <CommunityConsent
              checked={riskAccepted}
              onCheckedChange={setRiskAccepted}
            />
          )}

          {!resize && (
            <label className="flex items-start gap-2 text-[13px]">
              <Checkbox
                checked={waived}
                onCheckedChange={(on) => setWaived(!!on)}
                className="mt-0.5"
              />
              <span>
                {t("I understand that a paid month isn't refunded")}
                <span className="block text-xs text-muted-foreground">
                  {t(
                    "The server starts right away. Only downtime is refunded, by the hour. In the EU, this also gives up the 14-day right to cancel."
                  )}
                </span>
              </span>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => (community ? setConfirming(true) : submit())}
            disabled={
              busy ||
              !quote?.fits ||
              (!resize && !waived) ||
              (community && !riskAccepted)
            }
          >
            {resize ? t("Request resize") : t("Request server")}
          </Button>
        </DialogFooter>
      </DialogContent>
      {confirming && (
        <ConfirmDialog
          open
          onOpenChange={setConfirming}
          title={t("Rent a community server?")}
          description={t(
            "{{name}} belongs to {{owner}}, not Huruf. Its owner can access everything you put on it, and you're responsible for any leak or loss of that data.",
            {
              name: machine?.name,
              owner: machine?.owner ?? t("a community owner"),
            }
          )}
          confirmLabel={t("Rent it anyway")}
          onConfirm={submit}
        />
      )}
    </Dialog>
  )
}
