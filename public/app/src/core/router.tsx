import { Navigate, Outlet } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import {
  IconLayoutGrid,
  IconNotification,
  IconWallet,
  type TablerIcon,
} from "@tabler/icons-react"
import type { RouteObject } from "react-router"

import { icons } from "@/overrides/icons"
import { ListPage } from "@/core/crud/ListPage"
import { FormPage } from "@/core/crud/FormPage"
import { ViewPage } from "@/core/crud/ViewPage"

import Overview from "./pages/overview"
import { Wallet } from "@/core/pages/wallet"
import { lists } from "@/overrides/crud/lists"
import { allowDisplayRoute, groupPath, sortRoutes } from "./lib/utils"
import { features } from "./lib/features"
import { routes as overrideRoutes } from "@/overrides/routes"
import Notifications from "./pages/notifications"

export type TRouteObject = {
  name?: string
  priority?: number | (() => number)
  group?: string
  icon?: TablerIcon
  display?: boolean | (() => boolean)
  children?: TRouteObject[]
  button?: React.ComponentType
} & RouteObject

/** Override keys that target a built-in route rather than an SDK module. */
const BUILTIN_ROUTE_KEYS = ["overview", "wallet", "notifications"]

const moduleNames = Array.from(
  new Set([
    ...ThunderSDK.getModuleNames(),
    ...Object.keys(overrideRoutes).filter(
      (name) =>
        !ThunderSDK.hasGroup(name) && !BUILTIN_ROUTE_KEYS.includes(name),
    ),
  ])
)

const rawRoutes = moduleNames
  .map((name) => {
    const overrideRoute = overrideRoutes[name as keyof typeof overrideRoutes]

    if (overrideRoute && !overrideRoute.merge) {
      return overrideRoute
    }

    if (!ThunderSDK.getMetadata(name)) {
      return
    }

    const module = ThunderSDK.getModule(name)
    const group = ThunderSDK.getGroup(name)

    const hasCreate = "create" in module
    const hasUpdate = "update" in module

    const List = lists[name as keyof typeof lists]

    const children: TRouteObject[] = [
      {
        index: true,
        display: false,
        Component: () =>
          List ? (
            <List group={group} name={name} />
          ) : (
            <ListPage group={group} name={name} />
          ),
      },
    ]

    if (hasCreate || hasUpdate) {
      children.push(
        {
          path: `form`,
          display: false,
          Component: () => <FormPage group={group} name={name} />,
        },
        {
          path: `form/:id`,
          display: false,
          Component: () => <FormPage group={group} name={name} />,
        }
      )
    }

    children.push({
      path: `:id`,
      display: false,
      Component: () => <ViewPage group={group} name={name} />,
    })

    return {
      name: name,
      path: name,
      icon: icons[name],
      group,
      Component: () => <Outlet />,
      children,
      ...overrideRoute,
      display: () => {
        const permitted =
          ThunderSDK.isPermitted(name, "get") ||
          ThunderSDK.isPermitted(name, "create")

        return permitted && allowDisplayRoute(overrideRoute?.display)
      },
    }
  })
  .filter(Boolean) as TRouteObject[]

export const coreRoutes = Object.entries(
  Object.groupBy(rawRoutes, (item) => item.group ?? "Other")
).map(([group, routes]) => {
  const overrideRoute = overrideRoutes[group as keyof typeof overrideRoutes]

  if (overrideRoute && !overrideRoute.merge) {
    return overrideRoute
  }

  routes = routes ?? []

  routes.push({
    path: "",
    Component: () => {
      const indexRoute = sortRoutes(routes).filter((route) =>
        allowDisplayRoute(route.display)
      )[0]

      //! Replacing to avoid infinite back and forth navigation between the group and child route
      return <Navigate to={indexRoute?.path ?? "notFound"} replace />
    },
    display: false,
  })

  const children = routes.map((route) => ({
    ...route,
    path: route.path,
  }))

  return {
    path: groupPath(group),
    name: group,
    icon: icons[group],
    Component: () => <Outlet />,
    children,
    ...overrideRoute,
    display: () => {
      const hasVisibleChild = children.some((child) =>
        allowDisplayRoute(child.display)
      )

      return hasVisibleChild && allowDisplayRoute(overrideRoute?.display)
    },
  } as TRouteObject
})

coreRoutes.unshift(
  {
    name: "App root",
    path: "/:tenant",
    Component: () => <Navigate to="overview" />,
    display: false,
  },
  {
    //! Core used to import this from `@/pages/overview`, a file the developer
    //! owns and is told to customise — deleting or renaming it broke the core
    //! router. The default now lives in core, and the developer replaces it by
    //! registering an `overview` entry in `src/overrides/routes.tsx`.
    name: "Overview",
    path: "overview",
    icon: IconLayoutGrid,
    Component: () => <Overview />,
    ...overrideRoutes.overview,
  },
  {
    name: "Wallet",
    path: "wallet",
    icon: IconWallet,
    priority: 50,
    Component: () => <Wallet />,
    display: () =>
      features.wallet &&
      (ThunderSDK.isPermitted(ThunderSDK.wallets.get) ||
        ThunderSDK.isPermitted(ThunderSDK.walletLedgers.get) ||
        ThunderSDK.isPermitted(ThunderSDK.wallets.signTransfer)),
    ...overrideRoutes.wallet,
  },
  {
    name: "Notifications",
    path: "notifications",
    icon: IconNotification,
    //! Hidden from navigation by design (reached from the bell), but the route
    //! must also stop resolving when the feature is off.
    display: false,
    priority: 7,
    Component: () =>
      features.notifications ? <Notifications /> : <Navigate to="overview" />,
    ...overrideRoutes.notifications,
  }
)
