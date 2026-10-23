import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  IconFileUpload,
  IconLock,
  IconLockOpen,
  IconX,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { looksSecret, parseEnv } from "@/lib/dotenv"
import { cn } from "@/lib/utils"

export type TEnvVariable = { key: string; value: string; isSecret: boolean }

/** .env files are small; anything bigger is almost surely the wrong file. */
const MAX_FILE = 256 * 1024

/**
 * Collects variables from a .env file (PLAN §12): drop it, pick it or paste
 * its content. Entries merge into `value` (a later key replaces an earlier
 * one); credential-looking names start as secrets. `existing` marks keys the
 * scope already has.
 */
export function EnvEditor({
  value,
  onChange,
  existing,
}: {
  value: TEnvVariable[]
  onChange: (variables: TEnvVariable[]) => void
  existing?: Set<string>
}) {
  const { t } = useTranslation()
  const [text, setText] = React.useState("")
  const [dragging, setDragging] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)
  const fileInput = React.useRef<HTMLInputElement>(null)
  const pending = parseEnv(text)

  const add = (content: string) => {
    const { entries, invalid } = parseEnv(content)
    const merged = new Map(value.map((v) => [v.key, v]))
    for (const { key, value: v } of entries) {
      merged.set(key, {
        key,
        value: v,
        isSecret: merged.get(key)?.isSecret ?? looksSecret(key),
      })
    }
    onChange([...merged.values()])
    setNotice(
      invalid.length
        ? t("{{count}} added; skipped lines {{lines}} (not KEY=value).", {
            count: entries.length,
            lines: invalid.slice(0, 8).join(", "),
          })
        : entries.length
          ? null
          : t("No KEY=value lines found.")
    )
    return entries.length
  }

  const readFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_FILE) {
      setNotice(t("{{name}} is too big for a .env file.", { name: file.name }))
      return
    }
    add(await file.text())
  }

  return (
    // min-w-0: inside a grid or flex parent (the dialog), long values must
    // truncate rather than widen the whole dialog.
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          readFile(e.dataTransfer.files[0])
        }}
        className={cn(
          "flex flex-col gap-2 rounded-2xl border border-dashed p-3 transition-colors",
          dragging && "border-primary bg-primary/5"
        )}
      >
        <Textarea
          aria-label={t("Paste .env content")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            // Pasting straight in adds it at once; typing waits for "Add".
            const pasted = e.clipboardData.getData("text")
            if (!text && parseEnv(pasted).entries.length) {
              e.preventDefault()
              add(pasted)
            }
          }}
          placeholder={t(
            "Paste a .env file here, or drop one on this box\nDATABASE_URL=postgres://…\nAPI_KEY=…"
          )}
          className="min-h-28 font-mono text-xs"
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            <IconFileUpload data-icon="inline-start" />
            {t("Upload a .env file")}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".env,text/plain,*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              readFile(e.target.files?.[0])
              e.target.value = ""
            }}
          />
          {text.trim() && (
            <Button
              type="button"
              size="sm"
              disabled={!pending.entries.length}
              onClick={() => {
                if (add(text)) setText("")
              }}
            >
              {t("Add {{count}} variables", { count: pending.entries.length })}
            </Button>
          )}
        </div>
      </div>
      {notice && (
        <p role="status" className="text-xs text-muted-foreground">
          {notice}
        </p>
      )}

      {!!value.length && (
        <ul
          className="flex min-w-0 flex-col divide-y rounded-2xl border"
          aria-label={t("Variables to add")}
        >
          {value.map((v) => (
            <li key={v.key} className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span
                    className="truncate font-mono text-xs font-medium"
                    title={v.key}
                  >
                    {v.key}
                  </span>
                  {existing?.has(v.key) && (
                    <Badge variant="outline">{t("Exists")}</Badge>
                  )}
                </span>
                <span
                  className="block truncate font-mono text-xs text-muted-foreground"
                  title={v.isSecret ? undefined : v.value}
                >
                  {v.isSecret ? "••••••••" : v.value || t("(empty)")}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-pressed={v.isSecret}
                aria-label={
                  v.isSecret
                    ? t("{{key}} is secret; make it plain", { key: v.key })
                    : t("Make {{key}} secret", { key: v.key })
                }
                title={v.isSecret ? t("Secret") : t("Plain")}
                onClick={() =>
                  onChange(
                    value.map((x) =>
                      x.key === v.key ? { ...x, isSecret: !x.isSecret } : x
                    )
                  )
                }
              >
                {v.isSecret ? <IconLock /> : <IconLockOpen />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("Remove {{key}}", { key: v.key })}
                onClick={() => onChange(value.filter((x) => x.key !== v.key))}
              >
                <IconX />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
