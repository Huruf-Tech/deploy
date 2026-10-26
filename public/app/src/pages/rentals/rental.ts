import { ThunderSDK } from "thunder-sdk"

import { use } from "@/core/hooks/use"
import type { TTone } from "@/components/console/status"

export type TRental = Awaited<
  ReturnType<typeof ThunderSDK.rentals.list>
>[number]

export const sizeText = (r: TRental) =>
  `${r.size.cpus} vCPU · ${Math.round((r.size.memMb / 1024) * 10) / 10} GB · ${r.size.diskGb} GB`

/** The tenant's rentals, shared by the servers list and a rented server's page. */
export function useRentals() {
  const request = ThunderSDK.useCaching(
    ["rentals", "list"],
    async ({ signal }) =>
      ThunderSDK.isPermitted("rentals", "list")
        ? await ThunderSDK.rentals.list({ signal })
        : []
  )
  return { rentals: use(request).data, reload: () => request.invalidate() }
}

/** How a rental's status reads (PLAN §26.9), with text, not color alone. */
export function rentalStatus(
  t: (key: string) => string,
  r: Pick<TRental, "status" | "cancelAtPeriodEnd">
): { tone: TTone; label: string } {
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
