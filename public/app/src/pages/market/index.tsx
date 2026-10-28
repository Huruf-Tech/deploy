import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import {
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
  IconBuildingStore,
  IconServer2,
  IconStarFilled,
  IconX,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PageHeader } from "@/components/console/page-header"
import { EmptyState } from "@/components/console/empty-state"
import { StatusBadge } from "@/components/console/status"
import { Skeleton } from "@/components/ui/skeleton"
import { useCached } from "@/hooks/use-cached"
import { gbOfMb } from "@/lib/format"
import { money } from "@/lib/plans"
import { queries } from "@/lib/queries"
import { cn } from "@/lib/utils"
import { RequestDialog } from "@/pages/rentals/RequestDialog"
import { type TMarketMachine, useRentals } from "@/pages/rentals/rental"
import { notifyServersChanged } from "@/pages/servers/events"

type TFilters = Parameters<typeof queries.market>[0]

const ANY = "any"
/** A month, in hours (PLAN §30.3). */
const HOURS = 730

/** The filters behind the "Filters" button, counted on it. */
const MORE = [
  "tier",
  "disk",
  "country",
  "minRating",
  "maxRttMs",
  "minUptime",
  "minVcpu",
  "minMemMb",
  "minDiskGb",
] as const

/** A select whose first item clears it. */
function Pick({
  id,
  label,
  anyLabel,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  anyLabel: string
  value?: string
  options: [string, string][]
  onChange: (value?: string) => void
}) {
  const items = [[ANY, anyLabel] as [string, string], ...options]
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select
        items={items.map(([value, label]) => ({ value, label }))}
        value={value ?? ANY}
        onValueChange={(v) => onChange(v === ANY ? undefined : (v as string))}
      >
        <SelectTrigger id={id} size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** A number filter with its unit; empty clears it. */
function NumberField({
  id,
  label,
  unit,
  value,
  step = 1,
  onChange,
}: {
  id: string
  label: string
  unit?: string
  value?: number
  step?: number
  onChange: (value?: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
        {unit && ` (${unit})`}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        dir="ltr"
        min={0}
        step={step}
        className="h-8 text-[13px] tabular-nums"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
      />
    </div>
  )
}

/** A country's name in the UI language, from its two-letter code. */
function useCountryName() {
  const { i18n } = useTranslation()
  return React.useMemo(() => {
    const names = new Intl.DisplayNames([i18n.language], { type: "region" })
    return (code?: string) => {
      if (!code) return undefined
      try {
        return names.of(code) ?? code
      } catch {
        return code
      }
    }
  }, [i18n.language])
}

/**
 * The market (PLAN §30.4): machines for rent, official and from the
 * community, with what's measured of them, their room and prices.
 */
export default function Market() {
  const { t } = useTranslation()
  const [filters, setFilters] = React.useState<TFilters>({ sort: "rating" })
  const set = (patch: Partial<TFilters>) => setFilters({ ...filters, ...patch })
  const { data } = useCached(queries.market(filters))
  const { reload } = useRentals()
  const [renting, setRenting] = React.useState<TMarketMachine>()
  const canRent = ThunderSDK.isPermitted("rentals", "request")
  const country = useCountryName()
  // Countries offered: those listed now, plus the one chosen.
  const [countries, setCountries] = React.useState<string[]>([])
  const seen = (data ?? []).flatMap((m) => (m.country ? [m.country] : []))
  if (seen.some((c) => !countries.includes(c))) {
    setCountries([...new Set([...countries, ...seen])].sort())
  }

  const more = MORE.filter((k) => filters[k] !== undefined).length
  const active =
    more +
    Number(!!filters.source) +
    Number(!!filters.dedicated) +
    Number(!!filters.newArrivals)
  const flag = (key: "dedicated" | "newArrivals") => ({
    "aria-pressed": !!filters[key],
    variant: filters[key] ? ("secondary" as const) : ("outline" as const),
    onClick: () =>
      set({ [key]: filters[key] ? undefined : "true" } as Partial<TFilters>),
  })

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Market")}
        description={t(
          "Rent a server on Huruf's machines or the community's. Everything shown is measured by Huruf, not typed by the owner."
        )}
      />

      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          value={filters.source ?? "all"}
          onValueChange={(v) =>
            set({
              source: v === "all" ? undefined : (v as TFilters["source"]),
            })
          }
          aria-label={t("Source")}
        >
          {(
            [
              ["all", t("All")],
              ["official", t("Official")],
              ["community", t("Community")],
            ] as const
          ).map(([v, l]) => (
            <ToggleGroupItem key={v} value={v} className="h-7 px-2.5 text-xs">
              {l}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button size="sm" className="h-8" {...flag("dedicated")}>
          {t("Whole machine")}
        </Button>
        <Button size="sm" className="h-8" {...flag("newArrivals")}>
          {t("New arrivals")}
        </Button>
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <IconAdjustmentsHorizontal className="size-4" aria-hidden />
                {t("Filters")}
                {more > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-[11px] leading-4 text-primary-foreground tabular-nums">
                    {more}
                  </span>
                )}
              </Button>
            }
          />
          <PopoverContent align="start" className="w-[min(22rem,92vw)] gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Pick
                id="f-tier"
                label={t("Speed")}
                anyLabel={t("Any speed")}
                value={filters.tier}
                options={[
                  ["Performance", t("Performance")],
                  ["Standard", t("Standard")],
                  ["Basic", t("Basic")],
                ]}
                onChange={(tier) => set({ tier: tier as TFilters["tier"] })}
              />
              <Pick
                id="f-disk"
                label={t("Disk")}
                anyLabel={t("Any disk")}
                value={filters.disk}
                options={[
                  ["NVMe", "NVMe"],
                  ["SSD", "SSD"],
                  ["HDD", "HDD"],
                ]}
                onChange={(disk) => set({ disk: disk as TFilters["disk"] })}
              />
              <div className="col-span-2">
                <Pick
                  id="f-country"
                  label={t("Country")}
                  anyLabel={t("Any country")}
                  value={filters.country}
                  options={[
                    ...new Set([
                      ...countries,
                      ...(filters.country ? [filters.country] : []),
                    ]),
                  ].map((c) => [c, country(c) ?? c])}
                  onChange={(c) => set({ country: c })}
                />
              </div>
              <NumberField
                id="f-rating"
                label={t("Min rating")}
                unit="0–100"
                value={filters.minRating}
                onChange={(minRating) => set({ minRating })}
              />
              <NumberField
                id="f-uptime"
                label={t("Min uptime")}
                unit="%"
                step={0.1}
                value={filters.minUptime}
                onChange={(minUptime) => set({ minUptime })}
              />
              <NumberField
                id="f-latency"
                label={t("Max latency")}
                unit="ms"
                value={filters.maxRttMs}
                onChange={(maxRttMs) => set({ maxRttMs })}
              />
              <NumberField
                id="f-vcpu"
                label={t("Min vCPU")}
                step={0.5}
                value={filters.minVcpu}
                onChange={(minVcpu) => set({ minVcpu })}
              />
              <NumberField
                id="f-mem"
                label={t("Min memory")}
                unit="GB"
                step={0.5}
                value={filters.minMemMb && filters.minMemMb / 1024}
                onChange={(gb) => set({ minMemMb: gb && gb * 1024 })}
              />
              <NumberField
                id="f-disk-gb"
                label={t("Min disk")}
                unit="GB"
                step={5}
                value={filters.minDiskGb}
                onChange={(minDiskGb) => set({ minDiskGb })}
              />
            </div>
            {more > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() =>
                  set(Object.fromEntries(MORE.map((k) => [k, undefined])))
                }
              >
                {t("Clear these filters")}
              </Button>
            )}
          </PopoverContent>
        </Popover>
        <div className="ms-auto flex items-center gap-2">
          <Label htmlFor="f-sort" className="text-xs text-muted-foreground">
            {t("Sort")}
          </Label>
          <Select
            items={[
              { value: "rating", label: t("Best rating") },
              { value: "price", label: t("Lowest price") },
              { value: "uptime", label: t("Best uptime") },
              { value: "latency", label: t("Lowest latency") },
            ]}
            value={filters.sort ?? "rating"}
            onValueChange={(sort) => set({ sort: sort as TFilters["sort"] })}
          >
            <SelectTrigger id="f-sort" size="sm" className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">{t("Best rating")}</SelectItem>
              <SelectItem value="price">{t("Lowest price")}</SelectItem>
              <SelectItem value="uptime">{t("Best uptime")}</SelectItem>
              <SelectItem value="latency">{t("Lowest latency")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {data && (
        <p
          className="flex items-center gap-2 text-xs text-muted-foreground"
          aria-live="polite"
        >
          {t("{{count}} machines", { count: data.length })}
          {active > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-1.5 text-xs"
              onClick={() => setFilters({ sort: filters.sort })}
            >
              <IconX className="size-3.5" aria-hidden />
              {t("Clear filters")}
            </Button>
          )}
        </p>
      )}

      {!data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-72 rounded-[10px]" />
          ))}
        </div>
      ) : !data.length ? (
        <EmptyState
          icon={IconBuildingStore}
          title={
            active ? t("No machine matches.") : t("No machine for rent yet.")
          }
          description={
            active
              ? t("Loosen the filters, or look again later.")
              : t(
                  "Machines appear here once their owners put them up for rent."
                )
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((m) => (
            <MachineCard
              key={m._id}
              machine={m}
              countryName={country(m.country)}
              onRent={canRent && !m.yours ? () => setRenting(m) : undefined}
            />
          ))}
        </ul>
      )}
      {renting && (
        <RequestDialog
          open
          onOpenChange={(o) => !o && setRenting(undefined)}
          machine={renting}
          onDone={() => {
            reload()
            notifyServersChanged()
          }}
        />
      )}
    </Page>
  )
}

/** One figure with its caption, for the card's strip. */
function Figure({
  value,
  caption,
  className,
}: {
  value: React.ReactNode
  caption: string
  className?: string
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="truncate text-base font-semibold tabular-nums">
        {value}
      </div>
      <div className="truncate text-xs text-muted-foreground">{caption}</div>
    </div>
  )
}

function MachineCard({
  machine: m,
  countryName,
  onRent,
}: {
  machine: TMarketMachine
  countryName?: string
  onRent?: () => void
}) {
  const { t } = useTranslation()
  const p = m.prices.hourly
  // The smallest size (0.5 vCPU, 0.5 GB, 5 GB), as the market's "from".
  const from = Math.ceil(
    (0.5 * p.vcpu + ((512 + m.overheadMb) / 1024) * p.memGb + 5 * p.diskGb) *
      HOURS
  )
  const monthly = m.prices.monthly
  const meta = [
    m.official ? t("Huruf") : (m.owner ?? t("Community")),
    countryName,
    m.rttMs === undefined
      ? undefined
      : t("{{ms}} ms away", { ms: Math.round(m.rttMs) }),
  ].filter(Boolean)
  const hardware = !m.virtualization
    ? undefined
    : m.virtualization === "none"
      ? t("Bare metal")
      : t("Virtual machine ({{kind}})", { kind: m.virtualization })

  return (
    <li className="flex flex-col rounded-[10px] border bg-card text-[13px]">
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg border bg-muted text-muted-foreground">
          <IconServer2 className="size-4.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold">{m.name}</h2>
            {m.yours && <StatusBadge tone="neutral" label={t("Yours")} />}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {meta.join(" · ")}
          </p>
        </div>
        <StatusBadge
          tone={m.official ? "info" : "neutral"}
          label={m.official ? t("Official") : t("Community")}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 border-y px-4 py-3">
        <Figure
          value={
            m.rating === undefined ? (
              "—"
            ) : (
              <>
                {m.rating}
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  / 100
                </span>
              </>
            )
          }
          caption={
            [m.tier && t(m.tier), m.disk].filter(Boolean).join(" · ") ||
            t("Rating")
          }
        />
        <Figure
          value={m.uptime30d === undefined ? "—" : `${m.uptime30d.toFixed(2)}%`}
          caption={t("Uptime, 30 days")}
        />
        <Figure
          value={
            m.renters ? (
              <span className="inline-flex items-center gap-1">
                <IconStarFilled
                  className="size-3.5 text-brand-text"
                  aria-hidden
                />
                {m.renters.stars}
              </span>
            ) : (
              "—"
            )
          }
          caption={
            m.renters
              ? t("{{count}} renters", { count: m.renters.count })
              : t("No ratings yet")
          }
        />
      </div>

      <dl className="flex flex-col gap-1.5 px-4 py-3">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t("Free now")}</dt>
          <dd dir="ltr" className="text-end tabular-nums">
            {t("{{cpu}} vCPU · {{mem}} GB · {{disk}} GB", {
              cpu: m.free.cpus,
              mem: gbOfMb(m.free.memMb),
              disk: m.free.diskGb,
            })}
          </dd>
        </div>
        {hardware && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("Hardware")}</dt>
            <dd className="min-w-0 truncate text-end">
              {hardware}
              {m.steal !== undefined && m.steal >= 0.01 && (
                <span className="text-muted-foreground">
                  {" · "}
                  {t("host takes {{pct}}", {
                    pct: `${(m.steal * 100).toFixed(1)}%`,
                  })}
                </span>
              )}
            </dd>
          </div>
        )}
        <div className="flex flex-wrap gap-1 pt-1">
          {m.newArrival && (
            <StatusBadge
              tone="warning"
              label={t("New · {{count}} days measured", {
                count: m.measuredDays,
              })}
            />
          )}
          {m.dedicated && (
            <StatusBadge tone="success" label={t("Can be rented whole")} />
          )}
          {m.autoAccept && (
            <StatusBadge tone="neutral" label={t("Starts at once")} />
          )}
        </div>
      </dl>

      {!m.official && (
        <p className="mx-4 mb-3 flex gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-foreground">
          <IconAlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          {t(
            "The owner of this machine can access your data. If the hardware fails, data on it is lost."
          )}
        </p>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 border-t px-4 py-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{t("From")}</div>
          <div className="tabular-nums">
            <span className="text-lg font-semibold">{money(from, "usd")}</span>
            <span className="text-xs text-muted-foreground">
              {" "}
              {t("/ month")}
            </span>
          </div>
          <div
            dir="ltr"
            className="truncate text-xs text-muted-foreground tabular-nums"
            title={t(
              "{{cpu}} per vCPU · {{mem}} per GB memory · {{disk}} per GB disk, a month",
              {
                cpu: money(monthly.vcpu, "usd"),
                mem: money(monthly.memGb, "usd"),
                disk: money(monthly.diskGb, "usd"),
              }
            )}
          >
            {`${money(monthly.vcpu, "usd")} vCPU · ${money(monthly.memGb, "usd")} GB · ${money(monthly.diskGb, "usd")} disk`}
            {monthly.whole !== undefined &&
              ` · ${t("whole {{price}}", { price: money(monthly.whole, "usd") })}`}
          </div>
        </div>
        {onRent && (
          <Button size="sm" onClick={onRent}>
            {t("Rent")}
          </Button>
        )}
      </div>
    </li>
  )
}
