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
 * Project groups shown as folders on the Projects page: related projects
 * (an API, its database, its cache) kept together.
 */
export type TFolder = Awaited<
  ReturnType<typeof ThunderSDK.projectGroups.get>
>["results"][number]

/** Moves projects in or out of a folder (`null`: out of any folder). */
export async function moveProjects(ids: string[], folder: string | null) {
  const results = await Promise.allSettled(
    ids.map((id) =>
      ThunderSDK.projects.update({ params: { id }, body: { group: folder } })
    )
  )
  return results.filter((r) => r.status === "rejected").length
}

/** Creates or renames a folder. */
export function FolderDialog({
  folder,
  open,
  onOpenChange,
  onSaved,
}: {
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
      const id = folder
        ? (await ThunderSDK.projectGroups.update({
            params: { id: folder._id },
            body,
          }),
          folder._id)
        : (await ThunderSDK.projectGroups.create({ body }))._id
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
              {t(
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
          {projects.length === 1
            ? t("1 project")
            : t("{{count}} projects", { count: projects.length })}
          {folder.description && ` · ${folder.description}`}
        </p>
        {(!!failed || !!live) && (
          <div className="mt-1.5 flex flex-wrap gap-1">
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
          </div>
        )}
      </div>
    </li>
  )
}

/** "Move to folder" for one project or a selection. */
export function MoveMenu({
  ids,
  folders,
  current,
  onMoved,
  onNewFolder,
  trigger,
}: {
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
  if (!ThunderSDK.isPermitted("projects", "update")) return null

  const move = async (folder: string | null) => {
    const failed = await moveProjects(ids, folder)
    if (failed)
      toast.error(
        t("Failed to move {{count}} of {{total}} project(s).", {
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
          {onNewFolder && ThunderSDK.isPermitted("projectGroups", "create") && (
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

/** Rename and delete for an open folder. Deleting keeps its projects. */
export function FolderActions({
  folder,
  projects,
  onRename,
  onDeleted,
}: {
  folder: TFolder
  projects: TProjectSummary[]
  onRename: () => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const canUpdate = ThunderSDK.isPermitted("projectGroups", "update")
  const canDelete = ThunderSDK.isPermitted("projectGroups", "del")
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
          description={t(
            "The folder goes; its {{count}} projects stay, outside any folder.",
            { count: projects.length }
          )}
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
              // Projects first: none may point at a folder that's gone.
              await moveProjects(
                projects.map((p) => p._id),
                null
              )
              await ThunderSDK.projectGroups.del({
                params: { id: folder._id },
              })
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
