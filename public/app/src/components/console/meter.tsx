import { cn } from "@/lib/utils"
import { HUES, type THue, type TLevel } from "@/lib/hues"

/**
 * A labelled bar. The fill wears the resource's hue while fine and turns
 * warning / danger past the thresholds (fractions of `total`), unless `level`
 * is given.
 */
export function Meter({
  label,
  value,
  total,
  text,
  hue = "sky",
  level,
  warnAt = 0.8,
  critAt = 0.95,
  className,
}: {
  label: string
  value: number
  total: number
  text: string
  hue?: THue
  level?: TLevel
  warnAt?: number
  critAt?: number
  className?: string
}) {
  const ratio = total ? Math.min(1, value / total) : 0
  const lvl: TLevel =
    level ?? (ratio >= critAt ? "critical" : ratio >= warnAt ? "warning" : "ok")
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex justify-between gap-2 text-xs">
        <span className="truncate text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-mono tabular-nums",
            lvl === "critical" && "text-destructive-foreground",
            lvl === "warning" && "text-warning-foreground"
          )}
        >
          {text}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={Math.round(total * 100) / 100}
        aria-valuenow={Math.round(value * 100) / 100}
        aria-valuetext={text}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            "h-full rounded-full",
            lvl === "critical"
              ? "bg-destructive"
              : lvl === "warning"
                ? "bg-warning"
                : HUES[hue].bar
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  )
}
