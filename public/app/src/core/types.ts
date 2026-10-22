import type { TablerIcon } from "@tabler/icons-react"
import type { TRouteObject } from "./router"
import type { TFilters } from "thunder-sdk/types"
import type { TLayoutRegistry } from "./layouts/registry"

export type TCardProps = {
  name: string
  isLoading: boolean
  isRefetching: boolean
  data: unknown[]
  fetcher: (
    projection?: Record<string, 1>,
    sorting?: Record<string, 1 | -1>
  ) => void
  setFilters: React.Dispatch<React.SetStateAction<TFilters | undefined>>
  setProject: React.Dispatch<React.SetStateAction<Record<string, 1 | -1>>>
  setSort: React.Dispatch<React.SetStateAction<Record<string, 1 | -1>>>
  setPage: (page: number) => void
  selectedIds: string[]
  toggleSelect: (id?: string) => void
}

export type TCardsOverride = Record<string, React.ComponentType<TCardProps>>

export type TListPageProps = { group?: string; name: string }

export type TListPagesOverride = Record<
  string,
  React.ComponentType<TListPageProps>
>

/**
 * @deprecated Views receive no props. `data` was always an empty object, which
 * read as though the record had been fetched for you. Read the id from the
 * route with `useParams` and fetch it however you like.
 */
export type TViewProps = Record<string, never>

/** Detail pages, keyed by module name. Mirrors `TFormsOverride`: no props. */
export type TViewsOverride = Record<string, React.ComponentType>

export type TFormsOverride = Record<string, React.ComponentType>

export type TListActionsOverride = Record<string, React.ComponentType>

export type TListToolbarProps = {
  /** The module name (e.g. "orders"). */
  name: string
  /** Whether the list data is still loading. */
  isLoading: boolean
}

export type TListToolbarOverride = Record<
  string,
  React.ComponentType<TListToolbarProps>
>

export type TIconsOverride = Record<string, TablerIcon>

/**
 * Your own layouts, keyed by the name `VITE_APP_LAYOUT` selects. Each value
 * loads a layout rather than being one, so only the selected layout is
 * bundled. See `src/overrides/layouts.ts`.
 */
export type TLayoutsOverride = TLayoutRegistry

export type TRoutesOverride = Record<string, TRouteObject & { merge?: boolean }>

export type TNotification = {
  _id: string
  receiver?: string
  data: {
    imageUrl?: string
    title: string
    body?: string
    html?: string
    type?: string
    message?: string
  }
  tenant: string
  read: boolean
  createdAt: string
  updatedAt: string
  dateGroup?: string
}
