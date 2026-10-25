import { useTranslation } from "react-i18next"
import { formatDistanceToNowStrict } from "date-fns"
import {
  IconBrandGithub,
  IconBrandDocker,
  IconGitBranch,
  IconStack2,
  IconTemplate,
} from "@tabler/icons-react"
import { ThunderSDK } from "thunder-sdk"

import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/console/status"

export type TProject = Awaited<ReturnType<typeof ThunderSDK.projects.get>>
export type TProjectSummary = Awaited<
  ReturnType<typeof ThunderSDK.projects.list>
>[number]
export type TDeploymentSummary = Awaited<
  ReturnType<typeof ThunderSDK.projects.deployments>
>[number]
export type TDeploymentStatus = TDeploymentSummary["status"]

const LIVE: TDeploymentStatus[] = ["building", "deploying"]

export const isLive = (status?: TDeploymentStatus) =>
  !!status && LIVE.includes(status)

/** Status as dot + text, never colour alone (PLAN §15.4, DESIGN §5). */
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
  return (
    <StatusBadge state={status} label={label[status]} className={className} />
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
          : source === "compose"
            ? IconStack2
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
