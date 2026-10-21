// css-vars.ts
import * as React from "react"

type CssVarTarget = HTMLElement | SVGElement

const listeners = new Set<() => void>()

let target: CssVarTarget | null = null

function getTarget() {
    if (typeof document === "undefined") return null
    return target ?? document.documentElement
}

function notify() {
    listeners.forEach((listener) => listener())
}

export function configureCssVars(options?: {
    target?: CssVarTarget
}) {
    target = options?.target ?? null
    notify()
}

export function getCssVar(
    name: `--${string}`,
    fallback = "",
    element?: CssVarTarget,
) {
    if (typeof window === "undefined") return fallback

    const targetElement = element ?? getTarget()

    if (!targetElement) return fallback

    const value = getComputedStyle(targetElement)
        .getPropertyValue(name)
        .trim()

    return value || fallback
}

export function setCssVar(
    name: `--${string}`,
    value: string,
    element?: CssVarTarget,
) {
    if (typeof document === "undefined") return

    const targetElement = element ?? getTarget()

    if (!targetElement) return

    targetElement.style.setProperty(name, value)
    notify()
}

export function removeCssVar(
    name: `--${string}`,
    element?: CssVarTarget,
) {
    if (typeof document === "undefined") return

    const targetElement = element ?? getTarget()

    if (!targetElement) return

    targetElement.style.removeProperty(name)
    notify()
}

export function subscribeCssVars(listener: () => void) {
    listeners.add(listener)

    return () => {
        listeners.delete(listener)
    }
}

export function refreshCssVars() {
    notify()
}

export function useCssVar(
  name: `--${string}`,
  options?: {
    fallback?: string
    target?: HTMLElement | null
    watchTheme?: boolean
  },
) {
  const { fallback = "", target = null, watchTheme = true } = options ?? {}

  const [value, setValue] = React.useState(fallback)

  const read = React.useCallback(() => {
    if (typeof window === "undefined") return

    const element = target ?? document.documentElement

    const nextValue = getComputedStyle(element)
      .getPropertyValue(name)
      .trim()

    setValue(nextValue || fallback)
  }, [name, fallback, target])

  React.useLayoutEffect(() => {
    read()

    if (!watchTheme) return

    const observer = new MutationObserver(() => {
      read()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    })

    return () => observer.disconnect()
  }, [read, watchTheme])

  return value
}