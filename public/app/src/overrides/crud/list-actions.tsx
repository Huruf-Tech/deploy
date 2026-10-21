import type { TListActionsOverride } from "@/core/types"
import { AddServerButton } from "@/pages/servers/AddServerButton"

export const listActions: TListActionsOverride = {
  servers: AddServerButton,
}
