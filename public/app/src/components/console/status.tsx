import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

export type TTone = "success" | "warning" | "danger" | "info" | "neutral"

/** Every state the API reports, mapped once to a tone (DESIGN §5). */
const TONES: Record<string, TTone> = {
  online: "success",
  healthy: "success",
  running: "success",
  active: "success",
  succeeded: "success",
  success: "success",
  verified: "success",
  ready: "success",
  resolved: "success",
  pending: "warning",
  warning: "warning",
  degraded: "warning",
  unverified: "warning",
  building: "info",
  deploying: "info",
  queued: "info",
  new: "neutral",
  stopped: "neutral",
  cancelled: "neutral",
  canceled: "neutral",
  offline: "danger",
  failed: "danger",
  error: "danger",
  critical: "danger",
  unhealthy: "danger",
}

export const toneOf = (state?: string): TTone =>
  TONES[state?.toLowerCase() ?? ""] ?? "neutral"

/** A state's translation key: "pastDue" reads "Past due". */
export const stateLabel = (state: string) => {
  const words = state.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const DOT: Record<TTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground/60",
}

const BADGE: Record<TTone, string> = {
  success: "bg-success-soft text-success-foreground",
  warning: "bg-warning-soft text-warning-foreground",
  danger: "bg-destructive-soft text-destructive-foreground",
  info: "bg-info-soft text-info-foreground",
  neutral: "bg-muted text-muted-foreground",
}

const LIVE = new Set(["building", "deploying", "queued"])

/** A colored dot. Decorative: put the state in text beside it. */
export function StatusDot({
  state,
  tone = toneOf(state),
  className,
}: {
  state?: string
  tone?: TTone
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        DOT[tone],
        state && LIVE.has(state.toLowerCase()) && "motion-safe:animate-pulse",
        className
      )}
    />
  )
}

/** Dot + label; `label` defaults to the translated state. */
export function StatusBadge({
  state,
  tone = toneOf(state),
  label,
  className,
}: {
  state?: string
  tone?: TTone
  label?: React.ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-md px-1.5 text-xs font-medium whitespace-nowrap",
        BADGE[tone],
        className
      )}
    >
      <StatusDot state={state} tone={tone} className="size-1.5" />
      {label ?? (state ? t(stateLabel(state)) : null)}
    </span>
  )
}
