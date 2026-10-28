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
  /** Why the owner's own machine can't take it, other than room. */
  blocked?: string
}

/** It has room and, for a move, its source machine has an address to move from. */
export const usable = (m: TMachineSpot) => m.fits && m.reachable !== false

/** Size steps (PLAN §30.5): 0.25 vCPU, 256 MB of memory, 1 GB of disk. */
export const stepSize = (
  s: { vcpu: number; memMb: number; diskGb: number },
  round: (n: number) => number = Math.round
) => ({
  vcpu: Math.max(0.25, round(s.vcpu * 4) / 4),
  memMb: Math.max(512, round(s.memMb / 256) * 256),
  diskGb: Math.max(5, round(s.diskGb)),
})

/** Everything free on a machine, in whole steps (rounded down so it fits). */
export const freeSize = (m: TMarketMachine) =>
  stepSize(
    { vcpu: m.free.cpus, memMb: m.free.memMb, diskGb: m.free.diskGb },
    Math.floor
  )
