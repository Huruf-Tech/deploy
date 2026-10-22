import { useTranslation } from "react-i18next"
import { formatDistanceToNowStrict } from "date-fns"
import {
  IconBrandGithub,
  IconBrandDocker,
  IconGitBranch,
  IconTemplate,
} from "@tabler/icons-react"
import { ThunderSDK } from "thunder-sdk"

import { cn } from "@/lib/utils"

export type TProject = Awaited<ReturnType<typeof ThunderSDK.projects.get>>
export type TProjectSummary = Awaited<
  ReturnType<typeof ThunderSDK.projects.list>
>[number]
export type TDeploymentSummary = Awaited<
  ReturnType<typeof ThunderSDK.projects.deployments>
>[number]
export type TDeploymentStatus = TDeploymentSummary["status"]

const DEPLOYMENT_STYLE: Record<
  TDeploymentStatus,
  { dot: string; pill: string; live?: boolean }
> = {
  queued: {
    dot: "bg-muted-foreground",
    pill: "bg-muted text-muted-foreground",
  },
  building: {
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    live: true,
  },
  deploying: {
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    live: true,
  },
  healthy: { dot: "bg-success", pill: "bg-success/10 text-success" },
  failed: { dot: "bg-destructive", pill: "bg-destructive/10 text-destructive" },
  cancelled: {
    dot: "bg-muted-foreground",
    pill: "bg-muted text-muted-foreground",
  },
}

export const isLive = (status?: TDeploymentStatus) =>
  !!status && !!DEPLOYMENT_STYLE[status].live

/** Status as dot + text, never colour alone (PLAN §15.4). */
export function DeploymentStatus({
  status,
  className,
}: {
  status: TDeploymentStatus
  className?: string
}) {
  const { t } = useTranslation()
  const label: Record<TDeploymentStatus, string> = {
    queued: t("Queued"),
    building: t("Building"),
    deploying: t("Deploying"),
    healthy: t("Live"),
    failed: t("Failed"),
    cancelled: t("Cancelled"),
  }
  const style = DEPLOYMENT_STYLE[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        style.pill,
        className
      )}
    >
      <span className="relative flex size-2">
        {style.live && (
          <span
            className={cn(
              "absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping",
              style.dot
            )}
          />
        )}
        <span
          className={cn("relative inline-flex size-2 rounded-full", style.dot)}
        />
      </span>
      {label[status]}
    </span>
  )
}

export function SourceIcon({
  source,
  className,
}: {
  source: string
  className?: string
}) {
  const Icon =
    source === "github"
      ? IconBrandGithub
      : source === "git"
        ? IconGitBranch
        : source === "image"
          ? IconBrandDocker
          : IconTemplate
  return <Icon className={cn("size-4", className)} aria-hidden />
}

export const ago = (date?: string) =>
  date ? formatDistanceToNowStrict(new Date(date), { addSuffix: true }) : ""

export const duration = (ms?: number) => {
  if (ms === undefined) return ""
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

export const shortSha = (sha?: string) => sha?.slice(0, 7)
