import { Outlet } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import type { TablerIcon } from "@tabler/icons-react"

import { ListPage } from "@/core/crud/ListPage"
import { FormPage } from "@/core/crud/FormPage"
import { ViewPage } from "@/core/crud/ViewPage"
import type { TRouteObject } from "@/core/router"

/**
 * Moves an SDK module into another nav group (PLAN §15.2). Core hands its
 * pages the module's own SDK group, which they use to build links, so a
 * `merge` override with a new `group` would break them; the children are
 * rebuilt with the new group instead.
 */
export function regroup(
  module: string,
  group: string,
  opts: { name: string; icon: TablerIcon; display?: () => boolean }
): TRouteObject {
  const sdkModule = ThunderSDK.getModule(module)
  const editable = "create" in sdkModule || "update" in sdkModule
  const form = () => <FormPage group={group} name={module} />

  return {
    name: opts.name,
    path: module,
    group,
    icon: opts.icon,
    display: () =>
      (ThunderSDK.isPermitted(module, "get") ||
        ThunderSDK.isPermitted(module, "create")) &&
      (opts.display?.() ?? true),
    Component: () => <Outlet />,
    children: [
      {
        index: true,
        display: false,
        Component: () => <ListPage group={group} name={module} />,
      },
      ...(editable
        ? [
            { path: "form", display: false, Component: form },
            { path: "form/:id", display: false, Component: form },
          ]
        : []),
      {
        path: ":id",
        display: false,
        Component: () => <ViewPage group={group} name={module} />,
      },
    ],
  }
}
