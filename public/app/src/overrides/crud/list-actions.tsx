import type { TListActionsOverride } from "@/core/types"
import { ServerActions } from "@/pages/servers/ServerActions"

export const listActions: TListActionsOverride = {
  servers: ServerActions,
}
