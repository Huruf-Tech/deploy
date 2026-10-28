import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { IconBuildingStore, IconStarFilled } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/console/page-header"
import { EmptyState } from "@/components/console/empty-state"
import { StatusBadge } from "@/components/console/status"
import { Toolbar } from "@/components/console/toolbar"
import { Skeleton } from "@/components/ui/skeleton"
import { useCached } from "@/hooks/use-cached"
import { gbOfMb } from "@/lib/format"
import { money } from "@/lib/plans"
import { queries } from "@/lib/queries"
import { RequestDialog } from "@/pages/rentals/RequestDialog"
import { type TMarketMachine, useRentals } from "@/pages/rentals/rental"
import { notifyServersChanged } from "@/pages/servers/events"

type TFilters = Parameters<typeof queries.market>[0]

const ANY = "any"

/** One filter select; "any" clears it. */
function Pick({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value?: string
  options: [string, string][]
  onChange: (value?: string) => void
}) {
  const { t } = useTranslation()
  const items = [[ANY, label] as [string, string], ...options]
  return (
    <Select
      items={items.map(([value, label]) => ({ value, label }))}
      value={value ?? ANY}
      onValueChange={(v) => onChange(v === ANY ? undefined : (v as string))}
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
        className="w-auto data-[size=sm]:h-8"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {v === ANY ? t("{{label}}: any", { label }) : l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** A number filter: empty clears it. */
function Min({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string
  value?: number
  onChange: (value?: number) => void
  step?: number
}) {
  return (
    <Input
      type="number"
      dir="ltr"
      min={0}
      step={step}
      aria-label={label}
      placeholder={label}
      className="h-8 w-32 text-[13px]"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? undefined : Number(e.target.value))
      }
    />
  )
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

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Market")}
        description={t(
          "Rent a server on Huruf's machines or the community's. Everything shown is measured by Huruf, not typed by the owner."
        )}
      />
      <Toolbar>
        <Pick
          label={t("Source")}
          value={filters.source}
          options={[
            ["official", t("Official")],
            ["community", t("Community")],
          ]}
          onChange={(source) => set({ source: source as TFilters["source"] })}
        />
        <Pick
          label={t("Speed")}
          value={filters.tier}
          options={[
            ["Performance", t("Performance")],
            ["Standard", t("Standard")],
            ["Basic", t("Basic")],
          ]}
          onChange={(tier) => set({ tier: tier as TFilters["tier"] })}
        />
        <Pick
          label={t("Disk")}
          value={filters.disk}
          options={[
            ["NVMe", "NVMe"],
            ["SSD", "SSD"],
            ["HDD", "HDD"],
          ]}
          onChange={(disk) => set({ disk: disk as TFilters["disk"] })}
        />
        <Pick
          label={t("Whole machine")}
          value={filters.dedicated}
          options={[["true", t("Can be rented whole")]]}
          onChange={(v) => set({ dedicated: v as TFilters["dedicated"] })}
        />
        <Pick
          label={t("Age")}
          value={filters.newArrivals}
          options={[["true", t("New arrivals only")]]}
          onChange={(v) => set({ newArrivals: v as TFilters["newArrivals"] })}
        />
        <Input
          aria-label={t("Country code")}
          placeholder={t("Country (e.g. DE)")}
          maxLength={2}
          dir="ltr"
          className="h-8 w-36 text-[13px] uppercase"
          value={filters.country ?? ""}
          onChange={(e) =>
            set({
              country:
                e.target.value.length === 2
                  ? e.target.value.toUpperCase()
                  : undefined,
            })
          }
        />
        <Min
          label={t("Min rating")}
          value={filters.minRating}
          onChange={(minRating) => set({ minRating })}
        />
        <Min
          label={t("Max latency (ms)")}
          value={filters.maxRttMs}
          onChange={(maxRttMs) => set({ maxRttMs })}
        />
        <Min
          label={t("Min uptime (%)")}
          step={0.1}
          value={filters.minUptime}
          onChange={(minUptime) => set({ minUptime })}
        />
        <Min
          label={t("Min vCPU")}
          step={0.5}
          value={filters.minVcpu}
          onChange={(minVcpu) => set({ minVcpu })}
        />
        <Min
          label={t("Min memory (GB)")}
          step={0.5}
          value={filters.minMemMb && filters.minMemMb / 1024}
          onChange={(gb) => set({ minMemMb: gb && gb * 1024 })}
        />
        <Min
          label={t("Min disk (GB)")}
          step={5}
          value={filters.minDiskGb}
          onChange={(minDiskGb) => set({ minDiskGb })}
        />
        <Pick
          label={t("Sort")}
          value={filters.sort}
          options={[
            ["rating", t("Best rating")],
            ["price", t("Lowest price")],
            ["uptime", t("Best uptime")],
            ["latency", t("Lowest latency")],
          ]}
          onChange={(sort) => set({ sort: sort as TFilters["sort"] })}
        />
      </Toolbar>

      {!data ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-[10px]" />
          ))}
        </div>
      ) : !data.length ? (
        <EmptyState
          icon={IconBuildingStore}
          title={t("No machine matches.")}
          description={t("Loosen the filters, or look again later.")}
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.map((m) => (
            <MachineCard
              key={m._id}
              machine={m}
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

function MachineCard({
  machine: m,
  onRent,
}: {
  machine: TMarketMachine
  onRent?: () => void
}) {
  const { t } = useTranslation()
  const pct = (n?: number) => (n === undefined ? "—" : `${n.toFixed(2)}%`)
  const facts: [string, React.ReactNode][] = [
    [t("Region"), m.country ?? "—"],
    [t("Latency"), m.rttMs === undefined ? "—" : `${Math.round(m.rttMs)} ms`],
    [t("Uptime 30 / 90 days"), `${pct(m.uptime30d)} / ${pct(m.uptime90d)}`],
    [
      t("Hardware"),
      !m.virtualization
        ? "—"
        : m.virtualization === "none"
          ? t("Bare metal")
          : t("Virtual machine ({{kind}})", { kind: m.virtualization }),
    ],
    [
      t("CPU taken by the host"),
      m.steal === undefined ? "—" : `${(m.steal * 100).toFixed(1)}%`,
    ],
    [
      t("Free"),
      <span dir="ltr" key="free">
        {t("{{cpu}} vCPU · {{mem}} GB · {{disk}} GB", {
          cpu: m.free.cpus,
          mem: gbOfMb(m.free.memMb),
          disk: m.free.diskGb,
        })}
      </span>,
    ],
  ]
  const prices = m.prices.monthly
  return (
    <li className="flex flex-col gap-3 rounded-[10px] border bg-card p-4 text-[13px]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{m.name}</h2>
          <p className="text-xs text-muted-foreground">
            {m.official ? t("Huruf") : (m.owner ?? t("Community"))}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <StatusBadge
            tone={m.official ? "info" : "neutral"}
            label={m.official ? t("Official") : t("Community")}
          />
          {m.newArrival && (
            <StatusBadge
              tone="warning"
              label={t("New arrival · {{count}} days measured", {
                count: m.measuredDays,
              })}
            />
          )}
          {m.yours && <StatusBadge tone="neutral" label={t("Yours")} />}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono tabular-nums">
          {m.rating === undefined ? t("Not measured yet") : `${m.rating} / 100`}
        </span>
        {m.tier && <StatusBadge tone="info" label={t(m.tier)} />}
        {m.disk && <StatusBadge tone="neutral" label={m.disk} />}
        {m.dedicated && (
          <StatusBadge tone="success" label={t("Can be rented whole")} />
        )}
        {m.renters && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <IconStarFilled className="size-3.5 text-brand-text" aria-hidden />
            {t("{{stars}} from {{count}} renters", {
              stars: m.renters.stars,
              count: m.renters.count,
            })}
          </span>
        )}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {facts.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 text-end tabular-nums">{value}</dd>
          </React.Fragment>
        ))}
      </dl>
      <p dir="ltr" className="text-xs text-muted-foreground tabular-nums">
        {t(
          "{{cpu}} per vCPU · {{mem}} per GB memory · {{disk}} per GB disk, a month",
          {
            cpu: money(prices.vcpu, "usd"),
            mem: money(prices.memGb, "usd"),
            disk: money(prices.diskGb, "usd"),
          }
        )}
        {prices.whole !== undefined &&
          ` · ${t("whole: {{price}} a month", {
            price: money(prices.whole, "usd"),
          })}`}
      </p>
      {!m.official && (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-foreground">
          {t(
            "The owner of this machine can access your data. If the hardware fails, data on it is lost."
          )}
        </p>
      )}
      {onRent && (
        <Button size="sm" className="mt-auto self-start" onClick={onRent}>
          {t("Rent")}
        </Button>
      )}
    </li>
  )
}
