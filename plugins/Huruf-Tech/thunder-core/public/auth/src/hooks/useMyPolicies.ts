import useSWR from "swr";
import { ThunderSDK } from "thunder-sdk";
import { tenantScope } from "@/lib/sdk";

export function useMyPolicies(tenantId?: string | null) {
  const { data, error, isLoading } = useSWR(
    tenantId ? ["myPolicies", tenantId] : null,
    async ([, tenant]) =>
      await ThunderSDK.accessControlPolicies.myPolicies(tenantScope(tenant)),
  );

  return {
    isLoading,
    error: (error as Error | undefined) ?? null,
    myPolicies: data ?? null,
  };
}
