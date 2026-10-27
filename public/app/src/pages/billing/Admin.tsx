import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconGift, IconReceipt } from "@tabler/icons-react"

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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/console/page-header"
import { DataTable } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { StatusBadge } from "@/components/console/status"
import { errorMessage } from "@/lib/utils"
import { useCached } from "@/hooks/use-cached"
import { day } from "@/lib/format"
import { queries } from "@/lib/queries"

function GrantDialog({
  open,
  onOpenChange,
  onGranted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGranted: () => void
}) {
  const { t } = useTranslation()
  const plans = useCached(queries.plans()).data?.results
  const [plan, setPlan] = React.useState<string>()
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (!plan) return setError(t("Pick a plan"))
    setBusy(true)
    setError(null)
    try {
      await ThunderSDK.billingAdmin.grant({
        body: {
          tenant: String(form.get("tenant")).trim(),
          plan,
          days: Number(form.get("days")),
          note: String(form.get("note")).trim(),
        },
      })
      toast.success(t("Granted"))
      onGranted()
      onOpenChange(false)
    } catch (e) {
      setError(errorMessage(e) ?? t("Could not grant it"))
    } finally {
      setBusy(false)
    }
  }

  const items = (plans ?? []).map((p) => ({ value: p._id, label: p.name }))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("Grant a complimentary plan")}</DialogTitle>
            <DialogDescription>
              {t(
                "For partners, trials or support cases: the plan applies from now, at no charge and without a wallet entry."
              )}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="grant-tenant">{t("Tenant ID")}</FieldLabel>
            <Input
              id="grant-tenant"
              name="tenant"
              required
              pattern="[a-f0-9]{24}"
              className="font-mono"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="grant-plan">{t("Plan")}</FieldLabel>
              <Select
                items={items}
                value={plan}
                onValueChange={(v) => setPlan(v as string)}
              >
                <SelectTrigger id="grant-plan" className="w-full">
                  <SelectValue placeholder={t("Pick a plan")} />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="grant-days">{t("Days")}</FieldLabel>
              <Input
                id="grant-days"
                name="days"
                type="number"
                min={1}
                max={3650}
                defaultValue={30}
                required
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="grant-note">{t("Reason")}</FieldLabel>
            <Input id="grant-note" name="note" required maxLength={300} />
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {t("Grant")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Admin → Billing (PLAN §22.6): every tenant's subscription, and grants. */
export default function BillingAdmin() {
  const { t } = useTranslation()
  const { data, reload } = useCached(queries.billingAdmin())
  const [granting, setGranting] = React.useState(false)

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Subscriptions")}
        description={t(
          "Subscriptions across tenants. Plans are edited under Admin → Plans."
        )}
        actions={
          ThunderSDK.isPermitted("billingAdmin", "grant") && (
            <Button size="sm" onClick={() => setGranting(true)}>
              <IconGift data-icon="inline-start" />
              {t("Grant a plan")}
            </Button>
          )
        }
      />
      {data && !data.length ? (
        <EmptyState
          icon={IconReceipt}
          title={t("No subscriptions yet: every tenant is on Free.")}
        />
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            label={t("Billing")}
            rows={data}
            rowId={(s) => s._id}
            loading={!data}
            columns={[
              {
                id: "tenant",
                header: t("Tenant"),
                sortValue: (s) => s.tenantName ?? "",
                cell: (s) => (
                  <div className="min-w-0">
                    <div className="font-medium">{s.tenantName ?? "—"}</div>
                    <div
                      dir="ltr"
                      className="font-mono text-xs text-muted-foreground"
                    >
                      {s.tenant}
                    </div>
                  </div>
                ),
              },
              {
                id: "plan",
                header: t("Plan"),
                sortValue: (s) => s.planName ?? "",
                cell: (s) => s.planName ?? "—",
              },
              {
                id: "status",
                header: t("Status"),
                sortValue: (s) => s.status,
                cell: (s) => (
                  <span title={s.lastError}>
                    <StatusBadge
                      tone={
                        s.status === "pastDue"
                          ? "danger"
                          : s.status === "active"
                            ? s.cancelAtPeriodEnd
                              ? "warning"
                              : "success"
                            : "neutral"
                      }
                      label={
                        s.status === "pastDue"
                          ? t("Past due")
                          : s.status === "active"
                            ? s.cancelAtPeriodEnd
                              ? t("Ends at period end")
                              : t("Active")
                            : t("Canceled")
                      }
                    />
                  </span>
                ),
              },
              {
                id: "ends",
                header: t("Period ends"),
                sortValue: (s) =>
                  s.currentPeriodEnd
                    ? new Date(s.currentPeriodEnd).getTime()
                    : undefined,
                className: "whitespace-nowrap tabular-nums",
                cell: (s) =>
                  s.currentPeriodEnd ? day(s.currentPeriodEnd) : "—",
              },
            ]}
          />
        </div>
      )}
      <GrantDialog
        open={granting}
        onOpenChange={setGranting}
        onGranted={reload}
      />
    </Page>
  )
}
