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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Meter } from "@/components/console/meter"
import { StatusBadge } from "@/components/console/status"
import { DataTable } from "@/components/console/data-table"
import { useFresh } from "@/hooks/use-fresh"
import { cn, errorMessage } from "@/lib/utils"
import { isUnlimited, money } from "@/lib/plans"
import { confirmPayment } from "./stripe"

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
  { key: "domains", label: "Custom domains" },
]

const day = (d?: string | Date) => (d ? new Date(d).toLocaleDateString() : "—")

function Usage({ overview }: { overview: TOverview }) {
  const { t } = useTranslation()
  return (
    <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
      {QUOTAS.map(({ key, label }) => {
        const used = overview.usage[key] ?? 0
        const limit = overview.limits[key]
        const pct = limit ? (used / limit) * 100 : 100
        return (
          <li key={key}>
            <Meter
              label={t(label)}
              value={used}
              total={limit}
              text={
                isUnlimited(limit)
                  ? t("{{n}} · unlimited", { n: used })
                  : `${used} / ${limit}`
              }
              hue="orange"
              level={used > limit ? "critical" : pct >= 80 ? "warning" : "ok"}
            />
          </li>
        )
      })}
    </ul>
  )
}

/** A one-line status notice in the status tokens (not color alone: icon + text). */
function Notice({
  tone,
  title,
  children,
}: {
  tone: "danger" | "warning"
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-[10px] border px-3 py-2 text-[13px]",
        tone === "danger"
          ? "border-destructive/40 bg-destructive-soft text-destructive-foreground"
          : "border-warning/40 bg-warning-soft text-warning-foreground"
      )}
    >
      <IconAlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <div className="opacity-90">{children}</div>
      </div>
    </div>
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
  // What the change costs now, unused time credited (PLAN §26.6 B).
  const quote = use(
    ThunderSDK.useCaching(
      ["billing", "quote", plan?._id ?? ""],
      async ({ signal }) =>
        plan && !plan.isFree && current?.isOwner
          ? await ThunderSDK.billing.quote({ query: { plan: plan._id }, signal })
          : null
    )
  ).data
  const cost = (amount: number) => money(amount, plan?.price.currency ?? "usd")

  const confirm = async () => {
    if (!plan) return
    setBusy(true)
    try {
      const subscribe = () =>
        ThunderSDK.billing.subscribe({ body: { plan: plan._id } })
      let { result, at, ...payment } = await subscribe()
      // The card top-up needs the bank (PLAN §25.5): confirm, then subscribe
      // again with the funds in (the same change, so it isn't charged twice).
      if (result === "pending" && payment.topup) {
        toast.info(t("Confirming the payment with your bank…"))
        const done = await confirmPayment({
          topup: payment.topup,
          clientSecret: payment.clientSecret,
        })
        if (!done) {
          toast.info(
            t("Your bank is still processing it; the plan starts when it confirms.")
          )
          onOpenChange(false)
          return
        }
        ;({ result, at, ...payment } = await subscribe())
      }
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
                  "Upgrades start now with a full period, paid from the tenant wallet; the unused part of your current period is credited. A cheaper plan starts when the current period ends."
                )}
          </DialogDescription>
        </DialogHeader>
        {plan && !plan.isFree && (
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{t("Price")}</dt>
            <dd className="text-end tabular-nums">
              {t("{{price}} per {{interval}}", {
                price: `⁦${cost(plan.price.amount)}⁩`,
                interval: t(plan.price.interval),
              })}
            </dd>
            {quote?.change === "scheduled" ? (
              <dd className="col-span-2 text-muted-foreground">
                {t("Starts when your current period ends; nothing is charged now.")}
              </dd>
            ) : (
              <>
                {!!quote?.credit && (
                  <>
                    <dt className="text-muted-foreground">
                      {t("Unused time of your current plan")}
                    </dt>
                    <dd className="text-end tabular-nums">
                      <span dir="ltr">−{cost(quote.credit)}</span>
                    </dd>
                  </>
                )}
                <dt className="font-medium">{t("Due now")}</dt>
                <dd className="text-end font-medium tabular-nums">
                  <span dir="ltr">{quote ? cost(quote.due) : "…"}</span>
                </dd>
                {!!quote?.refund && (
                  <>
                    <dt className="text-muted-foreground">
                      {t("Back to your wallet")}
                    </dt>
                    <dd className="text-end tabular-nums">
                      <span dir="ltr">+{cost(quote.refund)}</span>
                    </dd>
                  </>
                )}
              </>
            )}
            <dt className="text-muted-foreground">{t("Wallet balance")}</dt>
            <dd className="text-end tabular-nums">
              <span dir="ltr">{cost(wallet?.balance ?? 0)}</span>
            </dd>
          </dl>
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
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Plan & usage")}
        status={
          sub?.status === "pastDue" ? (
            <StatusBadge tone="danger" label={t("Past due")} />
          ) : undefined
        }
        description={t("What this tenant can use, and what it uses now.")}
      />

      {sub?.status === "pastDue" && (
        <Notice tone="danger" title={t("Your plan couldn't be renewed")}>
          {t(
            "The tenant is on Free until the renewal goes through. We try again every hour; add funds to the wallet or pick a plan below."
          )}
          {sub.lastError && (
            <span className="block text-xs">{sub.lastError}</span>
          )}
        </Notice>
      )}
      {overLimit && (
        <Notice tone="warning" title={t("More servers than your plan allows")}>
          {throttleAt && throttleAt > new Date()
            ? t(
                "Everything keeps running. From {{date}}, the newest servers beyond the limit poll slowly and get no deploys until you upgrade or remove servers.",
                { date: day(throttleAt) }
              )
            : t(
                "The newest servers beyond the limit poll slowly and get no deploys. Upgrade, or remove servers, to restore them."
              )}
        </Notice>
      )}

      {!overview ? (
        <Skeleton className="h-40 rounded-[10px]" />
      ) : (
        <Panel
          title={
            <span className="flex items-center gap-2">
              <span className="text-xs font-normal text-muted-foreground">
                {t("Current plan")}
              </span>
              {overview.plan.name}
              {overview.period?.kind === "complimentary" && (
                <StatusBadge tone="info" label={t("Complimentary")} />
              )}
            </span>
          }
          description={
            overview.period
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
              : t("Every tenant starts here.")
          }
          actions={
            overview.isOwner &&
            sub?.status === "active" &&
            !sub.cancelAtPeriodEnd &&
            overview.period?.kind === "paid" && (
              <Button size="sm" variant="outline" onClick={cancel}>
                {t("Cancel plan")}
              </Button>
            )
          }
        >
          <Usage overview={overview} />
        </Panel>
      )}

      <section aria-labelledby="plans-title" className="flex flex-col gap-2">
        <h2 id="plans-title" className="text-sm font-semibold">
          {t("Plans")}
        </h2>
        {overview && !overview.isOwner && (
          <p className="text-[13px] text-muted-foreground">
            {t("Only the tenant owner can change the plan.")}
          </p>
        )}
        {overview?.isOwner && !overview.paymentsReady && (
          <p className="text-[13px] text-muted-foreground">
            {t("Paid plans aren't available yet.")}
          </p>
        )}
        {!plans ? (
          <Skeleton className="h-36 rounded-[10px]" />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent =
                plan._id === overview?.plan._id ||
                (plan.isFree && overview?.source === "free")
              return (
                <li
                  key={plan._id}
                  className={cn(
                    "flex h-full flex-col gap-3 rounded-[10px] border bg-card p-4",
                    isCurrent && "border-primary ring-1 ring-primary"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      {plan.name}
                      {plan.visibility === "private" && (
                        <StatusBadge tone="neutral" label={t("For you")} />
                      )}
                    </h3>
                    <p className="text-xl font-semibold tabular-nums">
                      {money(plan.price.amount, plan.price.currency)}
                      {!!plan.price.amount && (
                        <span className="text-xs font-normal text-muted-foreground">
                          {" "}
                          / {t(plan.price.interval)}
                        </span>
                      )}
                    </p>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  <ul className="flex flex-col gap-1 text-[13px]">
                    {QUOTAS.slice(0, 4).map(({ key, label }) => (
                      <li key={key} className="flex items-center gap-2">
                        <IconCheck
                          className="size-3.5 text-success-foreground"
                          aria-hidden
                        />
                        <span className="tabular-nums">
                          {isUnlimited(plan.limits[key])
                            ? t("Unlimited")
                            : plan.limits[key]}{" "}
                          {t(label).toLowerCase()}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    {isCurrent ? (
                      <StatusBadge tone="success" label={t("Current plan")} />
                    ) : (
                      overview?.isOwner &&
                      (plan.isFree || overview.paymentsReady) && (
                        <Button
                          size="sm"
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
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-title" className="flex flex-col gap-2">
        <h2
          id="history-title"
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <IconReceipt className="size-4" aria-hidden /> {t("Billing history")}
        </h2>
        <div className="overflow-x-auto">
          <DataTable
            label={t("Billing history")}
            rows={periods}
            rowId={(p) => p._id}
            loading={!periods}
            empty={t("No payments yet.")}
            columns={[
              {
                id: "plan",
                header: t("Plan"),
                sortValue: (p) => p.planName,
                cell: (p) => (
                  <div>
                    <div className="font-medium">{p.planName ?? "—"}</div>
                    {p.scope === "server" && (
                      <div className="text-xs text-muted-foreground">
                        {t("Rented server")}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                id: "period",
                header: t("Period"),
                sortValue: (p) => new Date(p.periodStart).getTime(),
                className: "whitespace-nowrap tabular-nums",
                cell: (p) => `${day(p.periodStart)} – ${day(p.periodEnd)}`,
              },
              {
                id: "amount",
                header: t("Amount"),
                align: "end",
                sortValue: (p) => p.amount,
                cell: (p) =>
                  p.kind === "complimentary"
                    ? t("Complimentary")
                    : money(p.amount, p.currency),
              },
              {
                id: "ref",
                header: t("Reference"),
                cell: (p) => (
                  <span dir="ltr" className="font-mono text-xs">
                    {p.ledgerReference ?? p.note ?? "—"}
                  </span>
                ),
              },
            ]}
          />
        </div>
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
