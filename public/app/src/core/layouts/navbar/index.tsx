import { Breadcrumb } from "@/core/layouts/shared/breadcrumb"
import { useLayout } from "@/core/layouts/layout-provider"
import { useTheme } from "@/components/theme-provider"
import {
  IconArrowsExchange,
  IconAsterisk,
  IconCheck,
  IconDotsVertical,
  IconEye,
  IconEyeOff,
  IconLogout,
  IconMenu2,
  IconMoon,
  IconNotification,
  IconSun,
  IconUserCircle,
  IconWorld,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import LogoDark from "/logo-dark.png"
import LogoLight from "/logo-light.png"
import { Link, useLocation, useNavigate } from "react-router"
import React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavMenu } from "./nav-menu"
import { getNavRoutes } from "@/core/lib/utils"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useIsMobile } from "@/hooks/use-mobile"
import { use } from "@/core/hooks/use"
import {
  getAuthUrl,
  getInitials,
  getLocalPath,
  transformImage,
} from "@/core/lib/utils"
import { features } from "@/core/lib/features"
import { useLogout } from "@/core/protected"
import { SubNav } from "../shared/sub-nav"
import { ThunderSDK } from "thunder-sdk"
import { Container } from "@/core/custom/Container"
import { useTranslation } from "react-i18next"

import { getWallets } from "@/core/endpoints/wallet.ts"
import { Skeleton } from "@/components/ui/skeleton"
import { ActionSwapText } from "@/core/pages/wallet/action-swap"
import { NotificationPopover } from "@/core/pages/notifications/notification-popover"
import { defaultCurrency } from "@/core/lib/constants"
import { HeaderActionsProvider } from "@/core/context/HeaderActions"

function NavBalance({
  visible,
  onToggle,
}: {
  visible: boolean
  onToggle: () => void
}) {
  const walletRequest = React.useMemo(() => getWallets(), [])
  const { data: walletData, isLoading } = use(walletRequest)

  const wallet = (walletData?.results ?? [])[0] as
    { balance: number; currency: string } | undefined

  const balance = wallet?.balance ?? 0
  const currency = wallet?.currency?.toUpperCase() ?? defaultCurrency
  const formatted = `${currency} ${balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-label={visible ? "Hide balance" : "Show balance"}
      className="text-muted-foreground hover:text-foreground"
    >
      {visible ? (
        <IconEye className="size-4" />
      ) : (
        <IconEyeOff className="size-4" />
      )}

      {isLoading ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <ActionSwapText
          value={visible ? formatted : "hidden"}
          animation="cascade"
          className="flex items-center text-sm font-semibold text-foreground capitalize"
        >
          {visible ? (
            formatted
          ) : (
            <span className="flex items-center">
              {Array.from({ length: 6 }).map((_, idx) => (
                <IconAsterisk key={idx} stroke={2} className="size-2" />
              ))}
            </span>
          )}
        </ActionSwapText>
      )}
    </Button>
  )
}

/** Matches the sidebar sheet's close transition. */
const SHEET_CLOSE_MS = 300

function SidebarTrigger() {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label="Toggle menu"
      onClick={toggleSidebar}
    >
      <IconMenu2 className="size-4" />
    </Button>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { router } = useLayout()
  const location = useLocation()
  const { resolvedTheme, setTheme } = useTheme()
  const isMobile = useIsMobile()
  const logout = useLogout()
  const { t, i18n } = useTranslation()

  const isRtl = i18n.language === "ar"
  const [balanceVisible, setBalanceVisible] = React.useState(false)

  const _me = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return await ThunderSDK.me.get({ signal })
    },
    []
  )

  const { data: me } = use(_me)

  const { routes, subRoutes } = React.useMemo(
    () => getNavRoutes(router.routes),
    [router.routes]
  )

  const [, activeParent] = React.useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const subNavItems = React.useMemo(
    () => subRoutes[activeParent],
    [activeParent, subRoutes]
  )

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  //! On mobile the nav item closes the sheet first, and navigating in the same
  //! frame cuts that animation short. This delay used to run unconditionally, so
  //! every desktop navigation paid 300ms for a sheet that was never open.
  const handleNavigate = React.useCallback(
    (path: string) => {
      if (isMobile) {
        setTimeout(
          () => void navigate(path, { viewTransition: true }),
          SHEET_CLOSE_MS
        )

        return
      }

      void navigate(path, { viewTransition: true })
    },
    [navigate, isMobile]
  )

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar
        side={isRtl ? "right" : "left"}
        collapsible="icon"
        variant="floating"
        className="bg-background"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="mt-4 rounded-md py-0! ring-transparent group-data-[collapsible=icon]:size-8! hover:bg-transparent! group-data-[collapsible=icon]:[&>div]:block">
                <div className="hidden size-5 shrink-0">
                  <img
                    src={resolvedTheme === "dark" ? LogoDark : LogoLight}
                    alt="Logo"
                    className="h-5 w-auto"
                  />
                </div>
                <span className="text-base font-semibold">
                  {t("Main Menu")}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMenu items={routes} onChange={handleNavigate} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu className="gap-3">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("Toggle theme")}
                onClick={toggleTheme}
              >
                {resolvedTheme === "dark" ? (
                  <IconSun className="size-4" />
                ) : (
                  <IconMoon className="size-4" />
                )}
                <p className="font-medium">{t("Toggle theme")}</p>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg grayscale">
                        <AvatarImage
                          src={transformImage(me?.image)}
                          alt={me?.name}
                        />
                        <AvatarFallback className="rounded-lg">
                          {getInitials(me?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-start text-sm leading-tight">
                        <span className="truncate font-medium">{me?.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {me?.email}
                        </span>
                      </div>
                      <IconDotsVertical className="ms-auto size-4" />
                    </SidebarMenuButton>
                  }
                ></DropdownMenuTrigger>
                <DropdownMenuContent
                  className="min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : isRtl ? "left" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage
                            src={transformImage(me?.image)}
                            alt={me?.name}
                          />
                          <AvatarFallback className="rounded-lg">
                            {getInitials(me?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-start text-sm leading-tight">
                          <span className="truncate font-medium">
                            {me?.name ?? t("Unnamed")}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {me?.email ?? t("N/A")}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => {
                        const authUrl = getAuthUrl()
                        window.location.href = authUrl.toString()
                      }}
                    >
                      <IconUserCircle className="size-4" />
                      {t("Account")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link to="/select-tenant/#list" />}
                    >
                      <IconArrowsExchange className="size-4" />
                      {t("Change tenant")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link to={getLocalPath("notifications")} />}
                    >
                      <IconNotification className="size-4" />
                      {t("Notifications")}
                    </DropdownMenuItem>
                    {/* language sub menu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <IconWorld className="size-4" />
                        {t("Language")}
                      </DropdownMenuSubTrigger>

                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            onClick={() => i18n.changeLanguage("en")}
                          >
                            <span className="flex-1">{t("English")}</span>
                            {i18n.language === "en" && (
                              <IconCheck className="size-4" />
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => i18n.changeLanguage("ar")}
                          >
                            <span className="flex-1">{t("Arabic")}</span>
                            {i18n.language === "ar" && (
                              <IconCheck className="size-4" />
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("Logout")}
                onClick={logout}
                className="bg-destructive-foreground/10 text-destructive"
              >
                <IconLogout className="size-4" />
                <p className="font-medium">{t("Logout")}</p>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="h-svh overflow-hidden md:p-2">
        <div className="@container/main relative flex h-full w-full flex-1 flex-col gap-2 rounded-xl border-border xl:border">
          <HeaderActionsProvider>
            {(actionsElement) => (
              <Container as="header">
                <div className="relative mx-auto flex items-center gap-3 py-2">
                  {actionsElement}
                  <Breadcrumb />

                  {/* Right Actions */}
                  <div className="ms-auto flex items-center gap-3">
                    {/* Notifications */}
                    {features.notifications && (
                      <NotificationPopover userId={me?._id} />
                    )}

                    {/* Balance Toggle */}
                    {features.wallet &&
                      ThunderSDK.isPermitted(ThunderSDK.wallets.get) && (
                        <NavBalance
                          visible={balanceVisible}
                          onToggle={() => setBalanceVisible((v) => !v)}
                        />
                      )}

                    <SidebarTrigger />
                  </div>
                </div>

                {subNavItems && (subNavItems?.length ?? 0) > 1 ? (
                  <SubNav navMenu={subNavItems} />
                ) : null}
              </Container>
            )}
          </HeaderActionsProvider>
          {/* Main Content */}
          <main className="page-transition relative mx-auto flex min-h-0 w-full flex-1 flex-col gap-3 pb-3">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
