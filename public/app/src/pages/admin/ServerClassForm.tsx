import * as React from "react"
import { useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { getLocalPath } from "@/core/lib/utils"
import { errorMessage } from "@/lib/utils"

type TClassDraft = {
  name: string
  description: string
  family: string
  rates: {
    vcpu: number
    memGb: number
    diskGb: number
    trafficGb: number
    fixed: number
  }
  includedTrafficPerVcpu: number
  cpuOvercommit: number
  maxPerRental: { vcpu: number; memMb: number; diskGb: number }
  active: boolean
  sortOrder: number
}

const blank = (): TClassDraft => ({
  name: "",
  description: "",
  family: "",
  rates: { vcpu: 800, memGb: 400, diskGb: 12, trafficGb: 10, fixed: 200 },
  includedTrafficPerVcpu: 100,
  cpuOvercommit: 1,
  maxPerRental: { vcpu: 4, memMb: 8192, diskGb: 160 },
  active: true,
  sortOrder: 0,
})

/** Rates as typed: dollars per month (stored in cents). */
const RATES = [
  ["vcpu", "Per vCPU"],
  ["memGb", "Per GB of memory"],
  ["diskGb", "Per GB of disk"],
  ["trafficGb", "Per GB of traffic beyond the allowance"],
  ["fixed", "Per rental, whatever its size"],
] as const

/**
 * Create / edit a server class and its rate card (PLAN §26.8). The generated
 * form can't edit the nested rates and maximums. Rates are typed in dollars.
 */
export default function ServerClassForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toList = React.useCallback(
    () => navigate(getLocalPath("admin/serverClasses")),
    [navigate]
  )
  const { id } = useParams<{ id?: string }>()
  const [draft, setDraft] = React.useState<TClassDraft | null>(
    id ? null : blank
  )
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!id) return
    ThunderSDK.serverClasses
      .get({ params: { id }, query: {} })
      .then(({ results }) => {
        const found = results[0] as Partial<TClassDraft> | undefined
        if (!found) throw new Error(t("Class not found"))
        const base = blank()
        setDraft({
          ...base,
          ...found,
          description: found.description ?? "",
          family: found.family ?? "",
          rates: { ...base.rates, ...found.rates },
          maxPerRental: { ...base.maxPerRental, ...found.maxPerRental },
        })
      })
      .catch((e) => {
        toast.error(errorMessage(e) ?? t("Could not load the class"))
        toList()
      })
  }, [id, toList, t])

  if (!draft)
    return (
      <Page className="py-5">
        <Skeleton className="h-96 max-w-[720px] rounded-[10px]" />
      </Page>
    )

  const set = (patch: Partial<TClassDraft>) => setDraft({ ...draft, ...patch })
  const number = (
    id: string,
    label: string,
    value: number,
    onChange: (n: number) => void,
    step: number | string = 1
  ) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        step={step}
        required
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    const body = {
      ...draft,
      description: draft.description.trim() || undefined,
      family: draft.family.trim() || undefined,
    }
    try {
      if (id) await ThunderSDK.serverClasses.update({ params: { id }, body })
      else await ThunderSDK.serverClasses.create({ body })
      toast.success(id ? t("Class saved") : t("Class created"))
      toList()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save the class"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        className="w-full max-w-[720px]"
        title={id ? t("Edit server class") : t("New server class")}
        description={t(
          "Rentals keep the price they were approved at; new rates apply to new sizes and custom requests."
        )}
      />
      <form
        onSubmit={save}
        className="flex w-full max-w-[720px] flex-col gap-3"
      >
        <Panel bodyClassName="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="class-name">{t("Name")}</Label>
            <Input
              id="class-name"
              required
              maxLength={50}
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="class-family">
              {t("Instance family (admins only)")}
            </Label>
            <Input
              id="class-family"
              maxLength={30}
              dir="ltr"
              className="font-mono"
              placeholder="t3"
              value={draft.family}
              onChange={(e) => set({ family: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="class-description">{t("Description")}</Label>
            <Input
              id="class-description"
              maxLength={300}
              value={draft.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>
        </Panel>

        <Panel
          title={t("Rates ($ a month)")}
          bodyClassName="grid gap-4 sm:grid-cols-2"
        >
          {RATES.map(([key, label]) =>
            number(
              `rate-${key}`,
              t(label),
              draft.rates[key] / 100,
              (n) =>
                set({ rates: { ...draft.rates, [key]: Math.round(n * 100) } }),
              "0.01"
            )
          )}
        </Panel>

        <Panel
          title={t("Rentals in this class")}
          bodyClassName="grid gap-4 sm:grid-cols-2"
        >
          {number(
            "class-traffic",
            t("Traffic included per vCPU (GB a month)"),
            draft.includedTrafficPerVcpu,
            (n) => set({ includedTrafficPerVcpu: Math.trunc(n) })
          )}
          {number(
            "class-overcommit",
            t("CPU overcommit (×)"),
            draft.cpuOvercommit,
            (n) => set({ cpuOvercommit: n }),
            "0.5"
          )}
          {number(
            "class-max-vcpu",
            t("Largest custom: vCPU"),
            draft.maxPerRental.vcpu,
            (n) => set({ maxPerRental: { ...draft.maxPerRental, vcpu: n } }),
            "0.5"
          )}
          {number(
            "class-max-mem",
            t("Largest custom: memory (GB)"),
            draft.maxPerRental.memMb / 1024,
            (n) =>
              set({
                maxPerRental: {
                  ...draft.maxPerRental,
                  memMb: Math.round(n * 1024),
                },
              }),
            "0.5"
          )}
          {number(
            "class-max-disk",
            t("Largest custom: disk (GB)"),
            draft.maxPerRental.diskGb,
            (n) =>
              set({
                maxPerRental: { ...draft.maxPerRental, diskGb: Math.trunc(n) },
              }),
            5
          )}
          {number("class-order", t("Sort order"), draft.sortOrder, (n) =>
            set({ sortOrder: Math.trunc(n) })
          )}
          <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[13px] sm:col-span-2">
            {t("Active: customers can rent it")}
            <Switch
              checked={draft.active}
              onCheckedChange={(active) => set({ active })}
            />
          </label>
        </Panel>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => toList()}
          >
            {t("Cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={busy}>
            {id ? t("Save") : t("Create class")}
          </Button>
        </div>
      </form>
    </Page>
  )
}
