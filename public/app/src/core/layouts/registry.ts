/**
 * Layout registry.
 *
 * Two registries, deliberately: this one holds the layouts that ship with
 * Thunder UI, and `src/overrides/layouts.ts` holds the project's own. Keeping
 * them apart is what lets `src/core/` be replaced wholesale on
 * `generate:app --forceSync` without taking a project's layouts with it.
 *
 * A registry maps a name -- the value `VITE_APP_LAYOUT` is set to -- onto a
 * function that *loads* the layout, not the layout itself. That indirection is
 * the whole point: the four built-in layouts used to be imported statically
 * here, so every app shipped all four, plus everything they drag in (the wallet
 * widget, both notification surfaces, the sidebar primitives), to render one.
 * Behind a loader each becomes its own chunk and only the selected one is ever
 * requested.
 */
import type React from "react"

/** The only thing a layout has to be: a component that renders its children. */
export type TLayoutComponent = React.ComponentType<{
  children: React.ReactNode
}>

/**
 * A module that holds a layout.
 *
 * The built-ins export a named `Layout`; `default` is accepted as well, because
 * that is what most people reach for in a file of their own. A module with
 * neither is a registration error and says so at load time.
 */
export type TLayoutModule = {
  Layout?: TLayoutComponent
  default?: TLayoutComponent
}

/**
 * Loads one layout.
 *
 * The body has to be a literal `import("...")` with a static path. A bundler
 * can only split what it can see, and it cannot see
 * `import(someVariable)` -- that compiles to a runtime lookup over every
 * possible match, which is the opposite of the point.
 */
export type TLayoutLoader = () => Promise<TLayoutModule>

export type TLayoutRegistry = Record<string, TLayoutLoader>

/** The layouts that ship with Thunder UI. Core-owned: replaced on every sync. */
export const coreLayouts = {
  navbar: () => import("./navbar"),
  sidebar: () => import("./sidebar"),
  mobile: () => import("./mobile"),
  native: () => import("./native"),
} satisfies TLayoutRegistry

export type TCoreLayoutName = keyof typeof coreLayouts
