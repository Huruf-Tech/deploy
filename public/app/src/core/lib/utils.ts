import { ThunderSDK } from "thunder-sdk"
import { upload } from "@imagekit/react"
import Package from "../../../package.json"
import type { TRouteObject } from "../router"
import type { TNav } from "../layouts/shared/sub-nav"

import { converter, formatHex } from "culori"
import axios from "axios"
import { toast } from "sonner"
import { Capacitor } from "@capacitor/core"
import { format, formatDistanceToNow, isSameDay, subDays } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import i18next from "i18next"
import config from "../../../capacitor.config"

/**
 * Re-exported for backwards compatibility — these now live in `lib/constants`,
 * which is their single source of truth.
 */
export {
  triggersBaseUrl,
  triggersTenantId,
  unreadCountInterval,
} from "./constants"

export function appName() {
  return Package.name
    .replace("-", " ")
    .split(" ")
    .map((v) => ([2, 3].includes(v.length) ? v.toUpperCase() : v))
    .join(" ")
}

export const handleUpload = async (
  file: File,
  opts?: {
    folder?: string
    path?: string | string[]
    filename?: string
    signal?: AbortSignal
    onProgress?: (percentage: number) => void
  }
) => {
  const path = opts?.path instanceof Array ? opts.path.join("/") : opts?.path
  // Authenticate imagekit token
  const { signature, expire, token, publicKey } =
    await ThunderSDK.imageKit.auth()
  // Call the ImageKit SDK upload function with the required parameters and callbacks.
  return await upload({
    // Authentication parameters
    expire,
    token,
    signature,
    publicKey,
    file,
    fileName: [path?.replace(/^\/|\/$/g, ""), opts?.filename ?? file.name]
      .filter(Boolean)
      .join("/"), // Optionally set a custom file name
    // Progress callback to update upload progress state
    onProgress: (event) =>
      opts?.onProgress?.((event.loaded / event.total) * 100),
    // Abort signal to allow cancellation of the upload if needed.
    abortSignal: opts?.signal,
    folder: opts?.folder ?? (import.meta.env.VITE_UPLOAD_FOLDER || undefined),
  })
}

export function transformImage(
  src?: string | null,
  opts?: { width: number; height: number }
) {
  if (src) {
    const tr = `w-${opts?.width ?? 100},h-${opts?.height ?? 100}`

    try {
      const url = new URL(src)

      url.searchParams.set(
        "tr",
        `w-${opts?.width ?? 100},h-${opts?.height ?? 100}`
      )

      return url.toString()
    } catch {
      return [src, "?tr=", tr].join("")
    }
  }
}

export function getInitials(name?: string) {
  //! This used to destructure the *string*, so `last` was an array of characters
  //! and never empty: "John Doe" returned "JO" instead of "JD".
  const [first, ...rest] = (name || "Unnamed").trim().split(/\s+/)

  if (!first) return "?"

  const last = rest.at(-1)

  return (last ? `${first[0]}${last[0]}` : first.slice(0, 2)).toUpperCase()
}

export function resolveUrl(path?: string) {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
    .toString()
    .replace(/\/$/, "")

  if (path) {
    return new URL([baseUrl, path.trim().replace(/^\//, "")].join("/"))
  }

  return new URL(baseUrl)
}

export function getLocalUrl(path?: string) {
  return resolveUrl(getLocalPath(path))
}

export function getLocalPath(path?: string) {
  return [
    "",
    ThunderSDK.plugins.essentials.getTenant(),
    path?.trim().replace(/^\//, ""),
  ]
    .filter((path) => typeof path === "string")
    .join("/")
}

export function getAuthUrl(search: string = "") {
  const url = new URL(
    "/auth" + search,
    import.meta.env.VITE_API_BASE_URL || window.location.origin
  )

  url.searchParams.set(
    "returnUri",
    Capacitor.isNativePlatform() ? `${config.appId}://` : window.location.href
  )

  return url
}

export function formatDateForInput(
  value: Date | string | null | undefined,
  time = false
) {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  if (time) {
    const hour = String(date.getHours()).padStart(2, "0")
    const minute = String(date.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  return `${year}-${month}-${day}`
}

/**
 * Converts a module group name into its route path segment.
 *
 * Replaces every run of whitespace: `replace(" ", "-")` substituted only the
 * first one, so "Human Resources Admin" produced "human-resources admin", which
 * matched no route.
 */
export function groupPath(group?: string) {
  return group?.trim().toLowerCase().replace(/\s+/g, "-")
}

/**
 * Reads a boolean from a Vite env var.
 *
 * Every value in `import.meta.env` is a string, so `!import.meta.env.FLAG` was
 * true only when the variable was absent entirely — `FLAG=0` and `FLAG=false`
 * both read as enabled.
 */
export function envFlag(value: unknown, fallback = false) {
  if (value === undefined || value === "") return fallback

  return !["0", "false", "off", "no"].includes(String(value).toLowerCase())
}

/**
 * Parses the value of an `<input type="date">` or `type="datetime-local">`.
 *
 * `new Date("2024-01-15")` is parsed as UTC midnight per spec, while
 * `formatDateForInput` reads the date back with *local* getters. In any negative
 * UTC offset that round-trips to the previous day, so a record edited in the
 * Americas would shift every date back by one on each save. Building the Date
 * from local parts makes the round-trip offset-independent. Empty input yields
 * `null` rather than `Invalid Date`.
 */
export function parseDateInput(value: string): Date | null {
  if (!value) return null

  const [datePart, timePart] = value.split("T")
  const [year, month, day] = datePart.split("-").map(Number)

  if (!year || !month || !day) return null

  const [hour, minute] = (timePart ?? "").split(":").map(Number)

  const date = new Date(year, month - 1, day, hour || 0, minute || 0)

  if (Number.isNaN(date.getTime())) return null

  // `new Date(2024, 12, 45)` silently rolls over into 2025-02-13 rather than
  // failing, so confirm the parts survived instead of returning a different day.
  const rolledOver =
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day

  return rolledOver ? null : date
}

export function allowDisplayRoute(display?: boolean | (() => boolean)) {
  if (typeof display === "function") return display()
  return display ?? true
}

export function getRouteSortIndex(
  route?: Pick<TRouteObject, "priority">
): number {
  const priority = route?.priority

  if (typeof priority === "number") {
    return Number.isFinite(priority) ? priority : 0
  }

  if (typeof priority === "function") {
    const result = priority()
    return typeof result === "number" && Number.isFinite(result) ? result : 0
  }

  return 0
}

export function sortRoutes<T extends TRouteObject>(routes: T[]): T[] {
  return routes
    .map((route, originalIndex) => ({
      route,
      originalIndex,
      sortIndex: getRouteSortIndex(route),
    }))
    .sort((a, b) => {
      if (a.sortIndex !== b.sortIndex) {
        return a.sortIndex - b.sortIndex
      }

      return a.originalIndex - b.originalIndex
    })
    .map(({ route }) => route)
}

export function getNavRoutes(router: TRouteObject[]) {
  const routes: TNav[] = []
  const subRoutes: TNav[] = []

  for (const route of sortRoutes(router)) {
    if (!allowDisplayRoute(route.display)) continue

    const children = sortRoutes((route.children ?? []) as TRouteObject[])

    for (const child of children) {
      if (!allowDisplayRoute(child.display)) continue

      const parentPath = child.path ?? "/"

      routes.push({
        title: child.name || "Unnamed Route",
        icon: child.icon,
        path: parentPath,
        button: child.button,
      })

      const childRoutes = sortRoutes((child.children ?? []) as TRouteObject[])

      for (const subChild of childRoutes) {
        if (!allowDisplayRoute(subChild.display)) continue

        subRoutes.push({
          title: subChild.name || "Unnamed Route",
          icon: subChild.icon,
          path: subChild.path,
          parent: parentPath,
          button: subChild.button,
        })
      }
    }
  }

  const subRoutesByParent = Object.groupBy(subRoutes, (item) => item.parent!)

  return {
    routes,
    subRoutes: subRoutesByParent,
  }
}

const toRgb = converter("rgb")

export function rgbToHex(oklch: string) {
  const rgb = toRgb(oklch)

  if (!rgb) {
    throw new Error("Invalid OKLCH color")
  }

  return formatHex(rgb)
}

export function isMobileLayout() {
  return ["mobile"].includes(import.meta.env.VITE_APP_LAYOUT)
}

export const loadTailwindCSS = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ""

    const url = baseUrl ? `${baseUrl}app/tailwind.min.css` : "/tailwind.min.css"

    return (await axios.get(url)).data
  } catch (error) {
    console.error("Error fetching Tailwind CSS:", error)
  }
}

export const loadFontsCSS = async () => {
  try {
    // Fetch the latest Fonts
    return (
      await axios.get(
        "https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap"
      )
    ).data
  } catch (error) {
    console.error("Error fetching Font CSS:", error)
  }
}

export const printWindow = (content: string) => {
  const blob = new Blob([content], {
    type: "text/html",
  })

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob)

  // Open the URL in a new window
  window.open(url, "_blank", "popup=yes")
}

type HTMLBuilder<T> = (data: T & { content: string }) => Promise<string>

export const printDocument = async <T>(
  reference: React.RefObject<HTMLDivElement | null>,
  builder: HTMLBuilder<T>,
  data: T
) => {
  if (!reference.current) {
    toast.error("Nothing is available to print!")
    return
  }

  try {
    const content = reference.current.innerHTML

    const fullData = { ...data, content }

    const fullHTML = await builder(fullData)

    if (Capacitor.getPlatform() === "web") {
      printWindow(fullHTML)
    } else {
      const printer = cordova?.plugins?.printer
      if (!printer?.print) {
        toast.error("Printing is not available on this device.")
        return
      }
      // Cordova printer is callback-based (returns void) — not a Promise, so
      // never chain .then/.catch on it. The callback gets a boolean result.
      printer.print(fullHTML, {}, (ok: boolean) => {
        if (ok === false) console.info("Print dialog dismissed")
      })
    }
  } catch (err) {
    console.error("Print error:", err)
    toast.error("Failed to open the print dialog.")
  }
}

/**
 * date-fns needs the locale passed explicitly; without it every relative time
 * and month name rendered in English even in the Arabic UI.
 */
const dateLocale = () => (i18next.language?.startsWith("ar") ? ar : enUS)

export const timeAgo = (dateStr: string | number | Date) =>
  formatDistanceToNow(new Date(dateStr), {
    addSuffix: true,
    locale: dateLocale(),
  })

export const getDateGroup = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()

  if (isSameDay(date, now)) return i18next.t("Today")
  if (isSameDay(date, subDays(now, 1))) return i18next.t("Yesterday")

  return format(date, "MMM d, yyyy", { locale: dateLocale() })
}
