import useSWRImmutable from "swr/immutable";
import HurufLogo from "@/assets/huruf-logo.png";
import { getAppBranding } from "@/lib/api";

/** Shown only until branding loads, or if the backend sends no name. */
export const DEFAULT_APP_NAME = "Huruf Tech";

/** Used when the backend sends no logo, or the logo fails to load. */
export const DEFAULT_LOGO = HurufLogo;

/**
 * The project's branding (name, logo, colors, legal links) served by the
 * backend at `/auth/branding`. Every brand surface in the UI reads from here.
 */
export function useAppBranding() {
  const { data, error, isLoading } = useSWRImmutable(
    "app-branding",
    getAppBranding,
  );
  const app = data?.name ? data : null;

  return {
    isLoading,
    error: (error as Error | undefined) ?? null,
    app,
    appName: app?.name ?? DEFAULT_APP_NAME,
    /** The project's logo, falling back to the Huruf logo. */
    logo: app?.logo || app?.icon || DEFAULT_LOGO,
  };
}
