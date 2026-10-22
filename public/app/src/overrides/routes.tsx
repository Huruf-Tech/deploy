import { Outlet } from "react-router"
import {
  IconBraces,
  IconBrandGithub,
  IconTemplate,
  IconLock,
  IconShieldCheck,
  IconUserShield,
} from "@tabler/icons-react"
import { ThunderSDK } from "thunder-sdk"

import type { TRoutesOverride } from "@/core/types"
import { regroup } from "@/lib/regroup"
import Overview from "@/pages/overview"
import Variables from "@/pages/variables"
import GitHub from "@/pages/github"
import Templates from "@/pages/templates"
import TemplateDetail from "@/pages/templates/Detail"

/** `users` is root-only, so it doubles as the admin check for the Admin group. */
const isAdmin = () => ThunderSDK.isPermitted("users", "get")

/** Nav groups follow PLAN §15.2; each phase adds its group with a priority in that order. */
export const routes: TRoutesOverride = {
  overview: { Component: Overview },

  // Served by the thunder-core auth app (/auth), not this dashboard.
  apiKeys: { display: false },
  oauthClients: { display: false },
  tenantMembers: { display: false },
  tenantInvites: { display: false },
  tenants: { display: false },

  users: regroup("users", "Admin", {
    name: "Users",
    icon: IconUserShield,
    display: isAdmin,
  }),
  accessControl: regroup("accessControl", "Admin", {
    name: "Roles",
    icon: IconShieldCheck,
    display: isAdmin,
  }),
  accessControlPolicies: regroup("accessControlPolicies", "Admin", {
    name: "Policies",
    icon: IconLock,
    display: isAdmin,
  }),

  // Reached through the built-in wallet page, not navigation.
  wallets: { merge: true, display: false },
  walletLedgers: { merge: true, display: false },

  servers: { merge: true, name: "Servers" },

  // A custom page: the backend router is not a createCRUD, so nothing is generated.
  variables: {
    name: "Variables",
    path: "variables",
    group: "Configuration",
    icon: IconBraces,
    Component: Variables,
    display: () => ThunderSDK.isPermitted("variables", "list"),
  },

  // Custom pages (PLAN §15.2 Build group); GitHub redirects back to build/gitIntegrations.
  templates: {
    name: "Templates",
    path: "templates",
    group: "Build",
    icon: IconTemplate,
    display: () => ThunderSDK.isPermitted("templates", "list"),
    Component: () => <Outlet />,
    children: [
      { index: true, display: false, Component: Templates },
      { path: ":id", display: false, Component: TemplateDetail },
    ],
  },
  gitIntegrations: {
    name: "GitHub",
    path: "gitIntegrations",
    group: "Build",
    icon: IconBrandGithub,
    display: () => ThunderSDK.isPermitted("gitIntegrations", "list"),
    Component: GitHub,
  },
  // GitHub's callbacks; nothing to show in the dashboard.
  githubHooks: { display: false },

  Infrastructure: { merge: true, priority: 10 },
  Build: { merge: true, priority: 15 },
  Configuration: { merge: true, priority: 20 },
  Admin: { merge: true, priority: 90 },
}
