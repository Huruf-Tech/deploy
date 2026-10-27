import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconBox, IconPlus, IconStar, IconTrash } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { PageHeader } from "@/components/console/page-header"
import { DataTable, type TColumn } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { StatusBadge } from "@/components/console/status"
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
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  SelectAllCheckbox,
  SelectCheckbox,
  SelectionBar,
  useSelection,
} from "@/components/selection-bar"
import { errorMessage } from "@/lib/utils"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

type TRegistry = Awaited<ReturnType<typeof ThunderSDK.registries.list>>[number]

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
  const { data, isLoading, reload } = useCached(queries.registries())
  const selection = useSelection()

  const act = async (fn: () => PromiseLike<unknown>, failure: string) => {
    try {
      await fn()
      reload()
    } catch (e) {
      toast.error(errorMessage(e) ?? failure)
    }
  }

  const add = (
    <Button size="sm" onClick={() => setAdding(true)}>
      <IconPlus aria-hidden /> {t("Connect a registry")}
    </Button>
  )

  const columns: TColumn<TRegistry>[] = [
    {
      id: "select",
      header: (
        <SelectAllCheckbox
          selection={selection}
          ids={(data ?? []).map((r) => r._id)}
        />
      ),
      className: "w-10",
      cell: (r) => (
        <SelectCheckbox selection={selection} id={r._id} label={r.name} />
      ),
    },
    {
      id: "name",
      header: t("Name"),
      sortValue: (r) => r.name,
      cell: (r) => (
        <span className="flex items-center gap-2">
          <IconBox
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="truncate font-medium">{r.name}</span>
          {r.isDefault && <Badge variant="secondary">{t("Default")}</Badge>}
        </span>
      ),
    },
    {
      id: "namespace",
      header: t("Namespace"),
      sortValue: (r) => r.namespace,
      cell: (r) => (
        <span dir="ltr" className="truncate font-mono text-xs">
          {r.kind === "dockerhub" ? `docker.io/${r.namespace}` : r.namespace}
        </span>
      ),
    },
    {
      id: "username",
      header: t("Username"),
      className: "hidden md:table-cell",
      cell: (r) => (
        <span dir="ltr" className="font-mono text-xs text-muted-foreground">
          {r.username}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("Actions")}</span>,
      align: "end",
      cell: (r) => (
        <div className="flex justify-end gap-0.5">
          {!r.isDefault && (
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
        </div>
      ),
    },
  ]

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Registries")}
        status={
          !!data?.length && (
            <StatusBadge tone="success" label={t("Connected")} />
          )
        }
        description={t(
          "Without one, each server builds the same commit itself."
        )}
        actions={!!data?.length && add}
      />

      {!isLoading && !data?.length ? (
        <EmptyState
          icon={IconBox}
          title={t("No registry connected")}
          description={t(
            "Optional: with a registry, multi-server projects build once and the other servers pull the image."
          )}
          action={add}
        />
      ) : (
        <DataTable
          label={t("Registries")}
          columns={columns}
          rows={data}
          loading={isLoading}
          rowId={(r) => r._id}
          isSelected={(r) => selection.has(r._id)}
        />
      )}

      <SelectionBar
        selection={selection}
        remove={(id) => ThunderSDK.registries.del({ params: { id } })}
        onDone={reload}
        canDelete={ThunderSDK.isPermitted("registries", "del")}
      />

      <AddRegistryDialog
        open={adding}
        onOpenChange={setAdding}
        onAdded={reload}
      />
    </Page>
  )
}
