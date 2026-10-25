import * as React from "react"

import { cn } from "@/lib/utils"
import { HUES, type THue } from "@/lib/hues"

export function IconChip({
  hue,
  icon: Icon,
  className,
}: {
  hue: THue
  icon: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl",
        HUES[hue].chip,
        className
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}

/** A labelled bar; its fill wears the resource's hue, the text stays in ink. */
export function Bar({
  label,
  value,
  total,
  text,
  fill,
}: {
  label: string
  value: number
  total: number
  text: string
  fill: string
}) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{text}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={Math.round(total * 100) / 100}
        aria-valuenow={Math.round(value * 100) / 100}
        aria-valuetext={text}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width]", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
