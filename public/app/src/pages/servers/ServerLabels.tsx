import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconPlus, IconTag, IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { errorMessage } from "@/lib/utils"

/** Same limits as the API (`$serverUpdate.labels`). */
const KEY = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,39}$/
const MAX_VALUE = 80

export type TLabels = Record<string, string>

/** Read-only label chips, e.g. on the server cards and server pickers. */
export function LabelChips({ labels }: { labels?: TLabels | null }) {
  const entries = Object.entries(labels ?? {})
  if (!entries.length) return null
  return (
    <span className="flex flex-wrap gap-1">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex max-w-full items-center gap-1 truncate rounded-md border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
          title={`${key}=${value}`}
        >
          <IconTag className="size-3 shrink-0" aria-hidden />
          {value ? `${key}=${value}` : key}
        </span>
      ))}
    </span>
  )
}

/**
 * Edits a server's labels: free-form `key=value` tags (e.g. region=eu,
 * gpu=true) that show wherever servers are picked. Saved as you change them.
 */
export function ServerLabels({
  server,
  labels,
  onSaved,
}: {
  server: string
  labels?: TLabels | null
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const current = labels ?? {}

  const save = async (next: TLabels) => {
    setBusy(true)
    try {
      await ThunderSDK.servers.update({
        params: { id: server },
        body: { labels: next },
      })
      onSaved()
      return true
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save the labels"))
      return false
    } finally {
      setBusy(false)
    }
  }

  const add = async (event: React.FormEvent) => {
    event.preventDefault()
    const [key, ...rest] = draft.split("=")
    const value = rest.join("=").trim()
    if (!KEY.test(key.trim())) {
      toast.error(
        t(
          "Use key=value; the key takes letters, digits, '.', '_' or '-' (up to 40)"
        )
      )
      return
    }
    if (value.length > MAX_VALUE) {
      toast.error(t("Values are up to {{n}} characters", { n: MAX_VALUE }))
      return
    }
    if (await save({ ...current, [key.trim()]: value })) setDraft("")
  }

  const remove = (key: string) => {
    const { [key]: _, ...rest } = current
    save(rest)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {Object.entries(current).map(([key, value]) => (
          <span
            key={key}
            className="inline-flex max-w-full items-center gap-1 rounded-md border py-0.5 ps-2 pe-0.5 font-mono text-xs"
          >
            <IconTag
              className="size-3 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="truncate" title={`${key}=${value}`}>
              {value ? `${key}=${value}` : key}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t("Remove the label {{key}}", { key })}
              disabled={busy}
              onClick={() => remove(key)}
            >
              <IconX />
            </Button>
          </span>
        ))}
        {!Object.keys(current).length && (
          <span className="text-xs text-muted-foreground">
            {t("No labels yet.")}
          </span>
        )}
      </div>
      <form onSubmit={add} className="flex max-w-sm gap-2">
        <Input
          aria-label={t("New label, as key=value")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="region=eu"
          className="h-8 font-mono text-xs"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={busy || !draft.trim()}
        >
          <IconPlus data-icon="inline-start" />
          {t("Add")}
        </Button>
      </form>
    </div>
  )
}
