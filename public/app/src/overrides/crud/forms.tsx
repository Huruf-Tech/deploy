import type { TFormsOverride } from "@/core/types"
import PlanForm from "@/pages/admin/PlanForm"
import ServerForm from "@/pages/servers/ServerForm"

export const forms: TFormsOverride = {
  plans: PlanForm,
  servers: ServerForm,
}
