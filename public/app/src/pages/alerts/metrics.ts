import type { ThunderSDK } from "thunder-sdk"

type TRule = Awaited<ReturnType<typeof ThunderSDK.alertRules.list>>[number]

/** What each alert metric is called and measured in, and what it can watch. */
export const METRICS: Record<
  TRule["metric"],
  { label: string; unit?: string; kinds: TRule["target"]["kind"][] }
> = {
  cpu: { label: "CPU", unit: "%", kinds: ["server", "project"] },
  memory: { label: "Memory", unit: "%", kinds: ["server", "project"] },
  disk: { label: "Disk", unit: "%", kinds: ["server"] },
  room: { label: "Memory room", unit: "MiB", kinds: ["server"] },
  agentOffline: { label: "Server offline", kinds: ["server"] },
  deployFailed: { label: "Deploy failed", kinds: ["project"] },
}
