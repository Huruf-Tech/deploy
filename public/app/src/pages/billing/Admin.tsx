import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconGift } from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { Page } from "@/components/page"
import { Badge } from "@/components/ui/badge"
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
import { errorMessage } from "@/lib/utils"

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
  const plans = use(
    ThunderSDK.useCaching(
      ["plans", "all"],
      async ({ signal }) =>
        await ThunderSDK.plans.get({
          params: {},
          query: { limit: 100 },
          signal,
        })
    )
  ).data?.results
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
            <FieldLabel htmlFor="grant-tenant">{t("Workspace ID")}</FieldLabel>
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

/** Admin → Billing (PLAN §22.6): every workspace's subscription, and grants. */
export default function BillingAdmin() {
  const { t } = useTranslation()
  const request = ThunderSDK.useCaching(
    ["billingAdmin"],
    async ({ signal }) =>
      await ThunderSDK.billingAdmin.subscriptions({ query: {}, signal })
  )
  useFresh(request)
  const { data } = use(request)
  const [granting, setGranting] = React.useState(false)

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t("Billing")}</h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "Subscriptions across workspaces. Plans are edited under Admin → Plans."
            )}
          </p>
        </div>
        {ThunderSDK.isPermitted("billingAdmin", "grant") && (
          <Button onClick={() => setGranting(true)}>
            <IconGift data-icon="inline-start" />
            {t("Grant a plan")}
          </Button>
        )}
      </div>
      {!data ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : !data.length ? (
        <p className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("No subscriptions yet: every workspace is on Free.")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Workspace")}</TableHead>
                <TableHead>{t("Plan")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Period ends")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s._id}>
                  <TableCell>
                    <div className="font-medium">{s.tenantName ?? "—"}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {s.tenant}
                    </div>
                  </TableCell>
                  <TableCell>{s.planName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        s.status === "pastDue"
                          ? "destructive"
                          : s.status === "active"
                            ? "secondary"
                            : "outline"
                      }
                      title={s.lastError}
                    >
                      {s.status === "pastDue"
                        ? t("Past due")
                        : s.status === "active"
                          ? s.cancelAtPeriodEnd
                            ? t("Ends at period end")
                            : t("Active")
                          : t("Canceled")}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {s.currentPeriodEnd
                      ? new Date(s.currentPeriodEnd).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <GrantDialog
        open={granting}
        onOpenChange={setGranting}
        onGranted={() => request.invalidate()}
      />
    </Page>
  )
}
