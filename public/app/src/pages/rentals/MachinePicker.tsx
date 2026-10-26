import { useTranslation } from "react-i18next"

import { StatusBadge } from "@/components/console/status"
import { cn } from "@/lib/utils"
import { type TMachineSpot, usable } from "./rental"

/** Pool machines a rental can go to, with why the others can't (PLAN §26.7). */
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
      aria-label={t("Pool machine")}
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
          <span
            dir="ltr"
            className="text-xs text-muted-foreground tabular-nums"
          >
            {t("{{mem}} GB · {{disk}} GB · {{cpu}} vCPU free", {
              mem: Math.round((m.free.memMb / 1024) * 10) / 10,
              disk: m.free.diskGb,
              cpu: m.cpuRoom,
            })}
          </span>
          {!m.fits ? (
            <StatusBadge tone="neutral" label={t("No room")} />
          ) : m.remainderShort ? (
            <span className="basis-full text-xs text-warning-foreground">
              {t(
                "Huruf's partition there uses {{mb}} MB: free memory there first",
                { mb: m.remainderUsesMb }
              )}
            </span>
          ) : m.reachable === false ? (
            <span className="basis-full text-xs text-warning-foreground">
              {t("Not reachable from this machine over the private network")}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
