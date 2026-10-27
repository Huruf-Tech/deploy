import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import { IconCheck } from "@tabler/icons-react"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { money } from "@/lib/plans"
import { cn, errorMessage } from "@/lib/utils"
import { confirmPayment } from "@/pages/billing/stripe"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"
import { gbOfMb } from "@/lib/format"

type TResources = { vcpu: number; memMb: number; diskGb: number }

const steps = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) =>
    Number((from + i * step).toFixed(2))
  )

const describe = (
  t: (key: string, options?: Record<string, unknown>) => string,
  r: TResources & { trafficGb?: number }
) =>
  t("{{vcpu}} vCPU · {{mem}} GB · {{disk}} GB disk", {
    vcpu: r.vcpu,
    mem: gbOfMb(r.memMb),
    disk: r.diskGb,
  }) +
  (r.trafficGb !== undefined
    ? " · " + t("{{traffic}} GB traffic", { traffic: r.trafficGb })
    : "")

/**
 * Rent a server, or resize one (PLAN §26.6): a class, then a size or a custom
 * amount priced live. Requests wait for Huruf to set them up; the first month
 * goes into the wallet now (3-D Secure in the browser) and is charged then.
 */
export function RentDialog({
  open,
  onOpenChange,
  onDone,
  resize,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
  /** Resizing a rental: its class is fixed, its current plan isn't offered. */
  resize?: { rental: string; class: string; plan?: string }
}) {
  const { t } = useTranslation()
  const catalog = useCached(queries.catalog()).data
  const classes = catalog?.classes ?? []
  const [cls, setCls] = React.useState<string>()
  const current = resize?.class ?? cls ?? classes[0]?._id
  const klass = classes.find((c) => c._id === current)
  const sizes = (catalog?.sizes ?? []).filter(
    (s) => s.class === current && s._id !== resize?.plan
  )
  const [choice, setChoice] = React.useState<string>()
  const picked = choice ?? sizes[0]?._id ?? "custom"
  const [custom, setCustom] = React.useState<TResources>({
    vcpu: 1,
    memMb: 2048,
    diskGb: 25,
  })
  const [busy, setBusy] = React.useState(false)

  const quote = useCached(
    queries.rentalQuote(
      current && picked === "custom" ? { class: current, ...custom } : undefined
    )
  ).data
  const size = sizes.find((s) => s._id === picked)
  const price = size ? size.price.amount : quote?.price
  const traffic = size ? size.resources.trafficGb : quote?.trafficGb

  const submit = async () => {
    if (!current) return
    const body =
      picked === "custom"
        ? { custom: { class: current, ...custom } }
        : { plan: picked }
    setBusy(true)
    try {
      if (resize) {
        await ThunderSDK.rentals.resize({ params: { id: resize.rental }, body })
        toast.success(t("Resize requested: Huruf applies it once approved"))
      } else {
        const result = await ThunderSDK.rentals.request({ body })
        if (result.result === "pending" && result.topup) {
          toast.info(t("Confirming the payment with your bank…"))
          await confirmPayment({
            topup: result.topup,
            clientSecret: result.clientSecret,
          })
        }
        toast.success(t("Request sent: Huruf sets your server up soon"))
      }
      onDone()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not send the request"))
    } finally {
      setBusy(false)
    }
  }

  const max = klass?.maxPerRental

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {resize ? t("Resize this server") : t("Rent a server")}
          </DialogTitle>
          <DialogDescription>
            {resize
              ? t(
                  "A larger size starts once approved, charged for the rest of this month; a smaller one starts at your next renewal."
                )
              : t(
                  "Huruf runs it for you on its own machines; you deploy to it like any server. An admin sets it up, usually within a day."
                )}
          </DialogDescription>
        </DialogHeader>

        {!classes.length ? (
          <p className="text-sm text-muted-foreground">
            {catalog
              ? t("No servers are available to rent right now.")
              : t("Loading…")}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {!resize && classes.length > 1 && (
              <div className="flex flex-col gap-2">
                <Label>{t("Kind")}</Label>
                <ToggleGroup
                  value={current ?? ""}
                  onValueChange={(v) => {
                    if (!v) return
                    setCls(v as string)
                    setChoice(undefined)
                  }}
                  aria-label={t("Kind")}
                >
                  {classes.map((c) => (
                    <ToggleGroupItem key={c._id} value={c._id}>
                      {c.name}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {klass?.description && (
                  <p className="text-xs text-muted-foreground">
                    {klass.description}
                  </p>
                )}
              </div>
            )}

            <div
              role="radiogroup"
              aria-label={t("Size")}
              className="grid gap-2 sm:grid-cols-2"
            >
              {[
                ...sizes.map((s) => ({
                  id: s._id,
                  name: s.name,
                  detail: describe(t, s.resources),
                  price: s.price.amount,
                })),
                {
                  id: "custom",
                  name: t("Custom"),
                  detail: t("Choose the amounts"),
                  price: undefined,
                },
              ].map((option) => {
                const checked = picked === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setChoice(option.id)}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-start text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      checked && "border-primary bg-primary/5"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-medium">
                        {checked && (
                          <IconCheck
                            className="size-3.5 text-brand-text"
                            aria-hidden
                          />
                        )}
                        {option.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.detail}
                      </span>
                    </span>
                    {option.price !== undefined && (
                      <span
                        dir="ltr"
                        className="shrink-0 font-medium tabular-nums"
                      >
                        {money(option.price, "usd")}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {picked === "custom" && max && (
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    [
                      "vcpu",
                      t("vCPU"),
                      steps(0.5, max.vcpu, 0.5),
                      (v: number) => String(v),
                    ],
                    [
                      "memMb",
                      t("Memory"),
                      steps(512, max.memMb, 512),
                      (v: number) => `${gbOfMb(v)} GB`,
                    ],
                    [
                      "diskGb",
                      t("Disk"),
                      steps(5, max.diskGb, 5),
                      (v: number) => `${v} GB`,
                    ],
                  ] as const
                ).map(([key, label, options, show]) => (
                  <div key={key} className="flex flex-col gap-2">
                    <Label htmlFor={`rent-${key}`}>{label}</Label>
                    <Select
                      items={options.map((v) => ({
                        value: String(v),
                        label: show(v),
                      }))}
                      value={String(custom[key])}
                      onValueChange={(v) =>
                        setCustom({ ...custom, [key]: Number(v) })
                      }
                    >
                      <SelectTrigger id={`rent-${key}`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((v) => (
                          <SelectItem key={v} value={String(v)}>
                            {show(v)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-[13px]">
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{t("Per month")}</span>
                <span
                  dir="ltr"
                  className="text-base font-semibold tabular-nums"
                >
                  {price === undefined ? "…" : money(price, "usd")}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {klass &&
                  t(
                    "Includes {{traffic}} GB of traffic a month; beyond it {{rate}} per GB, charged with the next month.",
                    {
                      traffic: traffic ?? "…",
                      rate: money(klass.rates.trafficGb, "usd"),
                    }
                  )}{" "}
                {t(
                  "The price includes {{mb}} MB for the server's own system.",
                  { mb: catalog?.overheadMb }
                )}
              </p>
              {!resize && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(
                    "The first month goes into your wallet now and is charged when the server is ready. Nothing is charged if it isn't approved."
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={submit}
            disabled={busy || !classes.length || price === undefined}
          >
            {resize ? t("Request resize") : t("Request server")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
