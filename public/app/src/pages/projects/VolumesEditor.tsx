import { Link } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { IconPlus, IconX } from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { useFresh } from "@/hooks/use-fresh"
import { getLocalPath } from "@/core/lib/utils"
import { Button } from "@/components/ui/button"
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type TVolume = {
  name: string
  mountPath: string
  /** S3 storage connection; a local volume on the server when absent. */
  storage?: string
  path?: string
}

const LOCAL = "local"

/** Project volumes (PLAN §11): local on the server by default, or an S3 folder. */
export function VolumesEditor({
  slug,
  value,
  onChange,
}: {
  slug: string
  value: TVolume[]
  onChange: (volumes: TVolume[]) => void
}) {
  const { t } = useTranslation()
  const request = ThunderSDK.useCaching(
    ["storages"],
    async ({ signal }) => await ThunderSDK.storages.list({ signal })
  )
  useFresh(request)
  const cached = use(request).data
  const storages = Array.isArray(cached) ? cached : undefined
  const locations = [
    { value: LOCAL, label: t("On the server (local)") },
    ...(storages ?? []).map((s) => ({
      value: s._id,
      label: t("S3: {{name}}", { name: s.name }),
    })),
  ]
  const set = (i: number, patch: Partial<TVolume>) =>
    onChange(value.map((v, j) => (j === i ? { ...v, ...patch } : v)))

  return (
    <FieldSet>
      <FieldLegend variant="label">{t("Volumes")}</FieldLegend>
      <FieldDescription>
        {t(
          "Local volumes live on the server's disk: the project then runs on one server and deploys stop-first. S3 volumes are shared by every server and replica, but aren't for databases."
        )}{" "}
        {!storages?.length && (
          <Link
            to={getLocalPath("infrastructure/storage")}
            className="font-medium underline"
          >
            {t("Connect S3 storage")}
          </Link>
        )}
      </FieldDescription>
      {value.map((v, i) => (
        <div
          key={i}
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-[1fr_1.4fr_1.4fr_auto]"
        >
          <Input
            aria-label={t("Volume {{n}} name", { n: i + 1 })}
            placeholder="data"
            value={v.name}
            required
            pattern="[a-z0-9][a-z0-9\-]{0,40}"
            onChange={(e) => set(i, { name: e.target.value.toLowerCase() })}
            className="font-mono"
          />
          <Input
            aria-label={t("Volume {{n}} mount path", { n: i + 1 })}
            placeholder="/app/data"
            value={v.mountPath}
            required
            pattern="/[^:]*"
            onChange={(e) => set(i, { mountPath: e.target.value })}
            className="font-mono"
          />
          <Select
            items={locations}
            value={v.storage ?? LOCAL}
            onValueChange={(s) =>
              set(i, {
                storage: s === LOCAL ? undefined : (s as string),
                path: s === LOCAL ? undefined : v.path,
              })
            }
          >
            <SelectTrigger
              className="w-full"
              aria-label={t("Volume {{n}} location", { n: i + 1 })}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("Remove volume {{n}}", { n: i + 1 })}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <IconX />
          </Button>
          {v.storage && (
            <Input
              aria-label={t("Volume {{n}} folder in the bucket", { n: i + 1 })}
              placeholder={`${slug || "project"}/${v.name || "data"}`}
              value={v.path ?? ""}
              pattern="[\w.\/\-]*"
              onChange={(e) => set(i, { path: e.target.value || undefined })}
              className="font-mono sm:col-span-3"
            />
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={value.length >= 10}
        onClick={() => onChange([...value, { name: "", mountPath: "" }])}
      >
        <IconPlus data-icon="inline-start" />
        {t("Add a volume")}
      </Button>
    </FieldSet>
  )
}
