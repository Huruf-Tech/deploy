import i18n from "@/i18n"
import { timeAgo } from "@/core/lib/utils"

/** The UI language for `Intl`, with Latin digits like the rest of the console. */
const locale = () => `${i18n.resolvedLanguage ?? "en"}-u-nu-latn`

type TDate = string | number | Date | null | undefined

/** Megabytes: "512 MB", "1.5 GB" (binary, as the agents report). */
export const mb = (n: number) =>
  n >= 1024 ? `${(n / 1024).toFixed(1)} GB` : `${Math.round(n)} MB`

/** Bytes, read like `mb`. */
export const bytes = (n: number) => mb(n / 2 ** 20)

/** MB as GB to one decimal, rounded down so a limit never promises more than there is. */
export const gbOfMb = (n: number) => Math.floor((n / 1024) * 10) / 10

/** A size: "2 vCPU · 4 GB · 50 GB". */
export const sizeText = (s: { cpus: number; memMb: number; diskGb: number }) =>
  `${s.cpus} vCPU · ${gbOfMb(s.memMb)} GB · ${s.diskGb} GB`

/** Dollars as typed into an input, to cents (NaN when it isn't a number). */
export const toCents = (dollars: string | number) =>
  String(dollars).trim() === "" ? NaN : Math.round(Number(dollars) * 100)

/** Cents as dollars, for an input's value. */
export const toDollars = (cents: number) => cents / 100

/** A date in the UI language, or "—". */
export const day = (d: TDate) =>
  d ? new Date(d).toLocaleDateString(locale()) : "—"

/** A date and time in the UI language, or "—". */
export const dateTime = (
  d: TDate,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
) => (d ? new Date(d).toLocaleString(locale(), options) : "—")

/** "3 minutes ago" in the UI language, or "". */
export const ago = (d: TDate) => (d ? timeAgo(d) : "")
