import React from "react"

import type { TCardProps, TCardsOverride } from "@/core/types"
import { features } from "@/core/lib/features"

/**
 * Card views that ship with the boilerplate, each behind its own feature flag.
 *
 * These used to be written straight into `src/overrides/crud/cards.tsx`, which
 * is the developer's file — so every generated app inherited them and could not
 * tell framework defaults from its own registrations. `ListPage` merges this map
 * under the overrides, so a developer registering the same key still wins.
 *
 *
 * Loaded lazily: the users card view pulls `zod` (275kB), and a static import
 * shipped that to every app even with `VITE_ENABLE_USERS` off, because the flag
 * only gates the registration — not the import. `ListPage` renders `<Cards>`
 * inside a Suspense boundary.
 */
const UserCardView = React.lazy(
  () => import("@/core/pages/users/userCardView")
) as React.ComponentType<TCardProps>

export const builtinCards: TCardsOverride = {
  ...(features.users ? { users: UserCardView } : {}),
}
