import { IconSearch } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** One line above a list: search, filters (children), primary action. */
export function Toolbar({
  search,
  onSearch,
  placeholder,
  actions,
  children,
  className,
}: {
  search?: string
  onSearch?: (value: string) => void
  placeholder?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {onSearch && (
        <div className="relative w-full sm:w-64">
          <IconSearch
            aria-hidden
            className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder ?? t("Filter…")}
            aria-label={placeholder ?? t("Filter")}
            className="h-8 ps-8 text-[13px]"
          />
        </div>
      )}
      {children}
      {actions && (
        <div className="ms-auto flex items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
