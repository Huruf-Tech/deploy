import { cn } from "@/lib/utils"
import { HUES, type THue, type TLevel } from "@/lib/hues"

const round = (n: number) => Math.round(n * 100) / 100

/**
 * A usage bar with its value as text, never color alone (DESIGN §5). The
 * fill wears the resource's hue while fine and turns warning / danger past
 * the thresholds (fractions of `total`), unless `level` is given.
 * `layout`: `stacked` (label and value above the bar), `row` (label, bar and
 * value on one line, for cards) or `compact` (bar and value, for table cells
 * whose header names the resource; `label` is still its accessible name).
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
  layout = "stacked",
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
  layout?: "stacked" | "row" | "compact"
  className?: string
}) {
  const max = total > 0 ? total : 0
  const now = Math.min(Math.max(value, 0), max)
  const ratio = max ? now / max : 0
  const lvl: TLevel =
    level ?? (ratio >= critAt ? "critical" : ratio >= warnAt ? "warning" : "ok")
  const bar = (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={round(max)}
      aria-valuenow={round(now)}
      aria-valuetext={text}
      className="h-1.5 w-full min-w-12 overflow-hidden rounded-full bg-muted"
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
  )
  // The meter announces label and value; the visible copies are for sight.
  const valueText = (
    <span
      aria-hidden
      className={cn(
        "font-mono tabular-nums",
        lvl === "critical" && "text-destructive-foreground",
        lvl === "warning" && "text-warning-foreground"
      )}
    >
      {text}
    </span>
  )
  const labelText = (
    <span aria-hidden className="truncate text-muted-foreground">
      {label}
    </span>
  )

  if (layout === "stacked")
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex justify-between gap-2 text-xs">
          {labelText}
          {valueText}
        </div>
        {bar}
      </div>
    )
  return (
    <div
      className={cn(
        "grid items-center text-xs [&>span:last-child]:text-end",
        layout === "row"
          ? "grid-cols-[4rem_1fr_auto] gap-3 [&>span:last-child]:min-w-24"
          : "grid-cols-[1fr_auto] gap-2 [&>span:last-child]:min-w-10",
        className
      )}
    >
      {layout === "row" && labelText}
      {bar}
      {valueText}
    </div>
  )
}
