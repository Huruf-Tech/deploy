import React from "react"
import { useLocation, useNavigate } from "react-router"
import { IconArrowLeft } from "@tabler/icons-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"

import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { use } from "@/core/hooks/use"
import { useUnreadCount } from "@/core/hooks/useUnreadCount"
import { features } from "@/core/lib/features"
import { getNavRoutes } from "@/core/lib/utils"
import { HeaderActionsProvider } from "@/core/context/HeaderActions"
import { NotificationPopover } from "@/core/pages/notifications/notification-popover"
import { NotificationSidebar } from "@/core/pages/notifications/notification-sidebar"

import { Breadcrumb } from "../shared/breadcrumb"
import { SubNav } from "../shared/sub-nav"
import { useLayout } from "../layout-provider"
import { SideRail } from "./side-rail"
import { TabBar } from "./tab-bar"
import { useSwipeBack } from "./use-swipe-back"

/**
 * Adaptive layout: one shell, two size classes.
 *
 * On a phone it behaves like an installed app -- a floating glass tab bar, a
 * large title on each tab's own screen that becomes a compact centred title
 * once you drill in, a back button where one belongs, and an edge swipe that
 * goes back. On a pointer-precise screen the same destinations become a
 * persistent sidebar and the toolbar carries a navigable breadcrumb instead of
 * a single title.
 *
 * It is one structure at both sizes rather than two layouts behind a branch, so
 * there is a single set of behaviours to reason about.
 *
 * Which half shows is decided by `md:` variants wherever it can be, not by
 * `useIsMobile`. A hook that measures the window reports the wrong size class
 * for the first painted frame, and on the cold start of a hybrid app that is
 * the one frame the user is actually waiting on. `useIsMobile` is left for the
 * two places CSS cannot reach: arming the back gesture, which is invisible, and
 * choosing between two notification surfaces, which are the same 36px button
 * either way.
 *
 * `<main>` is deliberately *not* the scroll container. Pages in this codebase
 * own their own scrolling (`h-full min-h-0 flex-1 overflow-y-auto`), which is
 * what lets a list pin its header while its rows move. Scrolling the shell
 * instead would bound those pages twice.
 */

/**
 * Title for the compact toolbar.
 *
 * Reads the same sources the breadcrumb reads, in the same order, so a page
 * that already calls `setBreadcrumbTitle` names itself here with no extra work:
 * the event first, then the `name` carried in the link's router state, then the
 * section's own route title.
 */
function usePageTitle(fallback?: string) {
  const location = useLocation()
  const { t } = useTranslation()

  /**
   * Stored alongside the path it was announced for, and compared at render.
   * Clearing it from a second effect on navigation would work, but it costs an
   * extra render pass to undo state the previous screen set.
   */
  const [announced, setAnnounced] = React.useState<{
    pathname: string
    title: string | null
  } | null>(null)

  //! Re-subscribed per path so the handler closes over the path it is
  //! announcing a title for. One listener per navigation is cheaper than the
  //! alternatives: a ref written during render, or a clearing effect.
  React.useEffect(() => {
    const pathname = location.pathname

    const handler = (event: Event) => {
      setAnnounced({
        pathname,
        title: (event as CustomEvent<string | null>).detail ?? null,
      })
    }

    window.addEventListener("breadcrumb-title", handler)

    return () => window.removeEventListener("breadcrumb-title", handler)
  }, [location.pathname])

  const state = location.state as { name?: string } | null

  if (announced?.pathname === location.pathname && announced.title) {
    return announced.title
  }

  if (state?.name) return t(state.name)

  return fallback ? t(fallback) : ""
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { router } = useLayout()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const { routes, subRoutes } = React.useMemo(
    () => getNavRoutes(router.routes),
    [router.routes]
  )

  const segments = React.useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const activeParent = segments[1]

  /** `/:tenant/:section` is a tab's own screen; anything deeper was pushed onto it. */
  const isRootScreen = segments.length <= 2

  const subNavItems = subRoutes[activeParent]

  const sectionTitle = React.useMemo(
    () => routes.find((route) => route.path === activeParent)?.title,
    [routes, activeParent]
  )

  const pageTitle = usePageTitle(sectionTitle)

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

  //! Armed only where a back button is also shown. Arming it on a tab's own
  //! screen would pop the user out of the app's history entirely.
  const { x, paneProps } = useSwipeBack(isMobile && !isRootScreen)

  const goBack = React.useCallback(() => navigate(-1), [navigate])

  return (
    /*
      `dvh`, not `vh`: on mobile web `100vh` is the viewport with the URL bar
      collapsed, so a bottom-pinned bar sits underneath it on load. `dvh` tracks
      the visible area, and with `interactive-widget=resizes-content` on the
      viewport meta it tracks the software keyboard too.
    */
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <SideRail items={routes} />

      {/*
        The pane the back gesture moves. `x` rests at 0, so this is an identity
        transform until a gesture starts -- but it still establishes a containing
        block, which means a `position: fixed` child resolves against the content
        column rather than the viewport. On a phone those are the same box; on
        desktop it keeps a page's own overlays off the rail, which is what you
        want anyway. Base UI dialogs and popovers portal to `body` and are
        unaffected either way.
      */}
      <motion.div
        style={{ x }}
        {...paneProps}
        className="relative flex min-w-0 flex-1 flex-col ps-safe-l pe-safe-r md:ps-0"
      >
        <HeaderActionsProvider>
          {(actionsElement) => (
            <header className="relative z-30 shrink-0 border-b border-border/60 pt-safe-t">
              <div className="relative flex h-14 items-center gap-2 px-3 md:h-16 md:px-4">
                {actionsElement}

                {!isRootScreen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goBack}
                    aria-label={t("Back")}
                    className="-ms-1 shrink-0 md:hidden"
                  >
                    <IconArrowLeft className="rtl:rotate-180" />
                  </Button>
                )}

                {/*
                  A phone gets one title, centred, the way a native nav bar
                  reads. Pointer-precise screens get the trail instead: there is
                  room for it, and every step of it is a link.
                */}
                {!isRootScreen && (
                  <span className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold tracking-[-0.01em] md:hidden">
                    {pageTitle}
                  </span>
                )}

                <div className="hidden min-w-0 md:block">
                  <Breadcrumb />
                </div>

                <div className="ms-auto flex shrink-0 items-center gap-2">
                  {features.notifications &&
                    (isMobile ? (
                      <NotificationSidebar
                        userId={me?._id}
                        unreadCount={unreadCount}
                        onRefreshUnread={refreshUnread}
                        onItemMarkedRead={decrementUnread}
                      />
                    ) : (
                      <NotificationPopover userId={me?._id} />
                    ))}

                  {/* Balances the back button so the centred title stays centred. */}
                  {!isRootScreen && !features.notifications && (
                    <span className="size-9 md:hidden" aria-hidden />
                  )}
                </div>
              </div>

              {/*
                The large title, on a tab's own screen only. Tracking and leading
                tighten as the type grows, or the letters read too far apart.
              */}
              {isRootScreen && pageTitle && (
                <h1 className="truncate px-4 pb-3 font-heading text-[28px] leading-[1.1] font-bold tracking-[-0.02em] md:hidden">
                  {pageTitle}
                </h1>
              )}

              {subNavItems && subNavItems.length > 1 ? (
                <div className="px-3 pb-2 md:px-4">
                  <SubNav navMenu={subNavItems} />
                </div>
              ) : null}
            </header>
          )}
        </HeaderActionsProvider>

        {/*
          The bottom padding clears the floating tab bar, which overlaps the
          content rather than taking a strip out of it.
        */}
        <main className="page-transition-adaptive relative flex min-h-0 w-full flex-1 flex-col gap-3 pb-[calc(5rem+var(--spacing-safe-b))] md:pb-3">
          {children}
        </main>
      </motion.div>

      <TabBar className="md:hidden" />
    </div>
  )
}
