import React from "react"

import type { TCardProps, TCardsOverride } from "@/core/types"
import ServerCards from "@/pages/servers/ServerCards"
import {
  EnvCards,
  PlanCards,
  PolicyCards,
  RoleCards,
} from "@/pages/admin/cards"

/** Core's users card view (ban, overdraft), registered here instead of through VITE_ENABLE_USERS. */
const UserCards = React.lazy(
  () => import("@/core/pages/users/userCardView")
) as React.ComponentType<TCardProps>

export const cards: TCardsOverride = {
  servers: ServerCards,
  plans: PlanCards,
  accessControl: RoleCards,
  accessControlPolicies: PolicyCards,
  envs: EnvCards,
  users: UserCards,
}
