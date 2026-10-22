import React from "react"
import { Link, useLocation } from "react-router"
import { IconAlertCircle, IconDots } from "@tabler/icons-react"
import { motion, useReducedMotion } from "motion/react"
import { useTranslation } from "react-i18next"

import { useLayout } from "@/core/layouts/layout-provider"
import { getNavRoutes } from "@/core/lib/utils"
import { SPRING_LAYOUT } from "@/core/lib/ease"
import { cn } from "@/lib/utils"
import { MoreSheet } from "../mobile/more-sheet"
import type { TNav } from "../shared/sub-nav"

/** Tabs shown before the "More" slot. Five slots total is the native ceiling. */
const MAX_TABS = 4

/** One slot, shaped the same whether it navigates or opens the sheet. */
const slotClass =
  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-[color,transform] duration-100 ease-out active:scale-95"

function Slot({
  item,
  active,
  flat,
}: {
  item: Pick<TNav, "title" | "icon" | "button">
  active: boolean
  /** Reduced motion: the indicator cross-fades in place instead of gliding. */
  flat: boolean
}) {
  const { t } = useTranslation()
  const Icon = item.icon ?? IconAlertCircle
  const ActionButton = item.button

  return (
    <React.Fragment>
      {active && (
        <motion.span
          layoutId={flat ? undefined : "native-tab-indicator"}
          transition={flat ? { duration: 0 } : SPRING_LAYOUT}
          className="absolute inset-0 -z-10 rounded-2xl bg-primary/10"
        />
      )}

      <span className="relative flex items-center justify-center">
        <Icon
          className={cn("size-[22px] shrink-0", active && "stroke-[2.2]")}
        />
        {ActionButton && <ActionButton />}
      </span>

      {/*
        Tracking opens up slightly at this size: 11px type set at 0 reads
        cramped, and the labels are the only wayfinding the bar offers.
      */}
      <span className="max-w-full truncate text-[11px] leading-none font-medium tracking-[0.01em]">
        {t(item.title)}
      </span>
    </React.Fragment>
  )
}

export function TabBar({ className }: { className?: string }) {
  const { router } = useLayout()
  const location = useLocation()
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()

  const { routes } = React.useMemo(
    () => getNavRoutes(router.routes),
    [router.routes]
  )

  const { primary, overflow } = React.useMemo(
    () => ({
      primary: routes.slice(0, MAX_TABS),
      overflow: routes.slice(MAX_TABS),
    }),
    [routes]
  )

  const activeParent = React.useMemo(() => {
    const [, parent] = location.pathname.split("/").filter(Boolean)
    return parent
  }, [location.pathname])

  const moreActive = React.useMemo(
    () => overflow.some((item) => item.path && item.path === activeParent),
    [overflow, activeParent]
  )

  return (
    /*
      A floating translucent layer rather than an opaque strip: content keeps
      scrolling underneath it, which is what makes the bar read as glass sitting
      over the page instead of a band cut out of it.

      The bottom margin takes the larger of the home-indicator inset and a small
      floor, so the bar clears the indicator on a notched phone and still sits
      off the very bottom edge everywhere else.
    */
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mx-auto mb-[max(0.75rem,var(--spacing-safe-b))] w-[calc(100%-1.5rem)] max-w-md",
        //! The bright edge is light catching the top of the material, which is
        //! why it is white rather than `--border` -- and why it is dimmer in
        //! dark mode, where there is less light to catch.
        "rounded-[1.75rem] border border-white/50 glass shadow-lg shadow-black/5",
        "dark:border-white/10 dark:shadow-black/40",
        className
      )}
    >
      <div className="flex items-stretch gap-1 p-1.5">
        {primary.map((item) => {
          const active = !!item.path && activeParent === item.path

          return (
            <Link
              key={item.title}
              to={item.path || "#"}
              viewTransition={!item.path?.startsWith("#")}
              aria-current={active ? "page" : undefined}
              className={cn(
                slotClass,
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Slot item={item} active={active} flat={!!prefersReducedMotion} />
            </Link>
          )
        })}

        <MoreSheet
          overflowItems={overflow}
          activeParent={activeParent}
          trigger={
            <button
              type="button"
              aria-label={t("More")}
              className={cn(
                slotClass,
                moreActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Slot
                item={{ title: "More", icon: IconDots }}
                active={moreActive}
                flat={!!prefersReducedMotion}
              />
            </button>
          }
        />
      </div>
    </nav>
  )
}
