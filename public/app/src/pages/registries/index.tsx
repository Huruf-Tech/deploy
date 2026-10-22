import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconBox, IconPlus, IconStar, IconTrash } from "@tabler/icons-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { errorMessage } from "@/lib/utils"

function AddRegistryDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}) {
  const { t } = useTranslation()
  const [kind, setKind] = React.useState<"dockerhub" | "generic">("dockerhub")
  const [isDefault, setDefault] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const text = (name: string) => String(form.get(name) ?? "").trim()
    setBusy(true)
    setError(null)
    try {
      await ThunderSDK.registries.create({
        body: {
          name: text("name"),
          kind,
          ...(kind === "generic" ? { url: text("url") } : {}),
          namespace: text("namespace"),
          username: text("username"),
          password: String(form.get("password") ?? ""),
          isDefault,
        },
      })
      toast.success(t("Registry connected"))
      onAdded()
      onOpenChange(false)
    } catch (e) {
      setError(errorMessage(e) ?? t("Could not connect the registry"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("Connect a registry")}</DialogTitle>
            <DialogDescription>
              {t(
                "Projects on several servers then build once and the other servers pull, instead of every server building."
              )}
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={kind}
            onValueChange={(v) => setKind(v as "dockerhub" | "generic")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="dockerhub">Docker Hub</TabsTrigger>
              <TabsTrigger value="generic">
                {t("Other (GHCR, GitLab, Harbor…)")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Field>
            <FieldLabel htmlFor="reg-name">{t("Name")}</FieldLabel>
            <Input
              id="reg-name"
              name="name"
              required
              defaultValue={kind === "dockerhub" ? "Docker Hub" : ""}
            />
          </Field>
          {kind === "generic" && (
            <Field>
              <FieldLabel htmlFor="reg-url">{t("Registry host")}</FieldLabel>
              <Input
                id="reg-url"
                name="url"
                required
                placeholder="ghcr.io"
                className="font-mono"
              />
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="reg-namespace">{t("Namespace")}</FieldLabel>
            <Input
              id="reg-namespace"
              name="namespace"
              required
              placeholder={
                kind === "dockerhub" ? "your-docker-user" : "ghcr.io/acme"
              }
              className="font-mono"
            />
            <FieldDescription>
              {t("Images are pushed to <namespace>/<project>:<release>.")}
            </FieldDescription>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="reg-user">{t("Username")}</FieldLabel>
              <Input
                id="reg-user"
                name="username"
                required
                autoComplete="off"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="reg-password">
                {t("Password or token")}
              </FieldLabel>
              <Input
                id="reg-password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
              />
            </Field>
          </div>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="reg-default">
              {t("Use for every project")}
            </FieldLabel>
            <Switch
              id="reg-default"
              checked={isDefault}
              onCheckedChange={setDefault}
            />
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {t("Connect")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Registries (PLAN §8.4, §15.6 Integrations). */
export default function RegistriesPage() {
  const { t } = useTranslation()
  const [adding, setAdding] = React.useState(false)
  const request = ThunderSDK.useCaching(
    ["registries"],
    async ({ signal }) => await ThunderSDK.registries.list({ signal })
  )
  const { data, isLoading } = use(request)

  const act = async (fn: () => PromiseLike<unknown>, failure: string) => {
    try {
      await fn()
      request.invalidate()
    } catch (e) {
      toast.error(errorMessage(e) ?? failure)
    }
  }

  const add = (
    <Button onClick={() => setAdding(true)}>
      <IconPlus aria-hidden /> {t("Connect a registry")}
    </Button>
  )

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t("Registries")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("Without one, each server builds the same commit itself.")}
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
              <IconBox />
            </EmptyMedia>
            <EmptyTitle>{t("No registry connected")}</EmptyTitle>
            <EmptyDescription>
              {t(
                "Optional: with a registry, multi-server projects build once and the other servers pull the image."
              )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{add}</EmptyContent>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((r) => (
            <li
              key={r._id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border p-3"
            >
              <IconBox className="size-5 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{r.name}</span>
                <span className="block truncate font-mono text-xs text-muted-foreground">
                  {r.kind === "dockerhub"
                    ? `docker.io/${r.namespace}`
                    : r.namespace}{" "}
                  · {r.username}
                </span>
              </span>
              {r.isDefault ? (
                <Badge variant="secondary">{t("Default")}</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    act(
                      () =>
                        ThunderSDK.registries.makeDefault({
                          params: { id: r._id },
                        }),
                      t("Could not change the default")
                    )
                  }
                >
                  <IconStar aria-hidden /> {t("Make default")}
                </Button>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("Remove {{name}}", { name: r.name })}
                onClick={() =>
                  act(
                    () => ThunderSDK.registries.del({ params: { id: r._id } }),
                    t("Could not remove it")
                  )
                }
              >
                <IconTrash />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AddRegistryDialog
        open={adding}
        onOpenChange={setAdding}
        onAdded={() => request.invalidate()}
      />
    </Page>
  )
}
