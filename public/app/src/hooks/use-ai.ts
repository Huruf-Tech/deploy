import { ThunderSDK } from "thunder-sdk"
import { use } from "@/core/hooks/use"
import { useFresh } from "@/hooks/use-fresh"

/** Whether the tenant's plan includes the AI assistant, and this month's use. */
export function useAiStatus() {
  const request = ThunderSDK.useCaching(
    ["ai", "status"],
    async ({ signal }) => await ThunderSDK.ai.status({ signal })
  )
  useFresh(request)
  const { data } = use(request)
  return {
    status: ThunderSDK.isPermitted("ai", "draft") ? data : undefined,
    refresh: () => request.invalidate(),
  }
}
