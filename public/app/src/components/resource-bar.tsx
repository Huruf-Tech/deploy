import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import {
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress"
import { cn } from "@/lib/utils"

/**
 * One usage row: label, slim bar, and the value as text, so the level is
 * never conveyed by colour alone (PLAN §15.4). Turns warning/destructive near full.
 */
export function ResourceBar({
  label,
  used,
  total,
  detail,
}: {
  label: string
  used: number
  total: number
  detail: string
}) {
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0

  return (
    <ProgressPrimitive.Root
      value={percent}
      className="grid grid-cols-[4rem_1fr_auto] items-center gap-3"
    >
      <ProgressLabel className="text-xs font-normal text-muted-foreground">
        {label}
      </ProgressLabel>
      <ProgressTrack className="h-1.5">
        <ProgressIndicator
          className={cn(
            "rounded-full",
            percent >= 90
              ? "bg-destructive"
              : percent >= 75
                ? "bg-warning"
                : "bg-primary"
          )}
        />
      </ProgressTrack>
      <ProgressValue className="ms-0 min-w-24 text-end text-xs text-foreground">
        {() => detail}
      </ProgressValue>
    </ProgressPrimitive.Root>
  )
}
