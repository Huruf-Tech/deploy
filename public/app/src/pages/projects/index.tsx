import React from "react"
import { ThunderSDK } from "thunder-sdk"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import {
  IconArrowLeft,
  IconFolderPlus,
  IconFolderSymlink,
  IconPlus,
  IconRocket,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { use } from "@/core/hooks/use"
import { Button } from "@/components/ui/button"
import { usePolling } from "@/hooks/use-polling"
import { useFresh } from "@/hooks/use-fresh"
import { PageHeader } from "@/components/console/page-header"
import { StatusBadge } from "@/components/console/status"
import { Toolbar } from "@/components/console/toolbar"
import { DataTable, type TColumn } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import {
  SelectAllCheckbox,
  SelectCheckbox,
  SelectionBar,
  useSelection,
} from "@/components/selection-bar"
import {
  ago,
  DeploymentStatus,
  isLive,
  shortSha,
  SourceIcon,
  type TProjectSummary,
} from "./shared"
import {
  FolderActions,
  FolderCard,
  FolderDialog,
  MoveMenu,
  useFolders,
  type TFolder,
} from "./folders"

/** Projects (PLAN §15.6): what runs, where, and how the last deploy went. */
export default function ProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const request = ThunderSDK.useCaching(
    ["projects"],
    async ({ signal }) => await ThunderSDK.projects.list({ signal })
  )
  useFresh(request)
  const { data, isLoading } = use(request)
  const selection = useSelection()
  const [search, setSearch] = React.useState("")
  const foldersRequest = useFolders()
  const folders = use(foldersRequest).data ?? []
  // The open folder lives in the URL, so back/forward and links work.
  const [params, setParams] = useSearchParams()
  const open = folders.find((f) => f._id === params.get("folder"))
  const [editing, setEditing] = React.useState<TFolder | "new" | null>(null)
  const openFolder = (id: string | null) => {
    selection.clear()
    setParams(id ? { folder: id } : {})
  }
  const refresh = () => {
    request.invalidate()
    foldersRequest.invalidate()
  }
  const folderOf = (p: TProjectSummary) =>
    folders.some((f) => f._id === p.group) ? p.group : undefined

  // Refresh while something is building or deploying.
  usePolling(() => {
    if (data?.some((p) => isLive(p.lastDeployment?.status)))
      request.invalidate()
  }, 4_000)

  const q = search.trim().toLowerCase()
  // Searching looks everywhere; otherwise the open folder, or what's in none.
  const rows = q
    ? data?.filter((p) =>
        [p.name, p.slug, p.source].some((s) => s.toLowerCase().includes(q))
      )
    : data?.filter((p) => folderOf(p) === open?._id)
  const inFolder = (id: string) => (data ?? []).filter((p) => p.group === id)
  const live = data?.filter((p) => isLive(p.lastDeployment?.status)).length
  const failed = data?.filter(
    (p) => p.lastDeployment?.status === "failed"
  ).length

  const create = (
    <Button
      size="sm"
      render={<Link to={open ? `./new?group=${open._id}` : "./new"} />}
      nativeButton={false}
    >
      <IconPlus aria-hidden /> {t("New project")}
    </Button>
  )
  const newFolder = ThunderSDK.isPermitted("projectGroups", "create") && (
    <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
      <IconFolderPlus aria-hidden /> {t("New folder")}
    </Button>
  )

  const columns: TColumn<TProjectSummary>[] = [
    {
      id: "select",
      header: (
        <SelectAllCheckbox
          selection={selection}
          ids={(rows ?? []).map((p) => p._id)}
        />
      ),
      className: "w-8 pe-0",
      cell: (p) => (
        <SelectCheckbox selection={selection} id={p._id} label={p.name} />
      ),
    },
    {
      id: "name",
      header: t("Project"),
      sortValue: (p) => p.name,
      cell: (p) => (
        <div className="min-w-36">
          <Link
            to={`./${p._id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {p.name}
          </Link>
          <div
            dir="ltr"
            className="truncate font-mono text-[11px] text-muted-foreground"
          >
            {p.slug}
          </div>
        </div>
      ),
    },
    {
      id: "kind",
      header: t("Kind"),
      className: "max-sm:hidden",
      sortValue: (p) => p.kind,
      cell: (p) => (
        <span className="text-muted-foreground">
          {p.kind === "app" ? t("App") : t("Service")}
        </span>
      ),
    },
    {
      id: "source",
      header: t("Source"),
      className: "max-md:hidden",
      sortValue: (p) => p.source,
      cell: (p) => (
        <span className="flex max-w-64 items-center gap-1.5 text-muted-foreground">
          <SourceIcon source={p.sourceType} className="size-3.5 shrink-0" />
          <span dir="ltr" className="truncate font-mono text-xs">
            {p.source}
          </span>
        </span>
      ),
    },
    {
      id: "deployment",
      header: t("Last deployment"),
      sortValue: (p) => p.lastDeployment?.createdAt,
      cell: (p) => {
        const last = p.lastDeployment
        if (!last) return <StatusBadge state="new" label={t("Not deployed")} />
        return (
          <div className="flex min-w-0 items-center gap-2">
            <DeploymentStatus status={last.status} />
            <span className="min-w-0 truncate text-xs text-muted-foreground max-lg:hidden">
              {last.commit?.message ?? shortSha(last.commit?.sha)}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {ago(last.createdAt)}
            </span>
          </div>
        )
      },
    },
    {
      id: "release",
      header: t("Release"),
      className: "max-lg:hidden",
      align: "end",
      sortValue: (p) => p.release ?? -1,
      cell: (p) => (p.release !== undefined ? `#${p.release}` : "—"),
    },
    {
      id: "servers",
      header: t("Servers"),
      align: "end",
      className: "max-sm:hidden",
      sortValue: (p) => p.servers,
      cell: (p) => (
        <span>
          {p.servers}
          {p.publicPort && (
            <span
              dir="ltr"
              className="ms-2 font-mono text-xs text-muted-foreground"
            >
              :{p.publicPort}
            </span>
          )}
        </span>
      ),
    },
    ...(q && folders.length
      ? [
          {
            id: "folder",
            header: t("Folder"),
            className: "max-md:hidden",
            sortValue: (p: TProjectSummary) =>
              folders.find((f) => f._id === folderOf(p))?.name,
            cell: (p: TProjectSummary) => (
              <span className="text-muted-foreground">
                {folders.find((f) => f._id === folderOf(p))?.name ?? "—"}
              </span>
            ),
          },
        ]
      : []),
    {
      id: "move",
      header: <span className="sr-only">{t("Actions")}</span>,
      align: "end",
      className: "w-10",
      cell: (p) => (
        <MoveMenu
          ids={[p._id]}
          folders={folders}
          current={folderOf(p)}
          onMoved={refresh}
        />
      ),
    },
  ]

  return (
    <Page className="flex flex-col gap-4 py-5">
      {open ? (
        <>
          <Button
            size="sm"
            variant="ghost"
            className="-mb-2 self-start text-muted-foreground"
            onClick={() => openFolder(null)}
          >
            <IconArrowLeft className="icon-flip-rtl" aria-hidden />
            {t("All projects")}
          </Button>
          <PageHeader
            title={open.name}
            status={
              <span className="text-xs text-muted-foreground tabular-nums">
                {rows?.length === 1
                  ? t("1 project")
                  : t("{{count}} projects", { count: rows?.length ?? 0 })}
              </span>
            }
            description={open.description || t("A folder of projects.")}
            actions={
              <>
                <FolderActions
                  folder={open}
                  projects={inFolder(open._id)}
                  onRename={() => setEditing(open)}
                  onDeleted={() => {
                    openFolder(null)
                    refresh()
                  }}
                />
                {create}
              </>
            }
          />
        </>
      ) : (
        <PageHeader
          title={t("Projects")}
          status={
            !!data?.length && (
              <span className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                {data.length === 1
                  ? t("1 project")
                  : t("{{count}} projects", { count: data.length })}
                {!!live && (
                  <StatusBadge
                    state="building"
                    label={t("{{n}} building", { n: live })}
                  />
                )}
                {!!failed && (
                  <StatusBadge
                    state="failed"
                    label={t("{{n}} failed", { n: failed })}
                  />
                )}
              </span>
            )
          }
          description={t("Apps and services running on your servers.")}
          actions={
            <>
              {newFolder}
              {create}
            </>
          }
        />
      )}

      {!isLoading && !data?.length && !folders.length ? (
        <EmptyState
          icon={IconRocket}
          title={t("Deploy your first project")}
          description={t(
            "From a GitHub repository, any Git repository, a Docker image, or a one-click database."
          )}
          action={create}
        />
      ) : (
        <>
          <Toolbar
            search={search}
            onSearch={setSearch}
            placeholder={t("Filter projects…")}
            actions={
              selection.ids.length > 0 && (
                <MoveMenu
                  ids={selection.ids}
                  folders={folders}
                  current={open?._id}
                  onMoved={() => {
                    selection.clear()
                    refresh()
                  }}
                  trigger={
                    <Button size="sm" variant="outline">
                      <IconFolderSymlink aria-hidden />
                      {t("Move {{n}} to folder", { n: selection.ids.length })}
                    </Button>
                  }
                />
              )
            }
          />
          {!q && !open && folders.length > 0 && (
            <section
              aria-labelledby="folders-title"
              className="flex flex-col gap-2"
            >
              <h2 id="folders-title" className="text-sm font-semibold">
                {t("Folders")}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {folders.map((f) => (
                  <FolderCard
                    key={f._id}
                    folder={f}
                    projects={inFolder(f._id)}
                    onOpen={() => openFolder(f._id)}
                  />
                ))}
              </ul>
            </section>
          )}
          {!q && !open && folders.length > 0 && (
            <h2 className="-mb-2 text-sm font-semibold">
              {t("Not in a folder")}
            </h2>
          )}
          <div aria-live="polite">
            <DataTable
              label={t("Projects")}
              columns={columns}
              rows={rows}
              rowId={(p) => p._id}
              isSelected={(p) => selection.has(p._id)}
              loading={isLoading}
              empty={
                q
                  ? t("No projects match the filter.")
                  : open
                    ? t(
                        "This folder is empty. Move projects here from their menu, or create one."
                      )
                    : data?.length
                      ? t("Every project is in a folder.")
                      : t("No projects yet.")
              }
              onRowClick={(p) => navigate(`./${p._id}`)}
            />
          </div>
        </>
      )}

      <FolderDialog
        open={!!editing}
        folder={editing === "new" ? undefined : (editing ?? undefined)}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={(id) => {
          foldersRequest.invalidate()
          if (editing === "new") openFolder(id)
        }}
      />

      <SelectionBar
        selection={selection}
        canDelete={ThunderSDK.isPermitted("projects", "del")}
        remove={(id) => ThunderSDK.projects.del({ params: { id } })}
        onDone={() => request.invalidate()}
      />
    </Page>
  )
}
