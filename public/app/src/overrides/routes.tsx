import {
  IconLock,
  IconShieldCheck,
  IconUserShield,
  IconVariable,
} from "@tabler/icons-react"
import { ThunderSDK } from "thunder-sdk"

import type { TRoutesOverride } from "@/core/types"
import { regroup } from "@/lib/regroup"
import Overview from "@/pages/overview"

/** `users` is root-only, so it doubles as the admin check for the Administration group. */
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

  users: regroup("users", "Administration", {
    name: "Users",
    icon: IconUserShield,
    display: isAdmin,
  }),
  envs: regroup("envs", "Administration", {
    name: "Platform settings",
    icon: IconVariable,
    display: isAdmin,
  }),
  accessControl: regroup("accessControl", "Administration", {
    name: "Roles",
    icon: IconShieldCheck,
    display: isAdmin,
  }),
  accessControlPolicies: regroup("accessControlPolicies", "Administration", {
    name: "Policies",
    icon: IconLock,
    display: isAdmin,
  }),

  // Reached through built-in pages (wallet, tenant picker), not navigation.
  wallets: { merge: true, display: false },
  walletLedgers: { merge: true, display: false },
  tenantMemberships: { merge: true, display: false },

  Administration: { merge: true, priority: 90 },
}
