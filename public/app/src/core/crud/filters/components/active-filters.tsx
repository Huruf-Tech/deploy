import { Separator } from "@/components/ui/separator"
import { FilterSubject } from "./filter-subject"
import { FilterValue } from "./filter-value"
import { useFilters } from ".."
import type { TField } from "@/core/lib/jsonSchemaToFields"
import { FilterOperator } from "./filter-operator"
import { Button } from "@/components/ui/button"
import { IconX } from "@tabler/icons-react"

interface ActiveFiltersProps {
  fields: TField[]
}

export function ActiveFilters({ fields }: ActiveFiltersProps) {
  const { filters, onChange } = useFilters()

  return (
    <>
      {Object.entries(filters ?? {}).map(([name, filter]) => {
        const field = fields.find((f) => f.name === name)

        // Skip if no filter value
        if (!filter.value && !field) return null

        return (
          <ActiveFilter
            key={`active-filter-${name}`}
            field={field!}
            onRemove={() => {
              const newFilters = { ...filters }
              delete newFilters[name]
              onChange(Object.keys(newFilters).length ? newFilters : undefined)
            }}
          />
        )
      })}
    </>
  )
}

// Generic render function for a filter with type-safe value
export function ActiveFilter({
  field,
  onRemove,
}: {
  field: TField
  onRemove?: () => void
}) {
  return (
    <div className="flex h-7 max-w-fit items-center rounded-2xl border border-border bg-background text-xs shadow-xs">
      <FilterSubject field={field} />
      <Separator orientation="vertical" />
      <FilterOperator field={field} />
      <Separator orientation="vertical" />
      <FilterValue field={field} />
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        className="h-full w-7 rounded-none rounded-r-2xl text-xs"
        onClick={onRemove}
      >
        <IconX className="size-4 -translate-x-0.5" />
      </Button>
    </div>
  )
}
