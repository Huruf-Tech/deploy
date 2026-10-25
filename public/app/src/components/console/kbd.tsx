import { cn } from "@/lib/utils"

/** A keyboard hint, e.g. ⌘K. */
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
