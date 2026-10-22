import React from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router"
import { IconArrowLeft, IconSettings } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { appName, getNavRoutes } from "@/core/lib/utils"
import { BottomTabs } from "./bottom-tabs"
import { SubNav } from "../shared/sub-nav"
import { useLayout } from "../layout-provider"
import { Container } from "@/core/custom/Container"
import { cn } from "@/lib/utils"
import { ThunderSDK } from "thunder-sdk"
import { use } from "@/core/hooks/use"
import { useUnreadCount } from "@/core/hooks/useUnreadCount"
import { features } from "@/core/lib/features"
import { NotificationSidebar } from "@/core/pages/notifications/notification-sidebar"

/** Flip to true once a `settings` route exists. */
const HAS_SETTINGS_ROUTE = false

export function Layout({ children }: { children: React.ReactNode }) {
  const { router } = useLayout()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()

  const { subRoutes } = React.useMemo(
    () => getNavRoutes(router.routes),
    [router.routes]
  )

  const [tenantId, activeParent] = React.useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const subNavItems = React.useMemo(
    () => subRoutes[activeParent],
    [activeParent, subRoutes]
  )

  const isHome = !activeParent || activeParent === "overview"
  const logoSrc = `${import.meta.env.BASE_URL}${
    resolvedTheme === "dark" ? "logo-dark.png" : "logo-light.png"
  }`

  // Current user
  const _me = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return await ThunderSDK.me.get({ signal })
    },
    []
  )
  const { data: me } = use(_me)

  const {
    count: unreadCount,
    refresh: refreshUnread,
    decrement: decrementUnread,
  } = useUnreadCount(me?._id)

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      <header
        className={cn(
          "sticky top-0 z-40 bg-background/95 pt-safe-t backdrop-blur-sm supports-backdrop-filter:bg-background/80",
          !subNavItems?.length && "border-b border-border"
        )}
      >
        <Container className="relative flex h-14 items-center justify-between">
          {/* leading */}
          {isHome ? (
            <span className="size-9" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label={t("Back")}
            >
              <IconArrowLeft className="rtl:rotate-180" />
            </Button>
          )}

          {/* centered logo */}
          <Link
            to="overview"
            aria-label={appName()}
            className="absolute start-1/2 -translate-x-1/2 rtl:translate-x-1/2"
          >
            <img src={logoSrc} alt={appName()} className="h-7 w-auto" />
          </Link>

          <div className="flex items-center gap-1">
            {features.notifications && activeParent !== "settings" ? (
              <NotificationSidebar
                userId={me?._id}
                unreadCount={unreadCount}
                onRefreshUnread={refreshUnread}
                onItemMarkedRead={decrementUnread}
              />
            ) : (
              <span className="size-9" />
            )}
            {/*
              There is no `settings` route in coreRoutes, so this button used to
              navigate straight to a 404. It stays hidden until that page exists.
            */}
            {HAS_SETTINGS_ROUTE && activeParent !== "settings" ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  navigate(`/${tenantId}/settings`, { viewTransition: true })
                }
                aria-label={t("Settings")}
              >
                <IconSettings className="size-5" />
              </Button>
            ) : (
              <span className="size-9" />
            )}
          </div>
        </Container>

        {subNavItems?.length ? (
          <Container className="flex items-center gap-3 px-4 pt-0 pb-3">
            <SubNav navMenu={subNavItems} />
          </Container>
        ) : null}
      </header>

      <main className="page-transition relative flex min-h-0 w-full flex-1 flex-col gap-3 pb-[calc(5rem+var(--spacing-safe-b))]">
        {children}
      </main>

      <BottomTabs variant="floating" unreadCount={unreadCount} />
    </div>
  )
}
