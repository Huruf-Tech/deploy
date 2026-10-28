import { Link } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { IconServerBolt } from "@tabler/icons-react"

import { getLocalPath } from "@/core/lib/utils"
import { Button } from "@/components/ui/button"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"
import { useIsOwner } from "@/pages/rentals/rental"

/**
 * On the overview (PLAN §30): for a workspace owner, rental requests waiting
 * for their machines; for admins, open disputes, claims to take back, abuse
 * reports and stuck rentals. Nothing when there's nothing to do.
 */
export function RentalNotice() {
  const isOwner = useIsOwner()
  return (
    <>
      {isOwner && ThunderSDK.isPermitted("hosting", "requests") && (
        <OwnerNotice />
      )}
      {ThunderSDK.isPermitted("rentalsAdmin", "listDisputes") && (
        <AdminNotice />
      )}
    </>
  )
}

function OwnerNotice() {
  const { t } = useTranslation()
  const requests = useCached(queries.hostingRequests()).data ?? []
  if (!requests.length) return null
  // One machine: its page, where they wait; else the servers list.
  const machines = [...new Set(requests.map((r) => r.machine))]
  return (
    <Notice
      text={t("{{count}} rental requests wait for you", {
        count: requests.length,
      })}
      to={
        machines.length === 1 && machines[0]
          ? `infrastructure/servers/${machines[0]}`
          : "infrastructure/servers"
      }
    />
  )
}

function AdminNotice() {
  const { t } = useTranslation()
  const disputes = useCached(queries.disputes("open")).data?.length ?? 0
  const reverts = useCached(queries.claimReverts()).data?.length ?? 0
  const reports = useCached(queries.abuseReports()).data?.length ?? 0
  const stuck =
    useCached(queries.rentalWaiting()).data?.filter((w) => w.error).length ?? 0
  const parts = [
    disputes && t("{{count}} open disputes", { count: disputes }),
    reverts && t("{{count}} claims to take back", { count: reverts }),
    reports && t("{{count}} abuse reports", { count: reports }),
    stuck && t("{{count}} approved rentals need attention", { count: stuck }),
  ].filter(Boolean)
  if (!parts.length) return null
  return <Notice text={parts.join(" · ")} to="admin/rentals" />
}

function Notice({ text, to }: { text: string; to: string }) {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] border border-info/40 bg-info-soft px-3 py-2 text-[13px] text-info-foreground"
    >
      <IconServerBolt className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-[1_1_16rem]">
        <span className="font-medium">{t("Rentals")}</span>
        {" · "}
        {text}
      </p>
      <Button
        size="sm"
        variant="outline"
        render={<Link to={getLocalPath(to)} />}
        nativeButton={false}
      >
        {t("Review")}
      </Button>
    </div>
  )
}
