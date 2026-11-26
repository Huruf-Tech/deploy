import React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconCheck,
  IconFolder,
  IconFolderPlus,
  IconFolderSymlink,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react"

import { ConfirmationDialog } from "@/core/custom/ConfirmationDialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/console/status"
import { errorMessage } from "@/lib/utils"
import { isLive, type TProjectSummary } from "./shared"

/**
 * Folders on the Projects page (project groups: an API, its database, its
 * cache kept together) and on the Servers page (server groups), the same UI.
 */
export type TFolderKind = "projects" | "servers"

export type TFolder = { _id: string; name: string; description?: string }

/** Moves projects in or out of a folder (`null`: out of any folder). */
export async function moveProjects(ids: string[], folder: string | null) {
  const results = await Promise.allSettled(
    ids.map((id) =>
      ThunderSDK.projects.update({ params: { id }, body: { group: folder } })
    )
  )
  return results.filter((r) => r.status === "rejected").length
}

/** Moves servers in or out of a folder, in one request; how many failed. */
export async function moveServers(ids: string[], folder: string | null) {
  try {
    await ThunderSDK.servers.moveToFolder({
      body: { servers: ids, group: folder },
    })
    return 0
  } catch {
    return ids.length
  }
}

const MOVE = { projects: moveProjects, servers: moveServers }
const GROUPS = { projects: "projectGroups", servers: "serverGroups" } as const

/** Creates or renames a folder of either kind; its id. */
async function saveFolder(
  kind: TFolderKind,
  folder: TFolder | undefined,
  body: { name: string; description: string }
) {
  if (kind === "servers") {
    if (!folder) return (await ThunderSDK.serverGroups.create({ body }))._id
    await ThunderSDK.serverGroups.update({ params: { id: folder._id }, body })
    return folder._id
  }
  if (!folder) return (await ThunderSDK.projectGroups.create({ body }))._id
  await ThunderSDK.projectGroups.update({ params: { id: folder._id }, body })
  return folder._id
}

/** Creates or renames a folder. */
export function FolderDialog({
  kind = "projects",
  folder,
  open,
  onOpenChange,
  onSaved,
}: {
  kind?: TFolderKind
  folder?: TFolder
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (id: string) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setName(folder?.name ?? "")
    setDescription(folder?.description ?? "")
  }, [open, folder])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const body = { name: name.trim(), description: description.trim() }
      const id = await saveFolder(kind, folder, body)
      onSaved(id)
      onOpenChange(false)
    } catch (err) {
      toast.error(errorMessage(err) ?? t("Could not save the folder"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={save} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {folder ? t("Rename folder") : t("New folder")}
            </DialogTitle>
            <DialogDescription>
              {kind === "servers"
                ? t(
                    "Keep related servers together, like production, staging or one client's machines."
                  )
                : t(
                    "Keep related projects together, like an API with its database and cache."
                  )}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="folder-name">{t("Name")}</FieldLabel>
            <Input
              id="folder-name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("e.g. Shop")}
              autoFocus
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="folder-description">
              {t("Description")}
            </FieldLabel>
            <Textarea
              id="folder-description"
              rows={2}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={busy || !name.trim()}>
              {folder ? t("Save") : t("Create folder")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** A folder on the Projects page: name, how many projects, what's wrong. */
export function FolderCard({
  folder,
  projects,
  onOpen,
}: {
  folder: TFolder
  projects: TProjectSummary[]
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const failed = projects.filter(
    (p) => p.lastDeployment?.status === "failed"
  ).length
  const live = projects.filter((p) => isLive(p.lastDeployment?.status)).length
  return (
    <FolderTile
      folder={folder}
      count={
        projects.length === 1
          ? t("1 project")
          : t("{{count}} projects", { count: projects.length })
      }
      onOpen={onOpen}
      badges={
        <>
          {!!failed && (
            <StatusBadge
              state="failed"
              label={t("{{n}} failed", { n: failed })}
            />
          )}
          {!!live && (
            <StatusBadge
              state="building"
              label={t("{{n}} building", { n: live })}
            />
          )}
        </>
      }
      hasBadges={!!failed || !!live}
    />
  )
}

/** A folder card of either page: name, how many, and what needs a look. */
export function FolderTile({
  folder,
  count,
  badges,
  hasBadges,
  onOpen,
}: {
  folder: TFolder
  count: string
  badges?: React.ReactNode
  hasBadges?: boolean
  onOpen: () => void
}) {
  return (
    <li className="relative flex min-w-0 items-start gap-3 rounded-[10px] border bg-card p-3 transition-colors hover:bg-accent/50 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring">
      <IconFolder
        className="mt-0.5 size-5 shrink-0 text-brand-text"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {/* Stretched over the card: the whole card opens the folder. */}
        <button
          type="button"
          onClick={onOpen}
          className="block w-full truncate text-start text-sm font-semibold after:absolute after:inset-0 after:rounded-[10px] focus-visible:outline-none"
        >
          {folder.name}
        </button>
        <p className="truncate text-xs text-muted-foreground">
          {count}
          {folder.description && ` · ${folder.description}`}
        </p>
        {hasBadges && (
          <div className="mt-1.5 flex flex-wrap gap-1">{badges}</div>
        )}
      </div>
    </li>
  )
}

/** "Move to folder" for one project or a selection. */
export function MoveMenu({
  kind = "projects",
  ids,
  folders,
  current,
  onMoved,
  onNewFolder,
  trigger,
}: {
  kind?: TFolderKind
  ids: string[]
  folders: TFolder[]
  /** Creates a folder and moves these into it. */
  onNewFolder?: (ids: string[]) => void
  /** The folder these are in, if they share one. */
  current?: string
  onMoved: () => void
  trigger?: React.ReactElement
}) {
  const { t } = useTranslation()
  const canMove =
    kind === "servers"
      ? ThunderSDK.isPermitted("servers", "moveToFolder")
      : ThunderSDK.isPermitted("projects", "update")
  if (!canMove) return null

  const move = async (folder: string | null) => {
    const failed = await MOVE[kind](ids, folder)
    if (failed)
      toast.error(
        kind === "servers"
          ? t("Failed to move {{count}} of {{total}} server(s).", {
              count: failed,
              total: ids.length,
            })
          : t("Failed to move {{count}} of {{total}} project(s).", {
              count: failed,
              total: ids.length,
            })
      )
    else
      toast.success(
        folder
          ? t("Moved to {{name}}", {
              name: folders.find((f) => f._id === folder)?.name,
            })
          : t("Moved out of the folder")
      )
    onMoved()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          trigger ?? (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={t("Move to folder")}
              onClick={(e) => e.stopPropagation()}
            >
              <IconFolderSymlink />
            </Button>
          )
        }
      />
      <DropdownMenuContent align="end" className="min-w-52">
        {/* Base UI needs a label inside its group (error #31 otherwise). */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("Move to folder")}</DropdownMenuLabel>
          {folders.map((f) => (
            <DropdownMenuItem
              key={f._id}
              disabled={f._id === current}
              onClick={() => move(f._id)}
            >
              <IconFolder />
              <span className="flex-1 truncate">{f.name}</span>
              {f._id === current && <IconCheck />}
            </DropdownMenuItem>
          ))}
          {onNewFolder && ThunderSDK.isPermitted(GROUPS[kind], "create") && (
            <DropdownMenuItem onClick={() => onNewFolder(ids)}>
              <IconFolderPlus />
              {t("New folder…")}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {/* Only offered when there's a folder to leave. */}
        {current && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => move(null)}>
              {t("Take out of the folder")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Rename and delete for an open folder. Deleting keeps what's in it. */
export function FolderActions({
  kind = "projects",
  folder,
  ids,
  onRename,
  onDeleted,
}: {
  kind?: TFolderKind
  folder: TFolder
  /** What's in it. */
  ids: string[]
  onRename: () => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const canUpdate = ThunderSDK.isPermitted(GROUPS[kind], "update")
  const canDelete = ThunderSDK.isPermitted(GROUPS[kind], "del")
  if (!canUpdate && !canDelete) return null

  return (
    <>
      {canUpdate && (
        <Button size="sm" variant="outline" onClick={onRename}>
          <IconPencil aria-hidden /> {t("Rename")}
        </Button>
      )}
      {canDelete && (
        <ConfirmationDialog
          title={t("Delete {{name}}?", { name: folder.name })}
          description={
            kind === "servers"
              ? t(
                  "The folder goes; its {{count}} servers stay, outside any folder.",
                  { count: ids.length }
                )
              : t(
                  "The folder goes; its {{count}} projects stay, outside any folder.",
                  { count: ids.length }
                )
          }
          confirmText={t("Delete folder")}
          trigger={
            <Button
              size="sm"
              variant="outline"
              className="text-destructive-foreground"
            >
              <IconTrash aria-hidden /> {t("Delete")}
            </Button>
          }
          onConfirm={async (dismiss) => {
            try {
              if (kind === "servers") {
                // The server takes its servers out of the folder.
                await ThunderSDK.serverGroups.del({
                  params: { id: folder._id },
                })
              } else {
                // Projects first: none may point at a folder that's gone.
                await moveProjects(ids, null)
                await ThunderSDK.projectGroups.del({
                  params: { id: folder._id },
                })
              }
              toast.success(t("Folder deleted"))
              dismiss()
              onDeleted()
            } catch (err) {
              toast.error(errorMessage(err) ?? t("Could not delete the folder"))
            }
          }}
        />
      )}
    </>
  )
}
