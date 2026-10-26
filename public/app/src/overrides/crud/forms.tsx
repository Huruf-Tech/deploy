import type { TFormsOverride } from "@/core/types"
import PlanForm from "@/pages/admin/PlanForm"
import ServerClassForm from "@/pages/admin/ServerClassForm"
import ServerForm from "@/pages/servers/ServerForm"

export const forms: TFormsOverride = {
  plans: PlanForm,
  serverClasses: ServerClassForm,
  servers: ServerForm,
}
