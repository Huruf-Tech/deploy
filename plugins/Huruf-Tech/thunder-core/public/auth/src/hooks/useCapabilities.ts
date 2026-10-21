import React from "react";
import useSWRImmutable from "swr/immutable";
import { getAuthCapabilities, type TCapability } from "@/lib/api";

export function useCapabilities() {
  const { data, error, isLoading } = useSWRImmutable(
    "auth-capabilities",
    getAuthCapabilities,
  );

  const has = React.useCallback(
    (capability: TCapability) => !!data?.includes(capability),
    [data],
  );

  return {
    isLoading,
    error: (error as Error | undefined) ?? null,
    capabilities: data ?? null,
    has,
  };
}
