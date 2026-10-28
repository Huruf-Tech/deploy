import { useTranslation } from "react-i18next"

import { StatusBadge } from "@/components/console/status"
import { gbOfMb } from "@/lib/format"
import { money } from "@/lib/plans"
import { cn } from "@/lib/utils"
import { type TMachineSpot, usable } from "./rental"

/** Machines a rental can go to, with why the others can't (PLAN §26.7). */
export function MachinePicker({
  machines,
  pick,
  onPick,
}: {
  machines: TMachineSpot[]
  pick?: string
  onPick: (server: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div
      role="radiogroup"
      aria-label={t("Machine")}
      className="flex flex-col gap-2"
    >
      {machines.map((m) => (
        <button
          key={m.server}
          type="button"
          role="radio"
          aria-checked={pick === m.server}
          disabled={!usable(m)}
          onClick={() => onPick(m.server)}
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-start text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
            pick === m.server && "border-primary bg-primary/5"
          )}
        >
          <span className="font-medium">{m.name}</span>
          {m.free && (
            <span
              dir="ltr"
              className="text-xs text-muted-foreground tabular-nums"
            >
              {t("{{mem}} GB · {{disk}} GB · {{cpu}} vCPU free", {
                mem: gbOfMb(m.free.memMb),
                disk: m.free.diskGb,
                cpu: m.cpuRoom,
              })}
            </span>
          )}
          {m.price !== undefined && (
            <span dir="ltr" className="text-xs font-medium tabular-nums">
              {t("{{price}} a month", { price: money(m.price, "usd") })}
            </span>
          )}
          {!m.fits ? (
            <StatusBadge tone="neutral" label={t("No room")} />
          ) : m.reachable === false ? (
            <span className="basis-full text-xs text-warning-foreground">
              {t(
                "The machine it's on can't be reached: it has no address, and tunnels aren't set up"
              )}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
