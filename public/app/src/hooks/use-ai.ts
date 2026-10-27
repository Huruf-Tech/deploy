import { ThunderSDK } from "thunder-sdk"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

/** Whether the tenant's plan includes the AI assistant, and this month's use. */
export function useAiStatus() {
  const { data, reload } = useCached(queries.aiStatus())
  return {
    status: ThunderSDK.isPermitted("ai", "draft") ? data : undefined,
    refresh: reload,
  }
}
