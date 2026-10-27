import { ThunderSDK } from "thunder-sdk"

import type { TTone } from "@/components/console/status"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

export type TRental = Awaited<
  ReturnType<typeof ThunderSDK.rentals.list>
>[number]

/** The tenant's rentals, shared by the servers list and a rented server's page. */
export function useRentals() {
  const { data, reload } = useCached(queries.rentals())
  return { rentals: data, reload }
}

/** How a rental's status reads (PLAN §26.9), with text, not color alone. */
export function rentalStatus(
  t: (key: string) => string,
  r: Pick<TRental, "status" | "cancelAtPeriodEnd" | "held">
): { tone: TTone; label: string } {
  if (r.held) return { tone: "danger", label: t("Stopped by Huruf") }
  switch (r.status) {
    case "requested":
      return { tone: "info", label: t("Waiting for approval") }
    case "rejected":
      return { tone: "danger", label: t("Not approved") }
    case "pastDue":
      return { tone: "warning", label: t("Payment due") }
    case "suspended":
      return { tone: "danger", label: t("Stopped: unpaid") }
    case "canceled":
      return { tone: "neutral", label: t("Canceled") }
    default:
      return r.cancelAtPeriodEnd
        ? { tone: "warning", label: t("Ends at period end") }
        : { tone: "success", label: t("Active") }
  }
}

/** A machine a rental could be placed on, or moved to (PLAN §26.7). */
export type TMachineSpot =
  | Awaited<ReturnType<typeof ThunderSDK.rentalsAdmin.placement>>[number]
  | Awaited<
      ReturnType<typeof ThunderSDK.rentalsAdmin.moveTargets>
    >["targets"][number]

/** It has room and, for a move, the private network reaches it. */
export const usable = (m: TMachineSpot) =>
  m.fits && (!("reachable" in m) || m.reachable)
