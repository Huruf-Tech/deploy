import * as React from "react"
import { useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { RefSelect } from "@/core/custom/RefSelect"
import type { TField } from "@/core/lib/jsonSchemaToFields"
import { errorMessage } from "@/lib/utils"

/** Same order and defaults as `$planLimits` / `$planFeatures` (the Free plan). */
const LIMITS = [
  ["servers", "Servers", 5],
  ["projects", "Projects", 20],
  ["members", "Members", 3],
  ["releasesKept", "Releases kept (rollback)", 5],
  ["variablesPerScope", "Variables per scope", 200],
  ["deploysPerHour", "Deploys per hour", 30],
  ["concurrentTerminals", "Concurrent terminals", 1],
  ["concurrentStreams", "Concurrent log/metric streams", 3],
  ["variableApiReadsPerMinute", "Variable API reads per minute", 60],
  ["templates", "Templates", 10],
  ["alertRules", "Alert rules", 10],
  ["gitIntegrations", "GitHub connections", 10],
  ["registries", "Registries", 10],
  ["managedServers", "Managed servers", 0],
] as const

const FEATURES = [
  ["blueGreen", "Blue/green deploys", true],
  ["autoscale", "Autoscale", true],
  ["privateNetwork", "Private network", true],
  ["backups", "Backups", true],
  ["managedServers", "Managed servers", false],
] as const

type TLimitKey = (typeof LIMITS)[number][0]
type TFeatureKey = (typeof FEATURES)[number][0]

type TPlanDraft = {
  name: string
  slug: string
  description: string
  visibility: "public" | "private"
  allowedTenants: string[]
  price: { amount: number; currency: string; interval: "month" | "year" }
  limits: Record<TLimitKey, number>
  features: Record<TFeatureKey, boolean>
  isFree: boolean
  active: boolean
  sortOrder: number
}

const blank = (): TPlanDraft => ({
  name: "",
  slug: "",
  description: "",
  visibility: "public",
  allowedTenants: [],
  price: { amount: 0, currency: "usd", interval: "month" },
  limits: Object.fromEntries(LIMITS.map(([k, , d]) => [k, d])) as Record<
    TLimitKey,
    number
  >,
  features: Object.fromEntries(FEATURES.map(([k, , d]) => [k, d])) as Record<
    TFeatureKey,
    boolean
  >,
  isFree: false,
  active: true,
  sortOrder: 0,
})

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)

const tenantsField = {
  name: "allowedTenants",
  type: "text",
  ref: "tenants",
  refLabel: "name",
} as TField

/**
 * Create / edit a plan (PLAN §22.1). The generated form can't edit the nested
 * price, limits and features, or pick tenants. Prices are typed in currency
 * units and stored in cents.
 */
export default function PlanForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const [plan, setPlan] = React.useState<TPlanDraft | null>(id ? null : blank)
  const [slugTouched, setSlugTouched] = React.useState(!!id)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!id) return
    ThunderSDK.plans
      .get({ params: { id }, query: {} })
      .then(({ results }) => {
        const found = results[0] as Partial<TPlanDraft> | undefined
        if (!found) throw new Error(t("Plan not found"))
        const base = blank()
        setPlan({
          ...base,
          ...found,
          description: found.description ?? "",
          allowedTenants: (found.allowedTenants ?? []).map(String),
          limits: { ...base.limits, ...found.limits },
          features: { ...base.features, ...found.features },
        })
      })
      .catch((e) => {
        toast.error(errorMessage(e) ?? t("Could not load the plan"))
        navigate(-1)
      })
  }, [id, navigate, t])

  if (!plan)
    return (
      <Page className="py-4">
        <Skeleton className="h-96 max-w-3xl rounded-4xl" />
      </Page>
    )

  const set = (patch: Partial<TPlanDraft>) => setPlan({ ...plan, ...patch })

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    // isFree is set by setup only; the API refuses changes to it.
    const { isFree: _, ...body } = {
      ...plan,
      description: plan.description.trim() || undefined,
      allowedTenants: plan.visibility === "private" ? plan.allowedTenants : [],
    }
    try {
      if (id) await ThunderSDK.plans.update({ params: { id }, body })
      else await ThunderSDK.plans.create({ body })
      toast.success(id ? t("Plan saved") : t("Plan created"))
      navigate(-1)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save the plan"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page className="py-4">
      <form onSubmit={save} className="flex max-w-3xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{id ? t("Edit plan") : t("New plan")}</CardTitle>
            <CardDescription>
              {plan.isFree
                ? t(
                    "The default plan every workspace starts on. It can't be made paid or deleted."
                  )
                : t(
                    "Edits apply to subscribed workspaces from their next period."
                  )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-name">{t("Name")}</Label>
              <Input
                id="plan-name"
                required
                maxLength={50}
                value={plan.name}
                onChange={(e) =>
                  set({
                    name: e.target.value,
                    ...(slugTouched ? {} : { slug: slugify(e.target.value) }),
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-slug">{t("Slug")}</Label>
              <Input
                id="plan-slug"
                required
                maxLength={50}
                pattern="[a-z0-9\-]+"
                title={t("Lowercase letters, digits and '-'")}
                className="font-mono"
                value={plan.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set({ slug: e.target.value })
                }}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="plan-description">{t("Description")}</Label>
              <Textarea
                id="plan-description"
                maxLength={500}
                rows={2}
                value={plan.description}
                onChange={(e) => set({ description: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Price")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-amount">{t("Amount")}</Label>
              <Input
                id="plan-amount"
                type="number"
                min={0}
                step="0.01"
                required
                disabled={plan.isFree}
                value={plan.price.amount / 100}
                onChange={(e) =>
                  set({
                    price: {
                      ...plan.price,
                      amount: Math.round(Number(e.target.value) * 100),
                    },
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-currency">{t("Currency")}</Label>
              <Input
                id="plan-currency"
                required
                minLength={3}
                maxLength={3}
                className="font-mono uppercase"
                value={plan.price.currency}
                onChange={(e) =>
                  set({
                    price: {
                      ...plan.price,
                      currency: e.target.value.toLowerCase(),
                    },
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-interval">{t("Billed every")}</Label>
              <Select
                items={[
                  { value: "month", label: t("Month") },
                  { value: "year", label: t("Year") },
                ]}
                value={plan.price.interval}
                onValueChange={(v) =>
                  set({
                    price: { ...plan.price, interval: v as "month" | "year" },
                  })
                }
              >
                <SelectTrigger id="plan-interval" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">{t("Month")}</SelectItem>
                  <SelectItem value="year">{t("Year")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Limits")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LIMITS.map(([key, label]) => (
              <div key={key} className="flex flex-col gap-2">
                <Label htmlFor={`limit-${key}`}>{t(label)}</Label>
                <Input
                  id={`limit-${key}`}
                  type="number"
                  min={key === "releasesKept" ? 1 : 0}
                  step={1}
                  required
                  value={plan.limits[key]}
                  onChange={(e) =>
                    set({
                      limits: {
                        ...plan.limits,
                        [key]: Math.trunc(Number(e.target.value)),
                      },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Features")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"
              >
                {t(label)}
                <Switch
                  checked={plan.features[key]}
                  onCheckedChange={(on) =>
                    set({ features: { ...plan.features, [key]: on } })
                  }
                />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Availability")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-visibility">{t("Visibility")}</Label>
              <Select
                items={[
                  { value: "public", label: t("Public: every workspace") },
                  { value: "private", label: t("Private: chosen workspaces") },
                ]}
                value={plan.visibility}
                disabled={plan.isFree}
                onValueChange={(v) =>
                  set({ visibility: v as "public" | "private" })
                }
              >
                <SelectTrigger id="plan-visibility" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    {t("Public: every workspace")}
                  </SelectItem>
                  <SelectItem value="private">
                    {t("Private: chosen workspaces")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-order">{t("Sort order")}</Label>
              <Input
                id="plan-order"
                type="number"
                step={1}
                value={plan.sortOrder}
                onChange={(e) =>
                  set({ sortOrder: Math.trunc(Number(e.target.value)) })
                }
              />
            </div>
            {plan.visibility === "private" && (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="plan-tenants">{t("Workspaces")}</Label>
                <RefSelect
                  id="plan-tenants"
                  field={tenantsField}
                  multiple
                  value={plan.allowedTenants}
                  onValueChange={(v) =>
                    set({
                      allowedTenants: ((v as unknown[] | null) ?? []).map(
                        String
                      ),
                    })
                  }
                />
              </div>
            )}
            <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm sm:col-span-2">
              <span>
                {t("Active")}
                <span className="block text-xs text-muted-foreground">
                  {t(
                    "Inactive plans can't be picked; subscribed workspaces keep them."
                  )}
                </span>
              </span>
              <Switch
                checked={plan.active}
                disabled={plan.isFree}
                onCheckedChange={(active) => set({ active })}
              />
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={busy}>
            {id ? t("Save") : t("Create plan")}
          </Button>
        </div>
      </form>
    </Page>
  )
}
