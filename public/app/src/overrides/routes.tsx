import { Outlet } from "react-router"
import {
  IconActivity,
  IconBell,
  IconBox,
  IconCreditCard,
  IconWallet,
  IconReceipt2,
  IconReportMoney,
  IconBucket,
  IconCash,
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
import Payments from "@/pages/billing/Payments"
import PaymentsAdmin from "@/pages/billing/PaymentsAdmin"
import ControlPlane from "@/pages/admin/ControlPlane"
import Network from "@/pages/network"
import AlertRules from "@/pages/alerts"
import AlertHistory from "@/pages/alerts/History"

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
  }),
  accessControl: regroup("accessControl", "Admin", {
    name: "Roles",
    icon: IconShieldCheck,
  }),
  // Members get policies.get for utility reads; only admins manage them.
  accessControlPolicies: regroup("accessControlPolicies", "Admin", {
    name: "Policies",
    icon: IconLock,
    display: () => ThunderSDK.isPermitted("accessControlPolicies", "create"),
  }),

  // CRUD modules (users, roles, policies, plans) show only with their own
  // get/create permission: core's router checks it.
  plans: { merge: true, name: "Plans", icon: IconReceipt2 },
  // Who is subscribed to which plan (admins); "Billing" read as their own bills.
  billingAdmin: {
    name: "Subscriptions",
    // Not "billing": Configuration → Billing owns that segment in breadcrumbs.
    path: "subscriptions",
    group: "Admin",
    icon: IconReportMoney,
    display: () => ThunderSDK.isPermitted("billingAdmin", "subscriptions"),
    Component: BillingAdmin,
  },
  // Card top-ups across tenants: Settle/Abandon, refunds and disputes (15d).
  paymentsAdmin: {
    name: "Payments",
    path: "payments",
    group: "Admin",
    icon: IconCash,
    display: () => ThunderSDK.isPermitted("paymentsAdmin", "topups"),
    Component: PaymentsAdmin,
  },
  controlPlane: {
    name: "Control plane",
    path: "controlPlane",
    group: "Admin",
    icon: IconActivity,
    display: () => ThunderSDK.isPermitted("controlPlane", "overview"),
    Component: ControlPlane,
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
  // Balance, cards, Add funds and transactions (PLAN §25, Phase 15b).
  payments: {
    name: "Billing",
    path: "billing",
    group: "Configuration",
    icon: IconWallet,
    priority: 11,
    display: () => ThunderSDK.isPermitted("payments", "summary"),
    Component: Payments,
  },
  // Billing shows the wallet (balance and transactions) instead.
  wallet: { display: false },

  // Reached through the built-in wallet page, not navigation.
  wallets: { merge: true, display: false },
  walletLedgers: { merge: true, display: false },
  // Admin → Payments lists top-ups with Settle and Abandon instead.
  walletTopups: { merge: true, display: false },

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
  // Groups are folders on the Projects page, not a page of their own.
  projectGroups: {
    merge: true,
    name: "Groups",
    icon: IconFolders,
    priority: 1,
    display: false,
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
