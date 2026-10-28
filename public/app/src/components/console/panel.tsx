import { cn } from "@/lib/utils"

/** A bordered surface with an optional header. Use instead of ad-hoc Cards. */
export function Panel({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  bodyClassName?: string
}) {
  return (
    <section
      className={cn("min-w-0 rounded-[10px] border bg-card", className)}
      {...props}
    >
      {(title || actions) && (
        <header className="flex min-h-11 items-center gap-3 border-b px-4 py-2">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="truncate text-sm font-semibold">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-pretty text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  )
}
