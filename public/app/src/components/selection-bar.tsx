import * as React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconTrash, IconX } from "@tabler/icons-react"

import { ActionBar } from "@/core/custom/ActionBar"
import { ConfirmationDialog } from "@/core/custom/ConfirmationDialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

/** Which items of a custom list page are selected (by id). */
export function useSelection() {
  const [ids, setIds] = React.useState<string[]>([])
  const toggle = React.useCallback(
    (id: string) =>
      setIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
    []
  )
  const clear = React.useCallback(() => setIds([]), [])
  return { ids, setIds, toggle, clear, has: (id: string) => ids.includes(id) }
}

export type TSelection = ReturnType<typeof useSelection>

/** A row/card checkbox bound to a selection. */
export function SelectCheckbox({
  selection,
  id,
  label,
}: {
  selection: TSelection
  id: string
  label: string
}) {
  const { t } = useTranslation()
  return (
    <Checkbox
      aria-label={t("Select {{name}}", { name: label })}
      checked={selection.has(id)}
      onCheckedChange={() => selection.toggle(id)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    />
  )
}

/** "Select all" for the visible items: checked, partial or empty. */
export function SelectAllCheckbox({
  selection,
  ids,
}: {
  selection: TSelection
  ids: string[]
}) {
  const { t } = useTranslation()
  const picked = ids.filter(selection.has).length
  return (
    <Checkbox
      aria-label={t("Select all")}
      checked={!!ids.length && picked === ids.length}
      indeterminate={picked > 0 && picked < ids.length}
      onCheckedChange={(on) => selection.setIds(on ? ids : [])}
    />
  )
}

/**
 * The floating bar of core's list pages, for custom ones: the count, delete
 * (with confirmation) and clear. `remove` deletes one item; failures are
 * counted, not thrown, so the rest still go.
 */
export function SelectionBar({
  selection,
  remove,
  onDone,
  canDelete = true,
}: {
  selection: TSelection
  remove: (id: string) => PromiseLike<unknown>
  onDone: () => void
  canDelete?: boolean
}) {
  const { t } = useTranslation()
  const { ids } = selection

  return (
    <ActionBar
      containerClassName="fixed inset-x-3 bottom-4 z-20 mx-auto max-w-sm sm:bottom-8"
      data-open={ids.length > 0}
    >
      <div className="flex w-full items-center justify-between gap-2 rounded-[10px] border bg-popover py-2 ps-3 pe-2 shadow-md">
        <p className="text-[13px]" aria-live="polite">
          <span className="font-medium tabular-nums">{ids.length}</span>{" "}
          {t("selected")}
        </p>
        <div className="flex items-center gap-2">
          {canDelete && (
            <ConfirmationDialog
              trigger={
                <Button
                  size="icon-sm"
                  variant="destructive"
                  aria-label={t("Delete selected")}
                >
                  <IconTrash />
                </Button>
              }
              onConfirm={async (dismiss) => {
                const results = await Promise.allSettled(ids.map(remove))
                const failed = results.filter(
                  (r) => r.status === "rejected"
                ).length
                if (failed)
                  toast.error(
                    t("Failed to delete {{count}} of {{total}} item(s).", {
                      count: failed,
                      total: ids.length,
                    })
                  )
                if (failed < ids.length)
                  toast.success(t("Deleted successfully."))
                selection.clear()
                onDone()
                dismiss()
              }}
            />
          )}
          <Button
            size="icon-sm"
            variant="outline"
            onClick={selection.clear}
            aria-label={t("Clear selection")}
          >
            <IconX />
          </Button>
        </div>
      </div>
    </ActionBar>
  )
}
