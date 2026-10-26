import { Link, useLocation } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { IconShieldCheck } from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { getLocalPath } from "@/core/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * A tenant that still needs a card (PLAN §25.10, 4): one line on every page,
 * since adding servers, projects and plans waits for it. The Billing page
 * shows its own, fuller notice.
 */
export function CardBanner() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const request = ThunderSDK.useCaching(
    ["payments", "summary"],
    async ({ signal }) =>
      ThunderSDK.isPermitted("payments", "summary")
        ? await ThunderSDK.payments.summary({ signal })
        : null
  )
  const summary = use(request).data
  if (!summary?.cardRequired || pathname.endsWith("/configuration/billing")) {
    return null
  }

  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b bg-info-soft px-3 py-1.5 text-[13px] text-info-foreground md:px-4"
    >
      <IconShieldCheck className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">
        <span className="font-medium">
          {t("Add a card to start using Huruf Deploy.")}
        </span>{" "}
        {summary.isOwner
          ? t("We won't charge you; Free stays free.")
          : t("Ask the workspace owner to add one.")}
      </p>
      {summary.isOwner && (
        <Button
          size="sm"
          className="h-7"
          render={<Link to={getLocalPath("configuration/billing")} />}
          nativeButton={false}
        >
          {t("Add card")}
        </Button>
      )}
    </div>
  )
}
