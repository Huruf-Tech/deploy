import { IconLock, IconShieldCheck, IconUserShield } from "@tabler/icons-react"
import { ThunderSDK } from "thunder-sdk"

import type { TRoutesOverride } from "@/core/types"
import { regroup } from "@/lib/regroup"
import Overview from "@/pages/overview"

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

  Infrastructure: { merge: true, priority: 10 },
  Admin: { merge: true, priority: 90 },
}
