import { StatusDot, type TTone } from "./status"
import { cn } from "@/lib/utils"

export type TTimelineItem = {
  id: string
  label: React.ReactNode
  time?: React.ReactNode
  state?: string
  tone?: TTone
  details?: React.ReactNode
}

/** Deployment and event history: dot, label, time, details on expand. */
export function Timeline({
  items,
  className,
}: {
  items: TTimelineItem[]
  className?: string
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {items.map((item, i) => {
        const head = (
          <>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.time && (
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {item.time}
              </span>
            )}
          </>
        )
        return (
          <li key={item.id} className="relative flex gap-3 pb-3 last:pb-0">
            {i < items.length - 1 && (
              <span
                aria-hidden
                className="absolute start-[3.5px] top-4 bottom-0 w-px bg-border"
              />
            )}
            <StatusDot state={item.state} tone={item.tone} className="mt-1.5" />
            <div className="min-w-0 flex-1 text-[13px]">
              {item.details ? (
                <details>
                  <summary className="flex cursor-pointer list-none items-baseline gap-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {head}
                  </summary>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {item.details}
                  </div>
                </details>
              ) : (
                <div className="flex items-baseline gap-2">{head}</div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
