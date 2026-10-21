/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Thunder backend origin; empty means same origin as the app. */
  readonly VITE_API_ORIGIN?: string;

  // Feature flags (see src/lib/features.ts). Unset means enabled.
  readonly VITE_ENABLE_OAUTH_APPS?: string;
  readonly VITE_ENABLE_API_KEYS?: string;
  readonly VITE_ENABLE_MEMBERS?: string;
  readonly VITE_ENABLE_CONNECTED_ACCOUNTS?: string;
  readonly VITE_ENABLE_DEVICE_SESSIONS?: string;
  readonly VITE_ENABLE_PROFILE_EDITING?: string;
  readonly VITE_ENABLE_THEME_SWITCHER?: string;
  readonly VITE_ENABLE_LANGUAGE_SWITCHER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
