import { refreshCssVars } from "./cssVars"

/**
 * Branding applied to the document.
 *
 * The backend serves a theme as a flat map of CSS custom properties
 * (`{ "--primary": "oklch(…)", … }`), which is exactly the shape the Tailwind
 * tokens in `src/index.css` already declare. Writing them as inline properties
 * on `:root` puts them one specificity step above the stylesheet, so a brand
 * overrides whichever tokens it sends and inherits the rest.
 */

/**
 * Writes a branding theme onto `:root`.
 *
 * Keys that are not custom properties are skipped rather than trusted: this
 * data comes off the network, and `style.setProperty` with an arbitrary key is
 * a way to set real CSS properties on the whole document.
 *
 * One `refreshCssVars()` at the end rather than a notify per key -- `useCssVar`
 * subscribers (the Capacitor system-bar colour, for one) only need to re-read
 * once the whole theme has landed.
 */
export function applyThemeVars(vars: Record<string, string>) {
  if (typeof document === "undefined") return

  const root = document.documentElement

  for (const [key, value] of Object.entries(vars)) {
    if (!key.startsWith("--")) continue

    root.style.setProperty(key, value)
  }

  refreshCssVars()
}

/** Points the tab icon at a branding logo, replacing the one in `index.html`. */
export function setFavicon(href: string) {
  if (typeof document === "undefined" || !href) return

  const link =
    document.querySelector<HTMLLinkElement>("link[rel~='icon']") ??
    document.head.appendChild(
      Object.assign(document.createElement("link"), { rel: "icon" })
    )

  link.href = href
}
