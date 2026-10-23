import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconBrandGithub,
  IconBuilding,
  IconExternalLink,
  IconRefresh,
  IconTrash,
  IconUser,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { use } from "@/core/hooks/use"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  SelectAllCheckbox,
  SelectCheckbox,
  SelectionBar,
  useSelection,
  type TSelection,
} from "@/components/selection-bar"
import { cn, errorMessage } from "@/lib/utils"
import { RepositoriesSheet, type TRepoTarget } from "./RepositoriesSheet"

type TIntegration = Awaited<
  ReturnType<typeof ThunderSDK.gitIntegrations.list>
>[number]

/** GitHub requires the manifest as a form POST, so the browser leaves the dashboard here. */
function submitManifest(action: string, manifest: string) {
  const form = document.createElement("form")
  form.method = "post"
  form.action = action
  const field = document.createElement("input")
  field.type = "hidden"
  field.name = "manifest"
  field.value = manifest
  form.append(field)
  document.body.append(form)
  form.submit()
}

function ConnectDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const [owner, setOwner] = React.useState<"user" | "org">("user")
  const [org, setOrg] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    try {
      const { action, manifest } = await ThunderSDK.gitIntegrations.connect({
        body: owner === "org" ? { org: org.trim() } : {},
      })
      submitManifest(action, manifest)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not start the GitHub connection"))
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("Connect GitHub")}</DialogTitle>
            <DialogDescription>
              {t(
                "We create a private GitHub App owned by you, with read-only access to code. On GitHub, confirm the App, then pick the repositories it may read."
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={owner}
            onValueChange={(v) => setOwner(v as "user" | "org")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="user">
                <IconUser aria-hidden /> {t("My account")}
              </TabsTrigger>
              <TabsTrigger value="org">
                <IconBuilding aria-hidden /> {t("An organization")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {owner === "org" && (
            <Field>
              <FieldLabel htmlFor="github-org">
                {t("Organization login")}
              </FieldLabel>
              <Input
                id="github-org"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="acme"
                pattern="[A-Za-z0-9-]{1,39}"
                autoComplete="off"
                required
                autoFocus
              />
              <FieldDescription>
                {t("You need to be an owner of the organization on GitHub.")}
              </FieldDescription>
            </Field>
          )}

          <DialogFooter>
            <Button type="submit" disabled={busy}>
              <IconBrandGithub aria-hidden /> {t("Continue on GitHub")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function IntegrationCard({
  integration,
  onChanged,
  onBrowse,
  selection,
}: {
  integration: TIntegration
  onChanged: () => void
  onBrowse: (target: TRepoTarget) => void
  selection: TSelection
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = React.useState(false)
  const [removing, setRemoving] = React.useState(false)

  const run = async (action: () => PromiseLike<unknown>, failure: string) => {
    setBusy(true)
    try {
      await action()
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e) ?? failure)
    } finally {
      setBusy(false)
    }
  }

  const installUrl = `https://github.com/apps/${integration.appSlug}/installations/new`

  return (
    <Card
      className={cn(selection.has(integration._id) && "ring-2 ring-primary")}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {/* Only the owner can remove it, so only theirs are selectable. */}
          {integration.isOwner && (
            <SelectCheckbox
              selection={selection}
              id={integration._id}
              label={integration.appName}
            />
          )}
          <IconBrandGithub className="size-5" aria-hidden />
          {integration.appName}
        </CardTitle>
        <CardDescription>
          {t("Owned by {{login}}", { login: integration.account.login })}
          {!integration.isOwner && ` · ${t("shared with this tenant")}`}
        </CardDescription>
        <CardAction className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={busy}
            aria-label={t("Refresh installations")}
            onClick={() =>
              run(
                () =>
                  ThunderSDK.gitIntegrations.refresh({
                    params: { id: integration._id },
                  }),
                t("Could not refresh")
              )
            }
          >
            <IconRefresh />
          </Button>
          {integration.isOwner && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("Remove")}
              onClick={() => setRemoving(true)}
            >
              <IconTrash />
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {integration.installations.length === 0 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-3 text-sm">
            <span className="flex-1">
              {t("Not installed yet: choose which repositories it may read.")}
            </span>
            <Button
              size="sm"
              render={<a href={installUrl} />}
              nativeButton={false}
            >
              {t("Install on GitHub")}
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {integration.installations.map((installation) => (
              <li
                key={installation.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border p-3"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  {installation.account.type === "Organization" ? (
                    <IconBuilding className="size-4 shrink-0" aria-hidden />
                  ) : (
                    <IconUser className="size-4 shrink-0" aria-hidden />
                  )}
                  <span className="truncate font-medium">
                    {installation.account.login}
                  </span>
                  <Badge variant="outline">
                    {installation.repositorySelection === "all"
                      ? t("All repositories")
                      : t("Selected repositories")}
                  </Badge>
                  {installation.suspended && (
                    <Badge variant="destructive">{t("Suspended")}</Badge>
                  )}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onBrowse({
                      integration: integration._id,
                      installation: installation.id,
                      account: installation.account.login,
                    })
                  }
                >
                  {t("Browse repositories")}
                </Button>
              </li>
            ))}
            <li>
              <Button
                size="sm"
                variant="link"
                className="px-0"
                render={<a href={installUrl} />}
                nativeButton={false}
              >
                {t("Install on another account or change repositories")}
              </Button>
            </li>
          </ul>
        )}

        {integration.isOwner && (
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor={`share-${integration._id}`}>
                {t("Share with this tenant")}
              </FieldLabel>
              <FieldDescription>
                {t("Other members can deploy from these repositories.")}
              </FieldDescription>
            </FieldContent>
            <Switch
              id={`share-${integration._id}`}
              checked={integration.sharedWithTenant}
              disabled={busy}
              onCheckedChange={(sharedWithTenant) =>
                run(
                  () =>
                    ThunderSDK.gitIntegrations.update({
                      params: { id: integration._id },
                      body: { sharedWithTenant },
                    }),
                  t("Could not change sharing")
                )
              }
            />
          </Field>
        )}
      </CardContent>

      <Dialog open={removing} onOpenChange={setRemoving}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("Remove {{name}}?", { name: integration.appName })}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Projects using it stop deploying on push. The App itself stays on GitHub; delete it there to revoke its access completely."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              render={
                <a
                  href={`${integration.htmlUrl.replace("/apps/", "/settings/apps/")}/advanced`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
              nativeButton={false}
            >
              {t("Open on GitHub")} <IconExternalLink aria-hidden />
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                run(
                  () =>
                    ThunderSDK.gitIntegrations.del({
                      params: { id: integration._id },
                    }),
                  t("Could not remove it")
                ).then(() => setRemoving(false))
              }
            >
              {t("Remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

/** GitHub (PLAN §15.6 Integrations): connect in three clicks, then browse repositories. */
export default function GitHubPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [connecting, setConnecting] = React.useState(false)
  const [browsing, setBrowsing] = React.useState<TRepoTarget | null>(null)

  const request = ThunderSDK.useCaching(
    ["gitIntegrations"],
    async ({ signal }) => await ThunderSDK.gitIntegrations.list({ signal })
  )
  const { data, isLoading } = use(request)
  const selection = useSelection()
  const owned = (data ?? []).filter((i) => i.isOwner).map((i) => i._id)

  // Back from GitHub: report how it went once, then clean the URL.
  React.useEffect(() => {
    const error = params.get("error")
    if (params.get("connected")) toast.success(t("GitHub connected"))
    else if (error) {
      const messages: Record<string, string> = {
        quota: t("Your plan's GitHub connection limit is reached."),
        expired: t("That link expired. Start the connection again."),
        github: t("GitHub refused the request. Try again."),
      }
      toast.error(messages[error] ?? t("The GitHub connection didn't finish."))
    }
    if (params.has("connected") || error) {
      request.invalidate()
      setParams({}, { replace: true })
    }
  }, [params, setParams, request, t])

  const connect = (
    <Button onClick={() => setConnecting(true)}>
      <IconBrandGithub aria-hidden /> {t("Connect GitHub")}
    </Button>
  )

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t("GitHub")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("Deploy from your repositories, including private ones.")}
          </p>
        </div>
        {!!data?.length && connect}
      </div>

      {isLoading && !data ? (
        <Skeleton className="h-48 rounded-4xl" />
      ) : !data?.length ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconBrandGithub />
            </EmptyMedia>
            <EmptyTitle>{t("Connect GitHub")}</EmptyTitle>
            <EmptyDescription>
              {t(
                "Three clicks: connect here, create the App on GitHub, then install it on your repositories."
              )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{connect}</EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {owned.length > 1 && (
            <label className="flex w-fit items-center gap-3 px-1 text-sm text-muted-foreground">
              <SelectAllCheckbox selection={selection} ids={owned} />
              {t("Select all")}
            </label>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {data.map((integration) => (
              <IntegrationCard
                key={integration._id}
                integration={integration}
                onChanged={() => request.invalidate()}
                onBrowse={setBrowsing}
                selection={selection}
              />
            ))}
          </div>
        </div>
      )}

      <SelectionBar
        selection={selection}
        remove={(id) => ThunderSDK.gitIntegrations.del({ params: { id } })}
        onDone={() => request.invalidate()}
        canDelete={ThunderSDK.isPermitted("gitIntegrations", "del")}
      />

      <ConnectDialog open={connecting} onOpenChange={setConnecting} />
      <RepositoriesSheet
        target={browsing}
        onOpenChange={(open) => !open && setBrowsing(null)}
      />
    </Page>
  )
}
