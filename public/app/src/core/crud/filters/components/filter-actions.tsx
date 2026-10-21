import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { IconFilterX } from "@tabler/icons-react"

export function FilterActions({
  onClick,
  hasFilters,
}: {
  hasFilters: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="destructive"
      className={cn(!hasFilters && "hidden")}
      onClick={onClick}
    >
      <IconFilterX />
      <span className="hidden md:block">Clear</span>
    </Button>
  )
}
