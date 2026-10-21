/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import type { TField } from "@/core/lib/jsonSchemaToFields"
import { FilterSelector } from "./components/filter-selector"
import { ActiveFilters } from "./components/active-filters"
import { FilterActions } from "./components/filter-actions"
import {
  IconCalendar,
  IconCircleDashed,
  IconH1,
  IconLink,
  IconMail,
  IconNumber,
  IconSquareCheck,
  type TablerIcon,
} from "@tabler/icons-react"

export type TValue = { value: any; operator: string }
export type TFilterValue = Record<string, TValue>

export type TFilter = {
  filters?: TFilterValue
  fields: TField[]
  onChange: (value?: TFilterValue) => void
  children?: React.ReactNode
  multiLiner?: boolean
}

export function filterIcon(field: TField): TablerIcon {
  if (field.enum) return IconCircleDashed

  switch (field.type) {
    case "text":
    default:
      return IconH1
    case "url":
      return IconLink
    case "date":
      return IconCalendar
    case "email":
      return IconMail
    case "boolean":
      return IconSquareCheck
    case "number":
      return IconNumber
  }
}

const FiltersContext = React.createContext<{
  fields: TField[]
  filters?: TFilterValue
  onChange: (value?: TFilterValue) => void
} | null>(null)

export function useFilters() {
  const context = React.useContext(FiltersContext)

  if (!context) {
    throw new Error("useFilters must be used within FiltersProvider")
  }

  return context
}

export function Filters({ filters, fields, onChange, multiLiner }: TFilter) {
  if (!fields.length) return <></>
  
  return (
    <FiltersContext.Provider value={{ filters, fields, onChange }}>
      <div className="flex min-w-0 grow items-center gap-2">
        <div
          className={
            multiLiner
              ? "flex flex-col gap-2"
              : "flex min-w-0 flex-1 items-center gap-2"
          }
        >
          <div className="flex min-w-0 items-center gap-2">
            <FilterSelector />
            <FilterActions
              hasFilters={!!filters}
              onClick={() => onChange(undefined)}
            />
          </div>
          <div
            className={
              multiLiner
                ? "flex flex-col gap-2"
                : "no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scroll-mask-x"
            }
          >
            <ActiveFilters fields={fields} />
          </div>
        </div>
      </div>
    </FiltersContext.Provider>
  )
}
