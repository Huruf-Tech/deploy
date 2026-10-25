import { cn } from "@/lib/utils"

/** Every page starts with this: one h1, status, description, actions, tabs. */
export function PageHeader({
  title,
  status,
  description,
  actions,
  tabs,
  className,
}: {
  title: React.ReactNode
  status?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  tabs?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate font-heading text-xl font-semibold tracking-tight">
              {title}
            </h1>
            {status}
          </div>
          {description && (
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {tabs}
    </header>
  )
}
