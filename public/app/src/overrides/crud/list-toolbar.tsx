import type { TListToolbarOverride } from "@/core/types"

export const listToolbar: TListToolbarOverride = {
  // Replace the entire default toolbar (filters, column toggle, create button,
  // view toggle) for a specific module. Your component gets `name` and
  // `isLoading` as props — use hooks for anything else.
  //
  // E.g:
  // orders: ({ name, isLoading }) => (
  //   <div className="flex items-center gap-3">
  //     <MongoFilters schema={name} />
  //     <Button>Import CSV</Button>
  //     <Button>Export</Button>
  //   </div>
  // ),
}
