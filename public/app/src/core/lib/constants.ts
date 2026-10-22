import type { Transition, Variants } from "motion/react"

// Trigger box grows into the full-width panel and back — one shared surface.
export const MORPH: Transition = {
  type: "spring",
  duration: 0.5,
  bounce: 0.22,
}

export const LIST: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.12 } },
}

export const ITEM: Variants = {
  hidden: { opacity: 0, y: -6, filter: "blur(3px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
}

// Shared padding for the account trigger + panel header so the avatar/name stay
// put as the box morphs — the panel reads as the trigger itself growing open.
export const HEAD = "flex items-center gap-2 px-2 py-1.5 text-left"

export const triggersTenantId = import.meta.env.VITE_TRIGGERS_TENANT_ID
export const triggersBaseUrl = import.meta.env.VITE_TRIGGERS_BASE_URL

/**
 * Unread-notification poll interval, in milliseconds.
 *
 * Vite env values are strings, so this must be parsed before reaching
 * `setInterval` — an unset/NaN value would otherwise poll at the 4ms minimum.
 */
/**
 * Currency code used when a wallet does not report one.
 *
 * Was hardcoded as a literal at four sites, one of them lowercase `"lyd"` right
 * after an `.toUpperCase()` branch.
 */
export const defaultCurrency = (
  import.meta.env.VITE_DEFAULT_CURRENCY || "LYD"
).toUpperCase()

export const unreadCountInterval =
  Number(import.meta.env.VITE_UNREAD_COUNT_INTERVAL) || 30_000
