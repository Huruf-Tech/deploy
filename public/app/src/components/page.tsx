import { Container } from "@/core/custom/Container"
import { cn } from "@/lib/utils"

/**
 * A custom page's root. The layout's <main> clips its content (core list
 * pages bring their own scroll area), so a page scrolls inside this.
 */
export function Page({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <Container
        className={cn("max-w-[1600px] px-4 pb-6 md:px-6", className)}
        {...props}
      />
    </div>
  )
}
