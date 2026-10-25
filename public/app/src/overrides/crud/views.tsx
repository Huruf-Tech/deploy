import type { TViewsOverride } from "@/core/types"
import ServerDetail from "@/pages/servers/ServerDetail"
import RoleDetail from "@/pages/admin/RoleDetail"

export const views: TViewsOverride = {
  servers: ServerDetail,
  accessControl: RoleDetail,
}
