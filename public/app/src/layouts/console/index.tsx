import React from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import {
  IconAlertCircle,
  IconArrowsExchange,
  IconCheck,
  IconLayoutSidebar,
  IconLogout,
  IconMoon,
  IconSearch,
  IconSelector,
  IconSun,
  IconUserCircle,
  IconWorld,
} from "@tabler/icons-react"

import LogoDark from "/logo-dark.png"
import LogoLight from "/logo-light.png"
import { useLayout } from "@/core/layouts/layout-provider"
import { Breadcrumb } from "@/core/layouts/shared/breadcrumb"
import { HeaderActionsProvider } from "@/core/context/HeaderActions"
import { NotificationPopover } from "@/core/pages/notifications/notification-popover"
import { features } from "@/core/lib/features"
import { useLogout } from "@/core/protected"
import { CardBanner } from "./card-banner"
import {
  getAuthUrl,
  getInitials,
  getLocalPath,
  getNavRoutes,
  transformImage,
} from "@/core/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Kbd } from "@/components/console/kbd"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { CommandMenu, type TNavGroup } from "./command-menu"
import { canOpenShell, ShellDock } from "./shell-dock"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

/**
 * Open unless the viewer collapsed it. Our own key: the primitive's
 * `sidebar_state` cookie still holds core navbar's closed default.
 */
const SIDEBAR_KEY = "console-sidebar"
const sidebarOpen = () => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== "closed"
  } catch {
    return true
  }
}
const rememberSidebar = (open: boolean) => {
  try {
    localStorage.setItem(SIDEBAR_KEY, open ? "open" : "closed")
  } catch {
    // Storage may be blocked; it just isn't remembered.
  }
}

/**
 * The console shell (docs/DESIGN.md §4): a grouped sidebar that collapses to
 * an icon rail, a 48 px top bar with the breadcrumb, ⌘K and notifications.
 * Registered as `navbar` in `src/overrides/layouts.ts`.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  const { router } = useLayout()
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [shellOpen, setShellOpen] = React.useState(false)
  const shell = canOpenShell()
  const [sidebar, setSidebar] = React.useState(sidebarOpen)
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()

  // ponytail: core's breadcrumb renders its home crumb as a bare icon link;
  // label it here until core does (src/core is not ours to edit).
  React.useEffect(() => {
    document
      .querySelector('#console-bar a[data-slot="breadcrumb-link"]')
      ?.setAttribute("aria-label", t("Home"))
  }, [pathname, t])

  const groups = React.useMemo<TNavGroup[]>(() => {
    const { routes, subRoutes } = getNavRoutes(router.routes)
    return routes.map((route) => ({
      title: route.title,
      icon: route.icon,
      path: route.path ?? "",
      items: (subRoutes[route.path ?? ""] ?? []).map((sub) => ({
        title: sub.title,
        icon: sub.icon,
        path: `${route.path}/${sub.path}`,
      })),
    }))
  }, [router.routes])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((open) => !open)
      }
      if (e.key === "`" && (e.metaKey || e.ctrlKey) && shell) {
        e.preventDefault()
        setShellOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shell])

  return (
    <SidebarProvider
      open={sidebar}
      onOpenChange={(open) => {
        setSidebar(open)
        rememberSidebar(open)
      }}
      style={
        {
          "--sidebar-width": "14.5rem",
          "--sidebar-width-icon": "3.5rem",
        } as React.CSSProperties
      }
    >
      <ConsoleSidebar
        groups={groups}
        side={i18n.language === "ar" ? "right" : "left"}
      />
      <SidebarInset className="h-svh min-w-0 overflow-hidden bg-background">
        <HeaderActionsProvider>
          {(actionsElement) => (
            <header
              id="console-bar"
              className="relative flex h-12 shrink-0 items-center gap-2 border-b px-3 md:px-4"
            >
              {actionsElement}
              <SidebarToggle />
              <Breadcrumb className="no-scrollbar min-w-0 flex-1 overflow-x-auto text-[13px] scroll-mask-x-from-90%" />
              <div className="ms-auto flex items-center gap-1">
                <SearchButton onClick={() => setPaletteOpen(true)} />
                <ThemeButton />
                {features.notifications && <Notifications />}
              </div>
            </header>
          )}
        </HeaderActionsProvider>
        <CardBanner />
        {/* SidebarInset is the page's <main>. */}
        <div
          id="main"
          // One side gutter for every page, core's and ours (DESIGN §3).
          className="page-transition relative flex min-h-0 w-full flex-1 flex-col md:px-4"
        >
          {children}
        </div>
        {shell && <ShellDock open={shellOpen} onOpenChange={setShellOpen} />}
      </SidebarInset>
      <CommandMenu
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        groups={groups}
        onShell={shell ? () => setShellOpen(true) : undefined}
      />
    </SidebarProvider>
  )
}

function ConsoleSidebar({
  groups,
  side,
}: {
  groups: TNavGroup[]
  side: "left" | "right"
}) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const { isMobile, setOpenMobile } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()

  // Paths are relative to the tenant: /:tenant/<group>/<page>.
  const here = location.pathname.split("/").filter(Boolean).slice(1).join("/")
  const isActive = (path: string) =>
    here === path || here.startsWith(`${path}/`)

  const go = (path: string) => {
    if (isMobile) setOpenMobile(false)
    void navigate(getLocalPath(path))
  }

  // Loose pages (and groups of a single page) sit unlabelled at the top.
  const loose = groups.flatMap((g) =>
    g.items.length <= 1 ? (g.items.length ? g.items : [g]) : []
  )
  const sections = [
    { key: "loose", label: undefined as string | undefined, items: loose },
    ...groups
      .filter((g) => g.items.length > 1)
      .map((g) => ({ key: g.path, label: t(g.title), items: g.items })),
  ]

  return (
    <Sidebar side={side} collapsible="icon" className="border-e">
      <SidebarHeader className="h-12 justify-center border-b px-3 py-0 group-data-[collapsible=icon]:px-2">
        <Link
          to={getLocalPath("overview")}
          className="flex items-center gap-2 rounded-md outline-none group-data-[collapsible=icon]:justify-center focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src={resolvedTheme === "dark" ? LogoDark : LogoLight}
            alt=""
            className="size-6 shrink-0 object-contain"
          />
          <span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Huruf Deploy
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2">
        {sections.map((section) => (
          <NavGroup
            key={section.key}
            label={section.label}
            items={section.items}
            isActive={isActive}
            onGo={go}
          />
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function NavGroup({
  label,
  items,
  isActive,
  onGo,
}: {
  label?: string
  items: { title: string; icon?: TNavGroup["icon"]; path: string }[]
  isActive: (path: string) => boolean
  onGo: (path: string) => void
}) {
  const { t } = useTranslation()
  if (!items.length) return null

  return (
    <SidebarGroup className="py-1 group-data-[collapsible=icon]:py-1.5">
      {label && (
        <SidebarGroupLabel className="h-6 text-[11px] font-medium text-muted-foreground ltr:tracking-wide ltr:uppercase">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        {/* The icon rail needs room between targets (WCAG 2.5.8). */}
        <SidebarMenu className="gap-px group-data-[collapsible=icon]:gap-1.5">
          {items.map((item) => {
            const Icon = item.icon ?? IconAlertCircle
            const active = isActive(item.path)
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  size="sm"
                  tooltip={t(item.title)}
                  isActive={active}
                  className="h-8 rounded-lg text-[13px] data-active:text-foreground [&_svg]:text-muted-foreground data-active:[&_svg]:text-brand-text"
                  render={
                    <a
                      href={getLocalPath(item.path)}
                      aria-current={active ? "page" : undefined}
                      onClick={(e) => {
                        // Keep new-tab / middle clicks native.
                        if (e.metaKey || e.ctrlKey || e.shiftKey) return
                        e.preventDefault()
                        onGo(item.path)
                      }}
                    />
                  }
                >
                  <Icon aria-hidden />
                  <span>{t(item.title)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function UserMenu() {
  const { t, i18n } = useTranslation()
  const isMobile = useIsMobile()
  const logout = useLogout()
  const me = useMe()
  const rtl = i18n.language === "ar"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="h-10 rounded-lg group-data-[collapsible=icon]:p-1!"
                tooltip={me?.name ?? t("Account")}
              >
                <Avatar className="size-7 rounded-md">
                  <AvatarImage src={transformImage(me?.image)} alt="" />
                  <AvatarFallback className="rounded-md text-[11px]">
                    {getInitials(me?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-start leading-tight">
                  <span className="truncate text-[13px] font-medium">
                    {me?.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {me?.email}
                  </span>
                </div>
                <IconSelector className="ms-auto text-muted-foreground" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "top" : rtl ? "left" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="truncate text-[13px] font-medium text-foreground">
                  {me?.name ?? t("Unnamed")}
                </div>
                <div className="truncate text-xs">{me?.email ?? t("N/A")}</div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  window.location.href = getAuthUrl().toString()
                }}
              >
                <IconUserCircle /> {t("Account")}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to="/select-tenant/#list" />}>
                <IconArrowsExchange /> {t("Change tenant")}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <IconWorld /> {t("Language")}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {(
                      [
                        ["en", "English"],
                        ["ar", "Arabic"],
                      ] as const
                    ).map(([code, name]) => (
                      <DropdownMenuItem
                        key={code}
                        onClick={() => i18n.changeLanguage(code)}
                      >
                        <span className="flex-1">{t(name)}</span>
                        {i18n.language === code && <IconCheck />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <IconLogout /> {t("Logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function useMe() {
  return useCached(queries.me()).data
}

function Notifications() {
  const me = useMe()
  return <NotificationPopover userId={me?._id} />
}

function SidebarToggle() {
  const { toggleSidebar } = useSidebar()
  const { t } = useTranslation()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t("Toggle menu")}
      onClick={toggleSidebar}
      className="-ms-1 text-muted-foreground"
    >
      <IconLayoutSidebar className="icon-flip-rtl" />
    </Button>
  )
}

function SearchButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  const mac = /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-label={t("Search")}
      aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}
      className="h-8 gap-2 text-muted-foreground max-sm:w-8 max-sm:px-0 sm:w-56 sm:justify-start"
    >
      <IconSearch />
      <span className="max-sm:hidden">{t("Search…")}</span>
      <Kbd className="ms-auto max-sm:hidden">{mac ? "⌘K" : "Ctrl K"}</Kbd>
    </Button>
  )
}

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation()
  const dark = resolvedTheme === "dark"
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t("Toggle theme")}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="text-muted-foreground"
    >
      {dark ? <IconSun /> : <IconMoon />}
    </Button>
  )
}
