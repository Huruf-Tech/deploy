import React from "react"
import { Link, useLocation } from "react-router"
import {
  IconAlertCircle,
  IconChevronRight,
  IconMoon,
  IconSun,
} from "@tabler/icons-react"
import { motion, useReducedMotion } from "motion/react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/components/theme-provider"
import { use } from "@/core/hooks/use"
import { appName, getInitials, transformImage } from "@/core/lib/utils"
import { SPRING_LAYOUT } from "@/core/lib/ease"
import { cn } from "@/lib/utils"
import { MoreSheet } from "../mobile/more-sheet"
import type { TNav } from "../shared/sub-nav"

/**
 * The pointer-precise half of the layout: the same destinations the tab bar
 * holds, laid out as a persistent sidebar once there is room for one. Nothing
 * is hidden behind a toggle, because on this size class there is no reason to
 * hide it.
 */
export function SideRail({ items }: { items: TNav[] }) {
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const prefersReducedMotion = useReducedMotion()

  const isRtl = i18n.language === "ar"

  const activeParent = React.useMemo(() => {
    const [, parent] = location.pathname.split("/").filter(Boolean)
    return parent
  }, [location.pathname])

  const _me = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return await ThunderSDK.me.get({ signal })
    },
    []
  )

  const { data: me } = use(_me)

  const logoSrc = `${import.meta.env.BASE_URL}${
    resolvedTheme === "dark" ? "logo-dark.png" : "logo-light.png"
  }`

  return (
    /*
      A heavier material than the toolbar above the content: Apple's rule is
      that darker, thicker surfaces separate structural regions while lighter
      ones draw the eye to controls. The rail is structure, so it sits back.
    */
    <aside className="hidden w-64 shrink-0 flex-col border-e border-border bg-muted/40 ps-safe-l md:flex">
      <div className="flex h-16 items-center gap-2.5 px-4">
        <img src={logoSrc} alt="" className="h-6 w-auto" aria-hidden />
        {/* Tightened tracking: the app name is the largest type in the rail. */}
        <span className="truncate font-heading text-[15px] font-semibold tracking-[-0.01em]">
          {appName()}
        </span>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-2 py-2">
        {items.map((item) => {
          const active = !!item.path && activeParent === item.path
          const Icon = item.icon ?? IconAlertCircle
          const ActionButton = item.button

          return (
            <Link
              key={item.title}
              to={item.path || "#"}
              viewTransition={!item.path?.startsWith("#")}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
                "transition-[color,transform] duration-100 ease-out active:scale-[0.98]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId={
                    prefersReducedMotion ? undefined : "native-rail-indicator"
                  }
                  transition={
                    prefersReducedMotion ? { duration: 0 } : SPRING_LAYOUT
                  }
                  className="absolute inset-0 -z-10 rounded-xl bg-primary/10"
                />
              )}

              <span className="relative flex items-center justify-center">
                <Icon className="size-[18px] shrink-0" />
                {ActionButton && <ActionButton />}
              </span>

              <span className="truncate">{t(item.title)}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border p-2 pb-[max(0.5rem,var(--spacing-safe-b))]">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-[color,transform] duration-100 ease-out hover:text-foreground active:scale-[0.98]"
        >
          {resolvedTheme === "dark" ? (
            <IconSun className="size-[18px] shrink-0" />
          ) : (
            <IconMoon className="size-[18px] shrink-0" />
          )}
          <span className="truncate">{t("Toggle theme")}</span>
        </button>

        {/*
          Same sheet the tab bar's "More" slot opens, with no overflow routes to
          show -- on this size class every route is already in the rail, so only
          the account actions are left. It enters from the rail's own edge, so
          it reads as coming out of the thing that opened it.
        */}
        <MoreSheet
          overflowItems={[]}
          activeParent={activeParent}
          side={isRtl ? "right" : "left"}
          trigger={
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-start transition-[background-color,transform] duration-100 ease-out hover:bg-accent active:scale-[0.98]"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={transformImage(me?.image)} alt={me?.name} />
                <AvatarFallback className="rounded-lg text-xs">
                  {getInitials(me?.name)}
                </AvatarFallback>
              </Avatar>

              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-sm font-medium">
                  {me?.name ?? t("Unnamed")}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {me?.email ?? t("N/A")}
                </span>
              </span>

              <IconChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            </button>
          }
        />
      </div>
    </aside>
  )
}
