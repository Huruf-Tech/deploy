import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconCheck,
  IconCreditCard,
  IconReceipt,
} from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { Page } from "@/components/page"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useFresh } from "@/hooks/use-fresh"
import { cn, errorMessage } from "@/lib/utils"

type TOverview = Awaited<ReturnType<typeof ThunderSDK.billing.get>>
type TPlan = Awaited<ReturnType<typeof ThunderSDK.billing.plans>>[number]

const QUOTAS: { key: keyof TOverview["limits"]; label: string }[] = [
  { key: "servers", label: "Servers" },
  { key: "projects", label: "Projects" },
  { key: "members", label: "Members" },
  { key: "templates", label: "Templates" },
  { key: "alertRules", label: "Alert rules" },
  { key: "gitIntegrations", label: "GitHub connections" },
  { key: "registries", label: "Registries" },
]

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100)

const day = (d?: string | Date) => (d ? new Date(d).toLocaleDateString() : "—")

function Usage({ overview }: { overview: TOverview }) {
  const { t } = useTranslation()
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {QUOTAS.map(({ key, label }) => {
        const used = overview.usage[key] ?? 0
        const limit = overview.limits[key]
        const over = used > limit
        const pct = limit ? Math.min(100, (used / limit) * 100) : 100
        return (
          <li key={key} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span>{t(label)}</span>
              <span
                className={cn(
                  "tabular-nums",
                  over
                    ? "font-medium text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {used} / {limit}
              </span>
            </div>
            <div
              role="meter"
              aria-label={t(label)}
              aria-valuemin={0}
              aria-valuemax={limit}
              aria-valuenow={used}
              aria-valuetext={t("{{used}} of {{limit}}", { used, limit })}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  over
                    ? "bg-destructive"
                    : pct >= 80
                      ? "bg-amber-500"
                      : "bg-primary"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ConfirmDialog({
  plan,
  current,
  onOpenChange,
  onDone,
}: {
  plan: TPlan | null
  current: TOverview | undefined
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = React.useState(false)
  const wallet = current?.wallets.find(
    (w) => w.currency === plan?.price.currency
  )

  const confirm = async () => {
    if (!plan) return
    setBusy(true)
    try {
      const { result, at } = await ThunderSDK.billing.subscribe({
        body: { plan: plan._id },
      })
      toast.success(
        result === "scheduled"
          ? t("{{name}} starts on {{date}}", { name: plan.name, date: day(at) })
          : result === "resumed"
            ? t("Your plan renews again")
            : t("You're on {{name}} now", { name: plan.name })
      )
      onDone()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not change the plan"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!plan} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("Switch to {{name}}", { name: plan?.name })}
          </DialogTitle>
          <DialogDescription>
            {plan?.isFree
              ? t(
                  "Your current plan stays until its period ends, then the tenant moves to Free. Nothing is deleted; anything beyond Free's limits can't grow."
                )
              : t(
                  "Upgrades start now with a full period, paid from the tenant wallet; there's no proration for what's left of the current one. A cheaper plan starts when the current period ends."
                )}
          </DialogDescription>
        </DialogHeader>
        {plan && !plan.isFree && (
          <p className="text-sm">
            {t("{{price}} per {{interval}}. Wallet balance: {{balance}}.", {
              price: money(plan.price.amount, plan.price.currency),
              interval: t(plan.price.interval),
              balance: money(wallet?.balance ?? 0, plan.price.currency),
            })}
          </p>
        )}
        <DialogFooter>
          <Button onClick={confirm} disabled={busy}>
            {t("Confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Plan & usage (PLAN §22.6): quotas, the current period, plans and history. */
export default function BillingPage() {
  const { t } = useTranslation()
  const overviewRequest = ThunderSDK.useCaching(
    ["billing"],
    async ({ signal }) => await ThunderSDK.billing.get({ signal })
  )
  const plansRequest = ThunderSDK.useCaching(
    ["billing", "plans"],
    async ({ signal }) => await ThunderSDK.billing.plans({ signal })
  )
  const periodsRequest = ThunderSDK.useCaching(
    ["billing", "periods"],
    async ({ signal }) => await ThunderSDK.billing.periods({ signal })
  )
  // Invalidating "billing" refreshes the plans and periods too.
  useFresh(overviewRequest)
  const { data: overview } = use(overviewRequest)
  const { data: plans } = use(plansRequest)
  const { data: periods } = use(periodsRequest)
  const [choosing, setChoosing] = React.useState<TPlan | null>(null)

  const refresh = () => overviewRequest.invalidate()
  const cancel = async () => {
    if (
      !confirm(
        t("Cancel at the end of this period? The tenant then moves to Free.")
      )
    )
      return
    try {
      await ThunderSDK.billing.cancel()
      toast.success(t("Your plan ends with this period"))
      refresh()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not cancel"))
    }
  }

  const sub = overview?.subscription
  const overLimit = overview?.overLimitSince
  const throttleAt =
    overLimit &&
    new Date(new Date(overLimit).getTime() + overview.graceDays * 86_400_000)

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-xl font-semibold">{t("Plan & usage")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("What this tenant can use, and what it uses now.")}
        </p>
      </div>

      {sub?.status === "pastDue" && (
        <Alert variant="destructive">
          <IconAlertTriangle />
          <AlertTitle>{t("Your plan couldn't be renewed")}</AlertTitle>
          <AlertDescription>
            {t(
              "The tenant is on Free until the renewal goes through. We try again every hour; add funds to the wallet or pick a plan below."
            )}
            {sub.lastError && (
              <span className="block text-xs">{sub.lastError}</span>
            )}
          </AlertDescription>
        </Alert>
      )}
      {overLimit && (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <IconAlertTriangle className="text-amber-600" />
          <AlertTitle>{t("More servers than your plan allows")}</AlertTitle>
          <AlertDescription>
            {throttleAt && throttleAt > new Date()
              ? t(
                  "Everything keeps running. From {{date}}, the newest servers beyond the limit poll slowly and get no deploys until you upgrade or remove servers.",
                  { date: day(throttleAt) }
                )
              : t(
                  "The newest servers beyond the limit poll slowly and get no deploys. Upgrade, or remove servers, to restore them."
                )}
          </AlertDescription>
        </Alert>
      )}

      {!overview ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardDescription>{t("Current plan")}</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl">
                {overview.plan.name}
                {overview.period?.kind === "complimentary" && (
                  <Badge variant="secondary">{t("Complimentary")}</Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {overview.period
                  ? sub?.cancelAtPeriodEnd
                    ? t("Ends on {{date}}, then Free", {
                        date: day(overview.period.periodEnd),
                      })
                    : sub?.nextPlan
                      ? t("Changes on {{date}}", {
                          date: day(overview.period.periodEnd),
                        })
                      : overview.period.kind === "paid"
                        ? t("Renews on {{date}}", {
                            date: day(overview.period.periodEnd),
                          })
                        : t("Until {{date}}", {
                            date: day(overview.period.periodEnd),
                          })
                  : t("Every tenant starts here.")}
              </p>
            </div>
            {overview.isOwner &&
              sub?.status === "active" &&
              !sub.cancelAtPeriodEnd &&
              overview.period?.kind === "paid" && (
                <Button variant="outline" onClick={cancel}>
                  {t("Cancel plan")}
                </Button>
              )}
          </CardHeader>
          <CardContent>
            <Usage overview={overview} />
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="plans-title" className="flex flex-col gap-3">
        <h2 id="plans-title" className="text-base font-semibold">
          {t("Plans")}
        </h2>
        {overview && !overview.isOwner && (
          <p className="text-sm text-muted-foreground">
            {t("Only the tenant owner can change the plan.")}
          </p>
        )}
        {overview?.isOwner && !overview.paymentsReady && (
          <p className="text-sm text-muted-foreground">
            {t("Paid plans aren't available yet.")}
          </p>
        )}
        {!plans ? (
          <Skeleton className="h-40 rounded-3xl" />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent =
                plan._id === overview?.plan._id ||
                (plan.isFree && overview?.source === "free")
              return (
                <li key={plan._id}>
                  <Card
                    className={cn(
                      "h-full",
                      isCurrent && "border-primary ring-1 ring-primary"
                    )}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {plan.visibility === "private" && (
                          <Badge variant="outline">{t("For you")}</Badge>
                        )}
                      </CardTitle>
                      <p className="text-2xl font-semibold tabular-nums">
                        {plan.price.amount
                          ? money(plan.price.amount, plan.price.currency)
                          : t("Free")}
                        {!!plan.price.amount && (
                          <span className="text-sm font-normal text-muted-foreground">
                            {" "}
                            / {t(plan.price.interval)}
                          </span>
                        )}
                      </p>
                      {plan.description && (
                        <CardDescription>{plan.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ul className="flex flex-col gap-1 text-sm">
                        {QUOTAS.slice(0, 4).map(({ key, label }) => (
                          <li key={key} className="flex items-center gap-2">
                            <IconCheck
                              className="size-4 text-success"
                              aria-hidden
                            />
                            {plan.limits[key]} {t(label).toLowerCase()}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {isCurrent ? (
                        <Badge variant="secondary">{t("Current plan")}</Badge>
                      ) : (
                        overview?.isOwner &&
                        (plan.isFree || overview.paymentsReady) && (
                          <Button
                            variant={plan.isFree ? "outline" : "default"}
                            onClick={() => setChoosing(plan)}
                          >
                            <IconCreditCard data-icon="inline-start" />
                            {plan.isFree
                              ? t("Move to Free")
                              : t("Choose {{name}}", { name: plan.name })}
                          </Button>
                        )
                      )}
                    </CardFooter>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-title" className="flex flex-col gap-3">
        <h2
          id="history-title"
          className="flex items-center gap-2 text-base font-semibold"
        >
          <IconReceipt className="size-4" aria-hidden /> {t("Billing history")}
        </h2>
        {!periods?.length ? (
          <p className="text-sm text-muted-foreground">
            {t("No payments yet.")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Plan")}</TableHead>
                  <TableHead>{t("Period")}</TableHead>
                  <TableHead>{t("Amount")}</TableHead>
                  <TableHead>{t("Reference")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">
                      {p.planName ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {day(p.periodStart)} – {day(p.periodEnd)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {p.kind === "complimentary"
                        ? t("Complimentary")
                        : money(p.amount, p.currency)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.ledgerReference ?? p.note ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <ConfirmDialog
        plan={choosing}
        current={overview ?? undefined}
        onOpenChange={(o) => !o && setChoosing(null)}
        onDone={refresh}
      />
    </Page>
  )
}
