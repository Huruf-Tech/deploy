import type { TLayoutsOverride } from "@/core/types"

/**
 * Your own layouts, keyed by the name you put in `VITE_APP_LAYOUT`.
 *
 * Each value loads a layout rather than being one, so only the layout actually
 * selected ends up in the bundle. The body must be a literal
 * `import("...")` -- a bundler cannot split a path it has to compute at runtime.
 *
 * A name registered here wins over a built-in of the same name, so you can take
 * over `navbar` without renaming it across your env files.
 */
export const layouts: TLayoutsOverride = {
  // The console shell (docs/DESIGN.md §4) replaces core's navbar.
  navbar: () => import("@/layouts/console"),
}
