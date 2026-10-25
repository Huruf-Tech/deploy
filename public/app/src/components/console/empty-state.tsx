import type { TablerIcon } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

/** Icon, one sentence, one action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: TablerIcon
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-[10px] border border-dashed px-6 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <span className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
          <Icon aria-hidden className="size-5" />
        </span>
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="max-w-sm text-[13px] text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
