/**
 * Origin of the Thunder backend. An empty `VITE_API_ORIGIN` (production) means
 * the app is served from the same origin as the API.
 */
export const apiOrigin =
  import.meta.env.VITE_API_ORIGIN || window.location.origin;

export type TAppBranding = {
  name: string;
  description?: string;
  icon?: string;
  logo?: string;
  homepageURL?: string;
  termsURL?: string;
  privacyURL?: string;
  supportEmail?: string;
  hidePoweredBy?: boolean;
  /** Background image of the sign-in brand panel. */
  heroImage?: string;
  /** Headline of the sign-in brand panel. */
  heroTitle?: string;
  theme?: Record<`--${string}`, string>;
};

/** Capability flags the backend can enable for this deployment. */
export type TCapability =
  | "signup"
  | "email"
  | "passkey"
  | "2fa"
  | "magicLink"
  | "multiSession"
  | (string & {});

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(new URL(path, apiOrigin), { method: "GET" });

  if (!res.ok) {
    throw new Error(
      (await res.text()) || `Request failed with status ${res.status}`,
    );
  }

  return (await res.json()) as T;
}

export const getAppBranding = () => getJSON<TAppBranding>("/auth/branding/");

export const getAuthCapabilities = async () =>
  (await getJSON<{ capabilities: TCapability[] }>("/auth/api/capabilities"))
    .capabilities;
