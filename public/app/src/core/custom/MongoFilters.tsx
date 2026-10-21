import React from "react"
import type { TFilters } from "thunder-sdk/types"
import { ThunderSDK } from "thunder-sdk"
import { Filters as _Filters } from "../crud/filters"
import type { TField } from "../lib/jsonSchemaToFields"
import { columnFromModuleMetadata } from "../crud/ListPage"

import { filterToMongo } from "../crud/filters/lib/filterToMongo"
import { mongoToFilter } from "../crud/filters/lib/mongoToFilter"

export type TFiltersProps = {
  schema: string
  filters?: TFilters
  onChange?: (value?: TFilters) => void
}

export function MongoFilters({ schema, filters, onChange }: TFiltersProps) {
  const metadata = React.useMemo(() => ThunderSDK.getMetadata(schema), [schema])
  const [fields, setFields] = React.useState<TField[]>([])
  const [revertMap] = React.useState(new Map())

  React.useEffect(() => {
    ;(async () => {
      setFields(await columnFromModuleMetadata(metadata, false))
      setFields(await columnFromModuleMetadata(metadata, true))
    })()
  }, [metadata])

  return (
    <_Filters
      multiLiner
      fields={fields}
      filters={filters ? mongoToFilter(filters, revertMap) : undefined}
      onChange={(_filters) => {
        const filters = _filters
          ? filterToMongo(_filters, {
              revertMap,
              typeResolver: (key) => {
                const field = fields.find((v) => v.name === key)

                return field?.ref ? "objectId" : undefined
              },
            })
          : undefined

        onChange?.(filters)
      }}
    />
  )
}
