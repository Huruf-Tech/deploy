import * as React from "react"

import { use } from "@/core/hooks/use"
import type { TQuery } from "@/lib/queries"

/**
 * Reads a query from `@/lib/queries`. The SDK keeps its copy in localStorage
 * with no expiry: that copy shows at once, and a fresh one is fetched when the
 * component mounts (and when the query changes), so nothing stays stale
 * across reloads. `reload` (stable) refetches it and the queries under its key.
 */
export function useCached<T>(query: TQuery<T>) {
  const { data, isLoading, error } = use(query)
  React.useEffect(() => {
    query.invalidate({ stopPropagation: true }).catch(() => {})
  }, [query])
  const reload = React.useCallback(() => query.invalidate(), [query])
  return { data, isLoading, error, reload }
}
