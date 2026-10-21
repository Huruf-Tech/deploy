import type { TLayoutsOverride } from "@/core/types"

/**
 * Your own layouts, keyed by the name you put in `VITE_APP_LAYOUT`.
 *
 * Each value loads a layout rather than being one, so only the layout actually
 * selected ends up in the bundle. The body must be a literal
 * `import("...")` -- a bundler cannot split a path it has to compute at runtime.
 *
 * A layout is a component that renders `children`. Export it as `default` or as
 * a named `Layout`; either is picked up. Put the file wherever you like outside
 * `src/core/`, which is replaced on every `generate:app --forceSync`.
 *
 * A name registered here wins over a built-in of the same name, so you can take
 * over `navbar` without renaming it across your env files.
 */
export const layouts: TLayoutsOverride = {
  // E.g: compact: () => import("@/layouts/compact")
}
