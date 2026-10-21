import { envFlag } from "./utils"

/**
 * Opt-in switches for the feature pages that ship with the boilerplate.
 *
 * All default to **off**: a generated app should not inherit wallet, user or
 * notification UI it never asked for. Set the matching `VITE_ENABLE_*` to `1`
 * in the project's env file to turn one on.
 *
 * Replaces `VITE_DISABLE_WALLET`, which was the only flag and ran the opposite
 * way.
 */
export const features = {
  wallet: envFlag(import.meta.env.VITE_ENABLE_WALLET),
  users: envFlag(import.meta.env.VITE_ENABLE_USERS),
  notifications: envFlag(import.meta.env.VITE_ENABLE_NOTIFICATIONS),
} as const
