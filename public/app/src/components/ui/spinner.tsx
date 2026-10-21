import type React from "react"
import { cn } from "@/lib/utils"
import { IconLoader } from "@tabler/icons-react"

export function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof IconLoader>): React.ReactElement {
  return (
    <IconLoader
      aria-label="Loading"
      className={cn("animate-spin", className)}
      role="status"
      {...props}
    />
  )
}
