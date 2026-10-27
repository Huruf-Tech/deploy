import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { use } from "@/core/hooks/use"
import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/console/page-header"
import { DataTable } from "@/components/console/data-table"
import { StatusBadge } from "@/components/console/status"
import { Toolbar } from "@/components/console/toolbar"
import { useFresh } from "@/hooks/use-fresh"
import { money } from "@/lib/plans"
import { errorMessage } from "@/lib/utils"

type TFilter = NonNullable<
  Parameters<typeof ThunderSDK.paymentsAdmin.topups>[0]["query"]
>["status"]

const when = (date?: string | Date) =>
  date ? new Date(date).toLocaleString() : "—"

/**
 * Admin → Payments (PLAN §25.5, Phase 15d): card top-ups across tenants,
 * Settle and Abandon for stuck ones, and refunds and disputes to deal with in
 * Stripe.
 */
export default function PaymentsAdmin() {
  const { t } = useTranslation()
  const [filter, setFilter] = React.useState<TFilter | "all">("all")
  const [busy, setBusy] = React.useState<string>()

  const topupsRequest = ThunderSDK.useCaching(
    ["paymentsAdmin", "topups", filter],
    async ({ signal }) =>
      await ThunderSDK.paymentsAdmin.topups({
        query: filter === "all" ? {} : { status: filter },
        signal,
      })
  )
  const eventsRequest = ThunderSDK.useCaching(
    ["paymentsAdmin", "events"],
    async ({ signal }) =>
      await ThunderSDK.paymentsAdmin.events({ query: {}, signal })
  )
  useFresh(topupsRequest)
  const topups = use(topupsRequest).data
  const events = use(eventsRequest).data

  const run = async (id: string, action: () => Promise<void>) => {
    setBusy(id)
    try {
      await action()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Something went wrong"))
    } finally {
      setBusy(undefined)
      topupsRequest.invalidate()
    }
  }

  const settle = (id: string) =>
    run(id, async () => {
      const { outcome, status, error } = await ThunderSDK.paymentsAdmin.settle({
        params: { id },
      })
      if (outcome === "no_charge") {
        toast.info(
          t("Stripe has no charge for it. Abandon it to free its key.")
        )
      } else if (outcome === "waiting") {
        toast.info(t("Stripe is still processing it; try again later."))
      } else if (outcome === "owner") {
        toast.info(t("It waits for the owner to confirm it with their bank."))
      } else if (status === "completed") {
        toast.success(t("Settled: the wallet is credited."))
      } else if (status === "failed") {
        toast.success(t("Settled as failed: {{error}}", { error }))
      } else {
        toast.warning(error ?? t("Not credited yet; try again."))
      }
    })

  const abandon = (id: string) =>
    run(id, async () => {
      await ThunderSDK.paymentsAdmin.abandon({ params: { id } })
      toast.success(t("Abandoned"))
    })

  const filters: { value: TFilter | "all"; label: string }[] = [
    { value: "all", label: t("All top-ups") },
    { value: "stuck", label: t("Stuck") },
    { value: "initiated", label: t("Initiated") },
    { value: "pending", label: t("Pending") },
    { value: "paid", label: t("Paid, not credited") },
    { value: "processing", label: t("Processing") },
    { value: "completed", label: t("Completed") },
    { value: "failed", label: t("Failed") },
  ]
  const purposes: Record<string, string> = {
    add: t("Add funds"),
    fund: t("Plan change"),
    renew: t("Renewal"),
  }

  return (
    <Page className="flex flex-col gap-6 py-5">
      <PageHeader
        title={t("Payments")}
        description={t(
          "Card top-ups across tenants. Settle asks Stripe what happened to a stuck one; refunds and disputes are handled in Stripe."
        )}
      />

      <section
        aria-labelledby="topups-title"
        className="flex min-w-0 flex-col gap-2"
      >
        <h2 id="topups-title" className="sr-only">
          {t("Top-ups")}
        </h2>
        <Toolbar>
          <Select
            items={filters}
            value={filter}
            onValueChange={(v) => setFilter(v as TFilter | "all")}
          >
            <SelectTrigger size="sm" className="w-48" aria-label={t("Status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filters.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Toolbar>
        <div className="overflow-x-auto">
          <DataTable
            label={t("Top-ups")}
            rows={topups}
            loading={!topups}
            rowId={(r) => r._id}
            limit={20}
            empty={
              filter === "stuck"
                ? t("Nothing stuck: every top-up has its outcome.")
                : t("No top-ups.")
            }
            columns={[
              {
                id: "tenant",
                header: t("Tenant"),
                sortValue: (r) => r.tenantName ?? "",
                cell: (r) => (
                  <div className="min-w-0">
                    <div className="font-medium">{r.tenantName ?? "—"}</div>
                    <div
                      dir="ltr"
                      className="font-mono text-xs text-muted-foreground"
                    >
                      {r.tenant}
                    </div>
                  </div>
                ),
              },
              {
                id: "amount",
                header: t("Amount"),
                align: "end",
                sortValue: (r) => r.amount,
                cell: (r) => (
                  <span dir="ltr" className="font-mono text-xs">
                    {money(r.amount, r.currency)}
                  </span>
                ),
              },
              {
                id: "status",
                header: t("Status"),
                sortValue: (r) => r.status,
                cell: (r) => (
                  <span
                    className="flex flex-wrap items-center gap-1"
                    title={r.error}
                  >
                    <StatusBadge
                      state={r.status}
                      tone={
                        r.status === "completed"
                          ? "success"
                          : r.status === "paid"
                            ? "danger"
                            : undefined
                      }
                      label={
                        filters.find((f) => f.value === r.status)?.label ??
                        r.status
                      }
                    />
                    {r.stuck && (
                      <StatusBadge tone="warning" label={t("Stuck")} />
                    )}
                  </span>
                ),
              },
              {
                id: "for",
                header: t("For"),
                className: "max-md:hidden",
                cell: (r) =>
                  (r.purpose && purposes[r.purpose]) ?? r.purpose ?? "—",
              },
              {
                id: "ref",
                header: t("Stripe"),
                className: "max-lg:hidden",
                cell: (r) => (
                  <span
                    dir="ltr"
                    className="font-mono text-xs text-muted-foreground"
                  >
                    {r.providerRef ?? "—"}
                  </span>
                ),
              },
              {
                id: "created",
                header: t("Created"),
                sortValue: (r) =>
                  r.createdAt ? new Date(r.createdAt).getTime() : 0,
                className: "whitespace-nowrap tabular-nums text-xs",
                cell: (r) => when(r.createdAt),
              },
              {
                id: "actions",
                header: <span className="sr-only">{t("Actions")}</span>,
                align: "end",
                cell: (r) =>
                  r.stuck && (
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        disabled={busy === r._id}
                        onClick={() => settle(r._id)}
                      >
                        {t("Settle")}
                      </Button>
                      {r.status === "initiated" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7"
                          disabled={busy === r._id}
                          onClick={() => abandon(r._id)}
                        >
                          {t("Abandon")}
                        </Button>
                      )}
                    </div>
                  ),
              },
            ]}
          />
        </div>
      </section>

      <section
        aria-labelledby="disputes-title"
        className="flex min-w-0 flex-col gap-2"
      >
        <div>
          <h2 id="disputes-title" className="text-sm font-semibold">
            {t("Refunds and disputes")}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {t(
              "Recorded from Stripe's webhooks. Act on them in the Stripe dashboard, then mark them handled."
            )}
          </p>
        </div>
        <div className="overflow-x-auto">
          <DataTable
            label={t("Refunds and disputes")}
            rows={events}
            loading={!events}
            rowId={(e) => e._id}
            limit={10}
            empty={t("No refunds or disputes.")}
            columns={[
              {
                id: "kind",
                header: t("Kind"),
                sortValue: (e) => e.kind,
                cell: (e) => (
                  <StatusBadge
                    tone={e.kind === "dispute" ? "danger" : "neutral"}
                    label={e.kind === "dispute" ? t("Dispute") : t("Refund")}
                  />
                ),
              },
              {
                id: "tenant",
                header: t("Tenant"),
                cell: (e) => e.tenantName ?? e.tenant ?? "—",
              },
              {
                id: "amount",
                header: t("Amount"),
                align: "end",
                cell: (e) =>
                  e.amount === undefined ? (
                    "—"
                  ) : (
                    <span dir="ltr" className="font-mono text-xs">
                      {money(e.amount, e.currency ?? "usd")}
                    </span>
                  ),
              },
              {
                id: "ref",
                header: t("Stripe"),
                className: "max-md:hidden",
                cell: (e) => (
                  <span
                    dir="ltr"
                    className="font-mono text-xs text-muted-foreground"
                  >
                    {e.providerRef ?? "—"}
                  </span>
                ),
              },
              {
                id: "date",
                header: t("Date"),
                sortValue: (e) => new Date(e.processedAt).getTime(),
                className: "whitespace-nowrap tabular-nums text-xs",
                cell: (e) => when(e.processedAt),
              },
              {
                id: "handled",
                header: <span className="sr-only">{t("Handled")}</span>,
                align: "end",
                cell: (e) =>
                  e.handledAt ? (
                    <StatusBadge tone="success" label={t("Handled")} />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7"
                      disabled={busy === e._id}
                      onClick={() =>
                        run(e._id, async () => {
                          await ThunderSDK.paymentsAdmin.markHandled({
                            params: { id: e._id },
                          })
                          eventsRequest.invalidate()
                        })
                      }
                    >
                      {t("Mark handled")}
                    </Button>
                  ),
              },
            ]}
          />
        </div>
      </section>
    </Page>
  )
}
