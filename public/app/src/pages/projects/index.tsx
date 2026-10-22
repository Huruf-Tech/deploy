import { ThunderSDK } from "thunder-sdk"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { IconPlus, IconRocket, IconServer2 } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { use } from "@/core/hooks/use"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { usePolling } from "@/hooks/use-polling"
import {
  ago,
  DeploymentStatus,
  isLive,
  shortSha,
  SourceIcon,
  type TProjectSummary,
} from "./shared"

function ProjectCard({ project }: { project: TProjectSummary }) {
  const { t } = useTranslation()
  const last = project.lastDeployment

  return (
    <div className="relative flex flex-col gap-3 rounded-3xl border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* The whole card is the link. */}
          <Link
            to={`./${project._id}`}
            className="font-medium after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none after:focus-visible:ring-2 after:focus-visible:ring-ring"
          >
            {project.name}
          </Link>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <SourceIcon
              source={project.sourceType}
              className="size-3.5 shrink-0"
            />
            <span className="truncate">{project.source}</span>
          </p>
        </div>
        {last ? (
          <DeploymentStatus status={last.status} />
        ) : (
          <Badge variant="outline">{t("Not deployed")}</Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {project.release !== undefined && (
          <span className="font-medium text-foreground">
            {t("Release {{n}}", { n: project.release })}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <IconServer2 className="size-3.5" aria-hidden />
          {t("{{count}} servers", { count: project.servers })}
        </span>
        {project.publicPort && <span>:{project.publicPort}</span>}
        {last && (
          <span className="min-w-0 truncate">
            {last.commit?.message ?? shortSha(last.commit?.sha)} ·{" "}
            {ago(last.createdAt)}
          </span>
        )}
      </div>
    </div>
  )
}

/** Projects (PLAN §15.6): what runs, where, and how the last deploy went. */
export default function ProjectsPage() {
  const { t } = useTranslation()
  const request = ThunderSDK.useCaching(
    ["projects"],
    async ({ signal }) => await ThunderSDK.projects.list({ signal })
  )
  const { data, isLoading } = use(request)

  // Refresh while something is building or deploying.
  usePolling(() => {
    if (data?.some((p) => isLive(p.lastDeployment?.status)))
      request.invalidate()
  }, 4_000)

  const create = (
    <Button render={<Link to="./new" />} nativeButton={false}>
      <IconPlus aria-hidden /> {t("New project")}
    </Button>
  )

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t("Projects")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("Apps and services running on your servers.")}
          </p>
        </div>
        {!!data?.length && create}
      </div>

      {isLoading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      ) : !data?.length ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconRocket />
            </EmptyMedia>
            <EmptyTitle>{t("Deploy your first project")}</EmptyTitle>
            <EmptyDescription>
              {t(
                "From a GitHub repository, any Git repository, a Docker image, or a one-click database."
              )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{create}</EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </Page>
  )
}
