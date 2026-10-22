import { Outlet } from "react-router"
import {
  IconBell,
  IconBox,
  IconCreditCard,
  IconReceipt2,
  IconReportMoney,
  IconBucket,
  IconHistory,
  IconBraces,
  IconBrandGithub,
  IconFolders,
  IconNetwork,
  IconRocket,
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
import Projects from "@/pages/projects"
import NewProject from "@/pages/projects/NewProject"
import ProjectDetail from "@/pages/projects/Detail"
import Registries from "@/pages/registries"
import Storage from "@/pages/storage"
import Billing from "@/pages/billing"
import BillingAdmin from "@/pages/billing/Admin"
import Network from "@/pages/network"
import AlertRules from "@/pages/alerts"
import AlertHistory from "@/pages/alerts/History"

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

  plans: { merge: true, name: "Plans", icon: IconReceipt2, display: isAdmin },
  billingAdmin: {
    name: "Billing",
    path: "billing",
    group: "Admin",
    icon: IconReportMoney,
    display: isAdmin,
    Component: BillingAdmin,
  },
  // Every member sees plan & usage; only the owner changes it.
  billing: {
    name: "Plan & usage",
    path: "plan",
    group: "Configuration",
    icon: IconCreditCard,
    priority: 10,
    display: () => ThunderSDK.isPermitted("billing", "get"),
    Component: Billing,
  },

  // Reached through the built-in wallet page, not navigation.
  wallets: { merge: true, display: false },
  walletLedgers: { merge: true, display: false },

  servers: { merge: true, name: "Servers", priority: 0 },

  // A custom page: the backend router is not a createCRUD, so nothing is generated.
  variables: {
    name: "Variables",
    path: "variables",
    group: "Configuration",
    icon: IconBraces,
    Component: Variables,
    display: () => ThunderSDK.isPermitted("variables", "list"),
  },

  // PLAN §15.2 Applications group.
  projects: {
    name: "Projects",
    path: "projects",
    group: "Applications",
    icon: IconRocket,
    priority: 0,
    display: () => ThunderSDK.isPermitted("projects", "list"),
    Component: () => <Outlet />,
    children: [
      { index: true, display: false, Component: Projects },
      { path: "new", display: false, Component: NewProject },
      { path: ":id", display: false, Component: ProjectDetail },
    ],
  },
  projectGroups: {
    merge: true,
    name: "Groups",
    icon: IconFolders,
    priority: 1,
  },
  networks: {
    name: "Private network",
    path: "network",
    group: "Infrastructure",
    icon: IconNetwork,
    priority: 1,
    display: () => ThunderSDK.isPermitted("networks", "get"),
    Component: Network,
  },
  registries: {
    name: "Registries",
    path: "registries",
    group: "Infrastructure",
    icon: IconBox,
    priority: 2,
    display: () => ThunderSDK.isPermitted("registries", "list"),
    Component: Registries,
  },

  storages: {
    name: "Storage",
    path: "storage",
    group: "Infrastructure",
    icon: IconBucket,
    priority: 3,
    display: () => ThunderSDK.isPermitted("storages", "list"),
    Component: Storage,
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
  // PLAN §16 Phase 8 Monitoring group.
  alertRules: {
    name: "Alert rules",
    path: "alertRules",
    group: "Monitoring",
    icon: IconBell,
    priority: 0,
    display: () => ThunderSDK.isPermitted("alertRules", "list"),
    Component: AlertRules,
  },
  alertEvents: {
    name: "Alert history",
    path: "alertEvents",
    group: "Monitoring",
    icon: IconHistory,
    priority: 1,
    display: () => ThunderSDK.isPermitted("alertEvents", "list"),
    Component: AlertHistory,
  },

  // GitHub's callbacks; nothing to show in the dashboard.
  githubHooks: { display: false },

  Applications: { merge: true, priority: 5 },
  Infrastructure: { merge: true, priority: 10 },
  Monitoring: { merge: true, priority: 12 },
  Build: { merge: true, priority: 15 },
  Configuration: { merge: true, priority: 20 },
  Admin: { merge: true, priority: 90 },
}
