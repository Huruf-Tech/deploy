import { useTranslation } from "react-i18next"

import { StatusBadge } from "@/components/console/status"
import type { TServerState } from "./server"

/** Status as dot + text, never colour alone (PLAN §15.4, DESIGN §5). */
export function StatusPill({ state }: { state: TServerState }) {
  const { t } = useTranslation()
  const label = {
    online: t("Online"),
    offline: t("Offline"),
    pending: t("Waiting for approval"),
    rejected: t("Rejected"),
  }[state]

  return (
    <StatusBadge
      state={state}
      tone={state === "rejected" ? "danger" : undefined}
      label={label}
    />
  )
}
