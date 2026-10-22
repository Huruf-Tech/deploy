import {
  IconAdjustmentsHorizontal,
  IconServer2,
  IconServerCog,
  IconShieldLock,
  IconVariable,
} from "@tabler/icons-react"

import type { TIconsOverride } from "@/core/types"

export const icons: TIconsOverride = {
  servers: IconServer2,
  envs: IconVariable,
  Infrastructure: IconServerCog,
  Configuration: IconAdjustmentsHorizontal,
  Admin: IconShieldLock,
}
