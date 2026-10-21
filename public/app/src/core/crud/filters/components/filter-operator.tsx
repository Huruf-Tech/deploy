import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { TField } from "@/core/lib/jsonSchemaToFields"
import { getDefaultOperator, getOperator } from "../lib/operators"
import { useFilters, type TValue } from ".."
import React from "react"

// Renders the filter operator display and menu for a given column filter
// The filter operator display is the label and icon for the filter operator
// The filter operator menu is the dropdown menu for the filter operator
export function FilterOperator({ field }: { field: TField }) {
  const { filters, onChange } = useFilters()

  const filter = filters?.[field.name!]

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="m-0 h-full w-fit rounded-none p-0 px-2 text-xs whitespace-nowrap"
          >
            <FilterOperatorDisplay filter={filter} field={field} />
          </Button>
        }
      ></PopoverTrigger>
      <PopoverContent align="start" className="w-fit p-0!">
        <Command loop>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandList className="max-h-fit">
            <FilterOperatorController
              field={field}
              filter={filter}
              onChange={(operator) =>
                onChange({
                  ...filters,
                  [field.name!]: { ...filters![field.name!], operator },
                })
              }
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function FilterOperatorDisplay({
  field,
  filter,
}: {
  field: TField
  filter?: TValue
}) {
  const operator = React.useMemo(() => {
    const _operator = getDefaultOperator(field, filter)
    return Object.entries(getOperator(field, filter)).find(
      ([, v]) => v === (filter?.operator ?? _operator)
    )?.[0]
  }, [filter, field])

  return <span className="text-muted-foreground">{operator}</span>
}

export function FilterOperatorController({
  filter,
  field,
  onChange,
}: {
  field: TField
  filter?: TValue
  onChange: (operator: string) => void
}) {
  return (
    <CommandGroup heading={"Operators"}>
      {Object.entries(getOperator(field, filter)).map(([key, value]) => {
        return (
          <CommandItem onSelect={onChange} value={value} key={value}>
            {key}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}
