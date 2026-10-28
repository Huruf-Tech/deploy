import { ThunderSDK } from "thunder-sdk"

import type { TTone } from "@/components/console/status"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

export type TRental = Awaited<
  ReturnType<typeof ThunderSDK.rentals.list>
>[number]

export type TMarketMachine = Awaited<
  ReturnType<typeof ThunderSDK.market.machines>
>[number]

/** The tenant's rentals, shared by the servers list and a rented server's page. */
export function useRentals() {
  const { data, reload } = useCached(queries.rentals())
  return { rentals: data, reload }
}

/** Whether the signed-in user owns the workspace: renting and earnings are theirs. */
export function useIsOwner() {
  return !!useCached(queries.paymentsSummary()).data?.isOwner
}

/** How a rental's status reads (PLAN §26.9, §30.5), with text, not color alone. */
export function rentalStatus(
  t: (key: string) => string,
  r: Pick<TRental, "status" | "cancelAtPeriodEnd" | "held" | "lostAt">
): { tone: TTone; label: string } {
  if (r.held) return { tone: "danger", label: t("Stopped by Huruf") }
  if (r.lostAt) return { tone: "danger", label: t("Its machine left") }
  switch (r.status) {
    case "requested":
      return { tone: "info", label: t("Waiting for the owner") }
    case "rejected":
      return { tone: "danger", label: t("Not accepted") }
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

/** A machine a rental could move to (PLAN §26.10, §30.8). */
export type TMachineSpot = {
  server: string
  name: string
  fits: boolean
  reachable?: boolean
  price?: number
  free?: { memMb: number; diskGb: number }
  cpuRoom?: number
}

/** It has room and, for a move, its source machine has an address to move from. */
export const usable = (m: TMachineSpot) => m.fits && m.reachable !== false
