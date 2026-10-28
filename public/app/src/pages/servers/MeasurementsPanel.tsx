import { useTranslation } from "react-i18next"

import { Panel } from "@/components/console/panel"
import { KeyValue, type TKeyValue } from "@/components/console/key-value"
import { StatusBadge } from "@/components/console/status"
import { useCached } from "@/hooks/use-cached"
import { ago } from "@/lib/format"
import { queries } from "@/lib/queries"

const percent = (share?: number, digits = 1) =>
  share === undefined ? "—" : `${(share * 100).toFixed(digits)}%`

/**
 * What's measured of a server (PLAN §29): its latency and uptime, and for a
 * machine its rating, class, disk, and whether it can be rented whole.
 */
export function MeasurementsPanel({
  server,
  machine,
}: {
  server: string
  machine: boolean
}) {
  const { t } = useTranslation()
  const p = useCached(queries.serverProfile(server)).data
  if (!p) return null

  const uptime =
    p.uptime30d === undefined
      ? "—"
      : t("{{d30}} over 30 days · {{d90}} over 90", {
          d30: `${p.uptime30d.toFixed(2)}%`,
          d90: `${(p.uptime90d ?? p.uptime30d).toFixed(2)}%`,
        })
  const items: TKeyValue[] = [
    {
      label: t("Latency"),
      value:
        p.rttMs === undefined
          ? t("Not measured yet")
          : t("{{ms}} ms to the control plane", { ms: Math.round(p.rttMs) }),
    },
    { label: t("Uptime"), value: uptime },
    {
      label: t("Hardware"),
      value: !p.virtualization
        ? "—"
        : p.virtualization === "none"
          ? t("Bare metal")
          : t("Virtual machine ({{kind}})", { kind: p.virtualization }),
    },
    {
      label: t("CPU taken by the host"),
      value: percent(p.steal),
    },
  ]
  if (machine) {
    items.unshift(
      {
        label: t("Rating"),
        value:
          p.rating === undefined ? (
            t("Not measured yet")
          ) : (
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-mono">{p.rating} / 100</span>
              {p.tier && <StatusBadge tone="info" label={t(p.tier)} />}
              {p.disk && <StatusBadge tone="neutral" label={p.disk} />}
            </span>
          ),
      },
      {
        label: t("Rent whole"),
        value: p.dedicated ? (
          <StatusBadge
            tone="success"
            label={t("Yes: nothing else runs on it")}
          />
        ) : (
          t(p.notDedicated ?? "No")
        ),
      },
      {
        label: t("CPU used outside partitions"),
        value: percent(p.hostCpu),
      }
    )
    if (p.benchmarkAt) {
      items.push({ label: t("Measured"), value: ago(p.benchmarkAt) })
    }
  }

  return (
    <Panel
      title={t("Measurements")}
      description={t(
        "Measured by its agent and the control plane, not entered by anyone."
      )}
      bodyClassName="py-1"
    >
      <KeyValue items={items} />
    </Panel>
  )
}
