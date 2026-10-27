import { Link } from "react-router"

import { cn } from "@/lib/utils"

/** A compact KPI for strips of 3–6. */
export function Stat({
  label,
  value,
  hint,
  to,
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  hint?: React.ReactNode
  to?: string
  className?: string
}) {
  const body = (
    <>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 min-w-0">
        <div className="truncate text-xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
        {hint && (
          <div className="truncate text-xs text-muted-foreground">{hint}</div>
        )}
      </div>
    </>
  )
  const cls = cn(
    "block min-w-0 rounded-[10px] border bg-card px-4 py-3",
    to &&
      "transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
    className
  )
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

/** A responsive row of Stats. */
export function StatStrip({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]",
        className
      )}
      {...props}
    />
  )
}
