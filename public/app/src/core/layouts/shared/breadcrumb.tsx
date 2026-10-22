import { Link, useLocation } from "react-router"
import {
  Breadcrumb as _Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from "react"
import { IconBrandGoogleHome } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { useLayout } from "@/core/layouts/layout-provider"
import type { TRouteObject } from "@/core/router"

type TBreadcrumbState = {
  name?: string
}

/**
 * Walks the route tree and builds a map of static path segment -> route name.
 * Dynamic segments (":id", ":tenant", etc.) are skipped since they don't
 * carry a translatable name.
 */
function buildSegmentNameMap(routes: TRouteObject[]): Record<string, string> {
  const map: Record<string, string> = {}

  const walk = (nodes: TRouteObject[]) => {
    nodes.forEach((node) => {
      if (node.path && !node.path.startsWith(":") && node.name) {
        // route.path can itself contain nested segments, only take the last one
        const segment = node.path.split("/").filter(Boolean).at(-1)
        if (segment) map[segment] = node.name
      }
      if (node.children) walk(node.children as TRouteObject[])
    })
  }

  walk(routes)
  return map
}

export type TBreadcrumbCallback = (
  segment: string,
  context: {
    pathname: string
    isLast: boolean
    defaultLabel: string
  }
) => string | null | undefined

export interface BreadcrumbProps {
  className?: string
  /**
   * Optional callback to customize or dynamically compute breadcrumb labels.
   * Return a custom label string, or null/undefined to use the default label.
   */
  resolveLabel?: TBreadcrumbCallback
  /** @deprecated Alias of `resolveLabel`, kept for backwards compatibility. */
  customTitleCallback?: TBreadcrumbCallback
}

/**
 * Sets a custom text or dynamic value in the breadcrumb from any page or component.
 */
export function setBreadcrumbTitle(title: string | null) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("breadcrumb-title", { detail: title }))
  }
}

/**
 * Hook to set custom text or dynamic value in the breadcrumb from page components.
 * Automatically cleans up when the component unmounts or title changes.
 */
/** @deprecated Alias of `setBreadcrumbTitle`, kept for backwards compatibility. */
export const setBreadcrumb = setBreadcrumbTitle

/**
 * Hook to set custom text or dynamic value in the breadcrumb from page components.
 * Automatically cleans up when the component unmounts or title changes.
 */
export function useBreadcrumbTitle(title?: string | null) {
  React.useEffect(() => {
    if (title !== undefined) {
      setBreadcrumbTitle(title)
    }
    return () => {
      setBreadcrumbTitle(null)
    }
  }, [title])

  return { setTitle: setBreadcrumbTitle, setBreadcrumb: setBreadcrumbTitle }
}

/** @deprecated Alias of `useBreadcrumbTitle`, kept for backwards compatibility. */
export const useBreadcrumb = useBreadcrumbTitle

export function Breadcrumb({
  className,
  resolveLabel,
  customTitleCallback,
}: BreadcrumbProps = {}) {
  const location = useLocation()
  const { router } = useLayout()
  const { t } = useTranslation()

  const parts = React.useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const segmentNameMap = React.useMemo(
    () => buildSegmentNameMap(router.routes as TRouteObject[]),
    [router.routes]
  )

  const [dynamicTitle, setDynamicTitle] = React.useState<string | null>(null)

  React.useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string | null>
      setDynamicTitle(customEvent.detail ?? null)
    }
    window.addEventListener("breadcrumb-title", handler)
    return () => window.removeEventListener("breadcrumb-title", handler)
  }, [])

  React.useEffect(() => {
    setDynamicTitle(null)
  }, [location.pathname])

  if (parts.length <= 1) return null
  const state = location.state as TBreadcrumbState | null

  const callback = resolveLabel ?? customTitleCallback
  const lastPart = parts.at(-1)!
  const defaultLabel = t(segmentNameMap[lastPart] ?? lastPart)

  const customLastLabel = callback?.(lastPart, {
    pathname: location.pathname,
    isLast: true,
    defaultLabel,
  })

  const lastLabel =
    dynamicTitle ||
    customLastLabel ||
    (state?.name ? t(state.name) : defaultLabel)

  const crumbs = parts.slice(0, -1)

  return (
    <_Breadcrumb
      className={
        className ??
        "no-scrollbar max-w-full min-w-0 overflow-x-auto scroll-mask-x-from-90%"
      }
    >
      <BreadcrumbList className="flex-nowrap whitespace-nowrap">
        {crumbs.map((crumb, index) => {
          const to = "/" + parts.slice(0, index + 1).join("/")
          const crumbDefaultLabel =
            index === 0 ? null : t(segmentNameMap[crumb] ?? crumb)
          const customCrumbLabel =
            index === 0
              ? null
              : callback?.(crumb, {
                  pathname: to,
                  isLast: false,
                  defaultLabel: crumbDefaultLabel ?? crumb,
                })

          return (
            <React.Fragment key={to}>
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link to={to} replace viewTransition />}
                >
                  {index === 0 ? (
                    <IconBrandGoogleHome className="size-4" />
                  ) : (
                    customCrumbLabel || crumbDefaultLabel
                  )}
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />
            </React.Fragment>
          )
        })}

        <BreadcrumbItem>
          <BreadcrumbPage>{lastLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </_Breadcrumb>
  )
}
