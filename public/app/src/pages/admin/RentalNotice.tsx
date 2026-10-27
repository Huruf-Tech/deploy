import { Link } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { IconServerBolt } from "@tabler/icons-react"

import { getLocalPath } from "@/core/lib/utils"
import { Button } from "@/components/ui/button"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

/**
 * For admins on the overview (PLAN §26.8): rental requests and resizes
 * waiting for approval, and approved rentals that got stuck, with a link to
 * Admin → Rentals. Nothing when there's nothing to do.
 */
export function RentalNotice() {
  if (!ThunderSDK.isPermitted("rentalsAdmin", "queue")) return null
  return <Notice />
}

function Notice() {
  const { t } = useTranslation()
  const queue = useCached(queries.rentalQueue()).data
  const waiting = useCached(queries.rentalWaiting()).data
  const requests = queue?.filter((q) => q.status === "requested").length ?? 0
  const resizes = (queue?.length ?? 0) - requests
  const stuck = waiting?.filter((w) => w.error).length ?? 0
  if (!requests && !resizes && !stuck) return null

  const parts = [
    requests && t("{{count}} rental requests waiting", { count: requests }),
    resizes && t("{{count}} resizes waiting", { count: resizes }),
    stuck && t("{{count}} approved rentals need attention", { count: stuck }),
  ].filter(Boolean)
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] border border-info/40 bg-info-soft px-3 py-2 text-[13px] text-info-foreground"
    >
      <IconServerBolt className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-[1_1_16rem]">
        <span className="font-medium">{t("Rentals")}</span>
        {" · "}
        {parts.join(" · ")}
      </p>
      <Button
        size="sm"
        variant="outline"
        render={<Link to={getLocalPath("admin/rentals")} />}
        nativeButton={false}
      >
        {t("Review")}
      </Button>
    </div>
  )
}
