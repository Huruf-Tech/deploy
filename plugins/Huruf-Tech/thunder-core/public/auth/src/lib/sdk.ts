import type { AxiosError } from "axios";
import { toast } from "sonner";
import { ThunderSDK } from "thunder-sdk";
import { apiOrigin } from "./api";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Skip the global error toast; the caller handles the failure itself. */
    silent?: boolean;
  }
}

const asText = (value: unknown): string | undefined => {
  if (typeof value === "string") return value.trim() || undefined;
  if (value && typeof value === "object" && "message" in value)
    return asText((value as { message: unknown }).message);
  return undefined;
};

/**
 * Best-effort human readable message from an SDK / axios error. The backend
 * answers with plain text, `{ message }` or `{ error: { name, message } }`.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  const data = (error as AxiosError)?.response?.data as
    | string
    | { message?: unknown; error?: unknown }
    | undefined;

  if (typeof data === "string") return asText(data) ?? fallback;

  return (
    asText(data?.message) ?? asText(data?.error) ?? asText(error) ?? fallback
  );
}

export function initSDK() {
  ThunderSDK.init({
    logs: import.meta.env.DEV,
    axiosConfig: {
      baseURL: apiOrigin,
      withCredentials: true,
    },
  });

  ThunderSDK._axios?.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (!error.config?.silent) toast.error(getErrorMessage(error));
      return Promise.reject(error);
    },
  );
}

/** Request options scoping a call to a tenant. */
export const tenantScope = (tenantId?: string | null) => ({
  axiosConfig: { headers: { "X-TENANT-ID": tenantId ?? null } },
});
