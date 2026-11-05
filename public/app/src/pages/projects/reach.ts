import { ThunderSDK } from "thunder-sdk"

export type TReach = Awaited<ReturnType<typeof ThunderSDK.projects.reach>>
export type THop = TReach["domains"][number]["dns"]

const ORDER = ["failed", "warning", "ok", "skipped"] as const

/** A way's state: its worst checked hop; skipped only if nothing was checked. */
export const worst = (hops: THop[]): THop["state"] =>
  ORDER.find((s) => hops.some((h) => h.state === s)) ?? "skipped"
