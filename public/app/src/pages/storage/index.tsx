import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconBucket, IconKey, IconPlus, IconTrash } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { use } from "@/core/hooks/use"
import { Badge } from "@/components/ui/badge"
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useFresh } from "@/hooks/use-fresh"
import { errorMessage } from "@/lib/utils"

type TStorage = Awaited<ReturnType<typeof ThunderSDK.storages.list>>[number]
type TProvider = TStorage["provider"]

const PROVIDERS: { value: TProvider; label: string; endpoint?: string }[] = [
  { value: "aws", label: "Amazon S3" },
  {
    value: "cloudflare",
    label: "Cloudflare R2",
    endpoint: "https://<account-id>.r2.cloudflarestorage.com",
  },
  { value: "minio", label: "MinIO", endpoint: "https://minio.example.com" },
  {
    value: "other",
    label: "Other S3-compatible (B2, Wasabi…)",
    endpoint: "https://s3.example.com",
  },
]

/** Add a connection, or replace an existing one's keys (`storage` set). */
function StorageDialog({
  storage,
  open,
  onOpenChange,
  onSaved,
}: {
  storage: TStorage | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [provider, setProvider] = React.useState<TProvider>("aws")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const meta = PROVIDERS.find((p) => p.value === provider)!

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const text = (name: string) => String(form.get(name) ?? "").trim()
    setBusy(true)
    setError(null)
    try {
      if (storage) {
        await ThunderSDK.storages.update({
          params: { id: storage._id },
          body: {
            accessKeyId: text("accessKeyId"),
            secretAccessKey: text("secretAccessKey"),
          },
        })
        toast.success(t("Keys replaced; servers use them for new mounts"))
      } else {
        await ThunderSDK.storages.create({
          body: {
            name: text("name"),
            provider,
            ...(text("endpoint") ? { endpoint: text("endpoint") } : {}),
            region: text("region") || "us-east-1",
            bucket: text("bucket"),
            accessKeyId: text("accessKeyId"),
            secretAccessKey: text("secretAccessKey"),
          },
        })
        toast.success(t("Storage connected"))
      }
      onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(errorMessage(e) ?? t("Could not save it"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form
          key={String(open)}
          onSubmit={submit}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>
              {storage
                ? t("Replace the keys of {{name}}", { name: storage.name })
                : t("Connect S3 storage")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Projects mount a folder of this bucket as a volume, shared by every server and replica. Keys are stored encrypted and only reach your servers sealed."
              )}
            </DialogDescription>
          </DialogHeader>
          {!storage && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="st-name">{t("Name")}</FieldLabel>
                  <Input id="st-name" name="name" required maxLength={80} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="st-provider">{t("Provider")}</FieldLabel>
                  <Select
                    items={PROVIDERS}
                    value={provider}
                    onValueChange={(v) => setProvider(v as TProvider)}
                  >
                    <SelectTrigger id="st-provider" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {meta.endpoint && (
                <Field>
                  <FieldLabel htmlFor="st-endpoint">{t("Endpoint")}</FieldLabel>
                  <Input
                    id="st-endpoint"
                    name="endpoint"
                    type="url"
                    required
                    placeholder={meta.endpoint}
                    className="font-mono"
                  />
                  <FieldDescription>
                    {t(
                      "Your servers connect to it; Huruf Deploy itself never does."
                    )}
                  </FieldDescription>
                </Field>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="st-bucket">{t("Bucket")}</FieldLabel>
                  <Input
                    id="st-bucket"
                    name="bucket"
                    required
                    pattern="[a-z0-9][a-z0-9.\-]{1,61}[a-z0-9]"
                    className="font-mono"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="st-region">{t("Region")}</FieldLabel>
                  <Input
                    id="st-region"
                    name="region"
                    placeholder={
                      provider === "cloudflare" ? "auto" : "us-east-1"
                    }
                    className="font-mono"
                  />
                </Field>
              </div>
            </>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="st-key">{t("Access key ID")}</FieldLabel>
              <Input
                id="st-key"
                name="accessKeyId"
                required
                autoComplete="off"
                defaultValue={storage?.accessKeyId}
                className="font-mono"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="st-secret">
                {t("Secret access key")}
              </FieldLabel>
              <Input
                id="st-secret"
                name="secretAccessKey"
                type="password"
                required
                autoComplete="new-password"
              />
            </Field>
          </div>
          {error && <FieldError>{error}</FieldError>}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {storage ? t("Replace keys") : t("Connect")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Storage connections (PLAN §11): S3 buckets that projects mount as volumes. */
export default function StoragePage() {
  const { t } = useTranslation()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    storage: TStorage | null
  }>({ open: false, storage: null })
  const request = ThunderSDK.useCaching(
    ["storages"],
    async ({ signal }) => await ThunderSDK.storages.list({ signal })
  )
  useFresh(request)
  const { data: cached, isLoading } = use(request)
  // The cache keeps whatever came back; anything but a list is stale.
  const data = Array.isArray(cached) ? cached : undefined

  const remove = async (s: TStorage) => {
    try {
      await ThunderSDK.storages.del({ params: { id: s._id } })
      request.invalidate()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not remove it"))
    }
  }

  const add = (
    <Button onClick={() => setDialog({ open: true, storage: null })}>
      <IconPlus aria-hidden /> {t("Connect storage")}
    </Button>
  )

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t("Storage")}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t(
              "S3 buckets your projects mount as volumes: files every server and replica share. Not for databases; give those a local volume."
            )}
          </p>
        </div>
        {!!data?.length && add}
      </div>

      {isLoading && !data ? (
        <Skeleton className="h-32 rounded-3xl" />
      ) : !data?.length ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconBucket />
            </EmptyMedia>
            <EmptyTitle>{t("No storage connected")}</EmptyTitle>
            <EmptyDescription>
              {t(
                "Optional: volumes are kept on the server's own disk until you connect a bucket (AWS S3, Cloudflare R2, MinIO, B2…)."
              )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{add}</EmptyContent>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((s) => (
            <li
              key={s._id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border p-3"
            >
              <IconBucket
                className="size-5 text-muted-foreground"
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{s.name}</span>
                <span className="block truncate font-mono text-xs text-muted-foreground">
                  {s.bucket}
                  {s.endpoint ? ` · ${s.endpoint}` : ` · ${s.region}`}
                </span>
              </span>
              <Badge variant="secondary">
                {PROVIDERS.find((p) => p.value === s.provider)?.label}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDialog({ open: true, storage: s })}
              >
                <IconKey aria-hidden /> {t("Replace keys")}
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("Remove {{name}}", { name: s.name })}
                onClick={() => remove(s)}
              >
                <IconTrash />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <StorageDialog
        storage={dialog.storage}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSaved={() => request.invalidate()}
      />
    </Page>
  )
}
