import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { STATE_STYLE, type TServerState } from "./server"

/** Status as dot + text, never colour alone (PLAN §15.4). */
export function StatusPill({ state }: { state: TServerState }) {
  const { t } = useTranslation()
  const label = {
    online: t("Online"),
    offline: t("Offline"),
    pending: t("Waiting for approval"),
    rejected: t("Rejected"),
  }[state]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        STATE_STYLE[state].pill
      )}
    >
      <span className="relative flex size-2">
        {state === "online" && (
          <span className="absolute inline-flex size-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            STATE_STYLE[state].dot
          )}
        />
      </span>
      {label}
    </span>
  )
}
