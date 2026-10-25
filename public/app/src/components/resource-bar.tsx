import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import {
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress"
import { HUES, type THue } from "@/lib/hues"
import { cn } from "@/lib/utils"

/**
 * One usage row: label, slim bar, and the value as text, so the level is
 * never conveyed by colour alone (PLAN §15.4). The bar wears the resource's
 * hue and turns warning/destructive near full (DESIGN §3).
 */
export function ResourceBar({
  label,
  used,
  total,
  detail,
  hue = "sky",
  compact,
}: {
  label: string
  used: number
  total: number
  detail: string
  hue?: THue
  /** Table cells: no label column (the column header says it), narrower value. */
  compact?: boolean
}) {
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0

  return (
    <ProgressPrimitive.Root
      value={percent}
      aria-label={label}
      className={cn(
        "grid items-center gap-2",
        compact ? "grid-cols-[1fr_auto]" : "grid-cols-[4rem_1fr_auto] gap-3"
      )}
    >
      {!compact && (
        <ProgressLabel className="text-xs font-normal text-muted-foreground">
          {label}
        </ProgressLabel>
      )}
      <ProgressTrack className="h-1.5 min-w-12">
        <ProgressIndicator
          className={cn(
            "rounded-full",
            percent >= 90
              ? "bg-destructive"
              : percent >= 75
                ? "bg-warning"
                : HUES[hue].bar
          )}
        />
      </ProgressTrack>
      <ProgressValue
        className={cn(
          "ms-0 text-end font-mono text-xs text-foreground tabular-nums",
          compact ? "min-w-10" : "min-w-24"
        )}
      >
        {() => detail}
      </ProgressValue>
    </ProgressPrimitive.Root>
  )
}
