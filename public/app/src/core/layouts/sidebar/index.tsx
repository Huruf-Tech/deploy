import {
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { NavMenu } from "./nav-menu"
import { useLayout } from "@/core/layouts/layout-provider"
import type { TRouteObject } from "@/core/router"
import { Breadcrumb } from "@/core/layouts/shared/breadcrumb"
import Logo from "/logo.png"
import { Link } from "react-router"
import { appName } from "@/core/lib/utils"
import { allowDisplayRoute } from "@/core/lib/utils"

export function Layout({ children }: { children: React.ReactNode }) {
  const { router } = useLayout()

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="data-[slot=sidebar-menu-button]:p-1.5!"
                render={<Link to="/" />}
              >
                <img src={Logo} alt="Logo" className="h-5 w-auto shrink-0" />
                <span className="text-base font-semibold capitalize">
                  {appName()}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {(router.routes as TRouteObject[])
            .filter((route) => allowDisplayRoute(route.display))
            .map((route) => (
              <NavMenu
                key={route.name}
                name={route.name ?? "Unnamed Route"}
                items={route.children
                  ?.filter((route) => allowDisplayRoute(route.display ?? true))
                  .map((child) => ({
                    title: child.name ?? "Unnamed Route",
                    icon: child.icon,
                    path: child.path,
                    items: child.children
                      ?.filter((subChild) =>
                        allowDisplayRoute(subChild.display ?? true)
                      )
                      .map((subChild) => ({
                        title: subChild.name ?? "Unnamed Route",
                        icon: subChild.icon,
                        path: subChild.path,
                      })),
                  }))}
              />
            ))}
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full w-full flex-1 flex-col">
          <main className="@container/main relative flex h-full w-full flex-1 flex-col gap-2">
            <div className="container mx-auto flex max-w-6xl flex-col gap-4 p-3">
              <SidebarTrigger
                variant="secondary"
                size="icon-lg"
                className="border border-border"
              />
              <Breadcrumb />
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
