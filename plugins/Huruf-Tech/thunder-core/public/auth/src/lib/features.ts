/**
 * Build-time feature flags, read from `VITE_ENABLE_*` environment variables.
 *
 * Every feature is enabled unless its variable is set to a falsy value
 * ("false", "0", "off", "no"). Vite inlines these at build time, so changing
 * one requires a rebuild.
 *
 * These only hide UI. Access is still enforced by the backend's permissions,
 * and sign-in methods are toggled by the backend's capabilities, not here.
 */
const flag = (value: string | undefined) =>
  !["false", "0", "off", "no"].includes((value ?? "").trim().toLowerCase());

export const features = {
  /** Developers → OAuth apps */
  oauthApps: flag(import.meta.env.VITE_ENABLE_OAUTH_APPS),
  /** Developers → API keys */
  apiKeys: flag(import.meta.env.VITE_ENABLE_API_KEYS),
  /** Tenant members & invitations (also requires `?tenant=`) */
  members: flag(import.meta.env.VITE_ENABLE_MEMBERS),
  /** Security → Connected accounts (link / unlink social providers) */
  connectedAccounts: flag(import.meta.env.VITE_ENABLE_CONNECTED_ACCOUNTS),
  /** Security → Your devices (active sessions, remote sign-out) */
  deviceSessions: flag(import.meta.env.VITE_ENABLE_DEVICE_SESSIONS),
  /** Personal info → editing name, gender, birthday and photo */
  profileEditing: flag(import.meta.env.VITE_ENABLE_PROFILE_EDITING),
  /** Light / dark / system toggle in the header */
  themeSwitcher: flag(import.meta.env.VITE_ENABLE_THEME_SWITCHER),
  /** Language picker in the header */
  languageSwitcher: flag(import.meta.env.VITE_ENABLE_LANGUAGE_SWITCHER),
} as const;

export type TFeature = keyof typeof features;
