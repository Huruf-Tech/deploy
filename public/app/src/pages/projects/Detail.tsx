import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useLocation, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconLoader2,
  IconChevronDown,
  IconExternalLink,
  IconFileText,
  IconHistory,
  IconRocket,
  IconTerminal2,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { use } from "@/core/hooks/use"
import { useBreadcrumbTitle } from "@/core/layouts/shared/breadcrumb"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { CopyButton } from "@/components/ui/copy-button"
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePolling } from "@/hooks/use-polling"
import { errorMessage } from "@/lib/utils"
import { LogsSheet } from "@/pages/servers/LogsSheet"
import { VariableTable } from "@/pages/variables"
import { DeploymentSheet } from "./DeploymentSheet"
import { type TVolume, VolumesEditor } from "./VolumesEditor"
import { LabelChips } from "@/pages/servers/ServerLabels"
import {
  ago,
  DeploymentStatus,
  duration,
  isLive,
  shortSha,
  SourceIcon,
  type TDeploymentSummary,
  type TProject,
} from "./shared"

const TerminalSheet = React.lazy(() => import("@/pages/servers/TerminalSheet"))

type TStrategy = TProject["deployStrategy"]

function DeployButton({
  project,
  onDeployed,
}: {
  project: TProject
  onDeployed: (id: string) => void
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = React.useState(false)

  const deploy = async (noCache: boolean) => {
    setBusy(true)
    try {
      const { deployment } = await ThunderSDK.projects.deployProject({
        params: { id: project._id },
        body: { noCache },
      })
      toast.success(noCache ? t("Deploying without cache") : t("Deploying"))
      onDeployed(deployment)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not deploy"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ButtonGroup>
      <Button onClick={() => deploy(false)} disabled={busy}>
        <IconRocket aria-hidden /> {t("Deploy")}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="icon"
              aria-label={t("More deploy options")}
              disabled={busy}
            />
          }
        >
          <IconChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => deploy(true)}>
            {t("Deploy without build cache")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}

function DeploymentRow({
  d,
  onOpen,
}: {
  d: TDeploymentSummary
  onOpen: () => void
}) {
  const { t } = useTranslation()
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-3 py-2.5 text-start hover:bg-muted"
      >
        <DeploymentStatus status={d.status} className="w-28 justify-center" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">
            {d.commit?.message ??
              (d.trigger === "rollback" ? t("Rollback") : t("Deployment"))}
          </span>
          <span className="block text-xs text-muted-foreground">
            {[
              d.releaseNumber !== undefined &&
                t("Release {{n}}", { n: d.releaseNumber }),
              d.commit && shortSha(d.commit.sha),
              d.trigger === "push"
                ? t("push")
                : d.trigger === "rollback"
                  ? t("rollback")
                  : t("manual"),
              d.noCache && t("no cache"),
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {ago(d.createdAt)}
          {d.durationMs !== undefined && ` · ${duration(d.durationMs)}`}
        </span>
      </button>
    </li>
  )
}

function Releases({
  project,
  onDeployed,
}: {
  project: TProject
  onDeployed: (id: string) => void
}) {
  const { t } = useTranslation()
  const request = ThunderSDK.useCaching(
    ["projects", project._id, "releases"],
    async ({ signal }) =>
      await ThunderSDK.projects.releases({
        signal,
        params: { id: project._id },
      })
  )
  const { data } = use(request)

  const rollback = async (release: string, number: number) => {
    try {
      const { deployment } = await ThunderSDK.projects.rollbackProject({
        params: { id: project._id },
        body: { release },
      })
      toast.success(t("Rolling back to release {{n}}", { n: number }))
      onDeployed(deployment)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not roll back"))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("Releases")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1">
          {(data ?? []).map((r) => (
            <li
              key={r._id}
              className="flex flex-wrap items-center gap-3 rounded-xl px-2 py-1.5"
            >
              <span className="w-16 font-medium">#{r.number}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {r.commit
                  ? `${shortSha(r.commit.sha)} ${r.commit.message ?? ""}`
                  : (r.image ?? "")}{" "}
                · {ago(r.createdAt)}
              </span>
              {r.active ? (
                <Badge variant="secondary">{t("Live")}</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rollback(r._id, r.number)}
                >
                  <IconHistory aria-hidden /> {t("Roll back")}
                </Button>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("Rollbacks reuse the kept image: nothing is rebuilt.")}
        </p>
      </CardContent>
    </Card>
  )
}

function Settings({
  project,
  onSaved,
}: {
  project: TProject
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const placement = use(
    ThunderSDK.useCaching(
      ["projects", "placement"],
      async ({ signal }) => await ThunderSDK.projects.placementInfo({ signal })
    )
  )
  const [servers, setServers] = React.useState(
    project.servers.map((s) => s._id)
  )
  const [replicas, setReplicas] = React.useState(project.replicasPerServer)
  const [volumes, setVolumes] = React.useState<TVolume[]>(project.volumes)
  const [autoscale, setAutoscale] = React.useState(!!project.autoscale)
  const [scaleMin, setScaleMin] = React.useState(
    String(project.autoscale?.min ?? 1)
  )
  const [scaleMax, setScaleMax] = React.useState(
    String(project.autoscale?.max ?? 3)
  )
  const [scaleCpu, setScaleCpu] = React.useState(
    String(project.autoscale?.cpuPercent ?? (project.autoscale ? "" : 70))
  )
  const [scaleMem, setScaleMem] = React.useState(
    project.autoscale?.memPercent ? String(project.autoscale.memPercent) : ""
  )
  const [cooldown, setCooldown] = React.useState(
    String(project.autoscale?.cooldownSec ?? 120)
  )
  const [publicPort, setPublicPort] = React.useState(
    project.publicPort ? String(project.publicPort) : ""
  )
  const [strategy, setStrategy] = React.useState<TStrategy>(
    project.deployStrategy
  )
  const [autoDeploy, setAutoDeploy] = React.useState(project.autoDeploy)
  const [branch, setBranch] = React.useState(
    "branch" in project.source ? project.source.branch : ""
  )
  const [cpuReserve, setCpuReserve] = React.useState(
    String(project.runtime.cpuReserve)
  )
  const [memReserve, setMemReserve] = React.useState(
    String(project.runtime.memReserveMb)
  )
  const [cpuLimit, setCpuLimit] = React.useState(
    project.runtime.cpuLimit ? String(project.runtime.cpuLimit) : ""
  )
  const [memLimit, setMemLimit] = React.useState(
    project.runtime.memLimitMb ? String(project.runtime.memLimitMb) : ""
  )
  const [compose, setCompose] = React.useState(project.compose ?? "")
  const [needsNetwork, setNeedsNetwork] = React.useState(
    !!project.needsPrivateNetwork
  )
  const [busy, setBusy] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [confirm, setConfirm] = React.useState("")

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    try {
      const { redeploy } = await ThunderSDK.projects.update({
        params: { id: project._id },
        body: {
          servers,
          replicasPerServer: replicas,
          ...(JSON.stringify(volumes) !== JSON.stringify(project.volumes)
            ? { volumes }
            : {}),
          autoscale: autoscale
            ? {
                min: Number(scaleMin),
                max: Number(scaleMax),
                ...(scaleCpu ? { cpuPercent: Number(scaleCpu) } : {}),
                ...(scaleMem ? { memPercent: Number(scaleMem) } : {}),
                cooldownSec: Number(cooldown),
              }
            : null,
          publicPort: publicPort ? Number(publicPort) : null,
          deployStrategy: strategy,
          acknowledgeVolumeRisk: strategy !== project.deployStrategy,
          autoDeploy,
          needsPrivateNetwork: needsNetwork,
          ...(project.compose !== undefined && compose !== project.compose
            ? { compose }
            : {}),
          ...(branch && "branch" in project.source ? { branch } : {}),
          runtime: {
            cpuReserve: Number(cpuReserve),
            memReserveMb: Number(memReserve),
            ...(cpuLimit ? { cpuLimit: Number(cpuLimit) } : {}),
            ...(memLimit ? { memLimitMb: Number(memLimit) } : {}),
          },
        },
      })
      toast.success(
        redeploy
          ? t("Saved. Deploy to apply the new servers or volumes.")
          : t("Saved")
      )
      onSaved()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save"))
    } finally {
      setBusy(false)
    }
  }

  const clearCache = async () => {
    try {
      await ThunderSDK.projects.clearCache({ params: { id: project._id } })
      toast.success(t("The next build starts from scratch"))
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not clear the cache"))
    }
  }

  const [removing, setRemoving] = React.useState(false)
  const remove = async () => {
    setRemoving(true)
    try {
      await ThunderSDK.projects.del({ params: { id: project._id } })
      // The cached list still has it: refresh it (and the server pickers,
      // keyed under "projects") before going back, so it's gone there.
      // useCaching is the SDK's cache entry, not a React hook.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await ThunderSDK.useCaching(
        ["projects"],
        async ({ signal }) => await ThunderSDK.projects.list({ signal })
      ).invalidate()
      toast.success(
        t(
          "Project deleted. Its containers stop on each server's next check-in."
        )
      )
      navigate("..", { relative: "path" })
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not delete the project"))
      setRemoving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={save}
        className="flex flex-col gap-6 rounded-3xl border p-4 sm:p-6"
      >
        <FieldSet>
          <FieldLegend variant="label">{t("Servers")}</FieldLegend>
          <div className="flex flex-col gap-2">
            {(placement.data ?? []).map((s) => (
              <label
                key={s.server}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border p-3"
              >
                <Checkbox
                  checked={servers.includes(s.server)}
                  onCheckedChange={(on) =>
                    setServers((c) =>
                      on ? [...c, s.server] : c.filter((x) => x !== s.server)
                    )
                  }
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                  {s.name}
                  <LabelChips labels={s.labels} />
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("{{cpu}} CPU · {{mem}} MiB free", {
                    cpu: s.cpuFree.toFixed(1),
                    mem: s.memFreeMb,
                  })}
                </span>
              </label>
            ))}
          </div>
          <FieldDescription>
            {t(
              "Changing servers takes effect on the next deploy: the new ones start, then the old ones drain."
            )}
          </FieldDescription>
        </FieldSet>

        {project.build.mode !== "compose" && (
          <VolumesEditor
            slug={project.slug}
            value={volumes}
            onChange={setVolumes}
          />
        )}

        <FieldSet>
          <Field orientation="horizontal">
            <Switch
              id="s-autoscale"
              checked={autoscale}
              onCheckedChange={setAutoscale}
            />
            <FieldLabel htmlFor="s-autoscale">{t("Autoscale")}</FieldLabel>
          </Field>
          <FieldDescription>
            {t(
              "Each server adds or removes replicas of this project to stay near the targets, within the bounds and at most once per cooldown. Placement reserves room for the maximum."
            )}
          </FieldDescription>
          {autoscale && (
            <div className="grid gap-4 sm:grid-cols-5">
              <Field>
                <FieldLabel htmlFor="s-scale-min">
                  {t("Min replicas")}
                </FieldLabel>
                <Input
                  id="s-scale-min"
                  type="number"
                  min={1}
                  max={20}
                  value={scaleMin}
                  onChange={(e) => setScaleMin(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="s-scale-max">
                  {t("Max replicas")}
                </FieldLabel>
                <Input
                  id="s-scale-max"
                  type="number"
                  min={1}
                  max={20}
                  value={scaleMax}
                  onChange={(e) => setScaleMax(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="s-scale-cpu">
                  {t("CPU target %")}
                </FieldLabel>
                <Input
                  id="s-scale-cpu"
                  type="number"
                  min={10}
                  max={100}
                  value={scaleCpu}
                  placeholder={t("None")}
                  onChange={(e) => setScaleCpu(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="s-scale-mem">
                  {t("Memory target %")}
                </FieldLabel>
                <Input
                  id="s-scale-mem"
                  type="number"
                  min={10}
                  max={100}
                  value={scaleMem}
                  placeholder={t("None")}
                  onChange={(e) => setScaleMem(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="s-cooldown">
                  {t("Cooldown (s)")}
                </FieldLabel>
                <Input
                  id="s-cooldown"
                  type="number"
                  min={30}
                  max={3600}
                  value={cooldown}
                  onChange={(e) => setCooldown(e.target.value)}
                />
              </Field>
            </div>
          )}
          {autoscale && (
            <FieldDescription>
              {t(
                "Targets are a percent of each replica's limit, or its reservation without one."
              )}
            </FieldDescription>
          )}
        </FieldSet>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="s-replicas">
              {t("Replicas per server")}
            </FieldLabel>
            <Input
              id="s-replicas"
              type="number"
              min={0}
              max={20}
              value={replicas}
              onChange={(e) => setReplicas(Number(e.target.value))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="s-port">{t("Public port")}</FieldLabel>
            <Input
              id="s-port"
              type="number"
              value={publicPort}
              onChange={(e) => setPublicPort(e.target.value)}
              placeholder={t("Private")}
            />
          </Field>
          <Field>
            <FieldLabel>{t("Deploy strategy")}</FieldLabel>
            <Select
              items={[
                { value: "rolling", label: t("Rolling") },
                { value: "allAtOnce", label: t("All at once") },
                { value: "stopFirst", label: t("Stop first") },
              ]}
              value={strategy}
              onValueChange={(v) => setStrategy(v as TStrategy)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rolling">{t("Rolling")}</SelectItem>
                <SelectItem value="allAtOnce">{t("All at once")}</SelectItem>
                <SelectItem value="stopFirst">{t("Stop first")}</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>
              {strategy === "rolling"
                ? t("One server and one replica at a time; no downtime.")
                : strategy === "allAtOnce"
                  ? t(
                      "Starts the new release everywhere, then switches all at once."
                    )
                  : t(
                      "Stops each old replica first: brief downtime. Safe for local volumes."
                    )}
            </FieldDescription>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field>
            <FieldLabel htmlFor="s-cpu-r">{t("CPU reserved")}</FieldLabel>
            <Input
              id="s-cpu-r"
              type="number"
              step="0.05"
              min={0}
              value={cpuReserve}
              onChange={(e) => setCpuReserve(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="s-mem-r">
              {t("Memory reserved (MiB)")}
            </FieldLabel>
            <Input
              id="s-mem-r"
              type="number"
              min={0}
              value={memReserve}
              onChange={(e) => setMemReserve(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="s-cpu-l">{t("CPU limit")}</FieldLabel>
            <Input
              id="s-cpu-l"
              type="number"
              step="0.25"
              value={cpuLimit}
              onChange={(e) => setCpuLimit(e.target.value)}
              placeholder={t("None")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="s-mem-l">{t("Memory limit (MiB)")}</FieldLabel>
            <Input
              id="s-mem-l"
              type="number"
              value={memLimit}
              onChange={(e) => setMemLimit(e.target.value)}
              placeholder={t("None")}
            />
          </Field>
        </div>

        <Field orientation="horizontal">
          <FieldLabel htmlFor="s-network">
            {t("Talks to projects on other servers")}
          </FieldLabel>
          <Switch
            id="s-network"
            checked={needsNetwork}
            onCheckedChange={setNeedsNetwork}
          />
        </Field>

        {project.source.type === "compose" && (
          <Field>
            <FieldLabel htmlFor="s-compose">{t("Compose file")}</FieldLabel>
            <Textarea
              id="s-compose"
              value={compose}
              onChange={(e) => setCompose(e.target.value)}
              rows={16}
              spellCheck={false}
              className="font-mono text-xs"
            />
            <FieldDescription>
              {t(
                "Changes apply on the next deploy. ${VAR} comes from the project's variables."
              )}
            </FieldDescription>
          </Field>
        )}

        {"branch" in project.source && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="s-branch">{t("Branch")}</FieldLabel>
              <Input
                id="s-branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
            </Field>
            {project.source.type === "github" && (
              <Field orientation="horizontal" className="self-end">
                <FieldLabel htmlFor="s-auto">{t("Deploy on push")}</FieldLabel>
                <Switch
                  id="s-auto"
                  checked={autoDeploy}
                  onCheckedChange={setAutoDeploy}
                />
              </Field>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {t("Save")}
          </Button>
        </div>
      </form>

      {project.deployKeyPublic && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Deploy key")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {t("Add it to the repository as a read-only deploy key.")}
            </p>
            <div className="flex items-center gap-2 rounded-2xl bg-muted/50 p-3">
              <code className="min-w-0 flex-1 truncate text-xs">
                {project.deployKeyPublic}
              </code>
              <CopyButton value={project.deployKeyPublic} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base">{t("Danger zone")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={clearCache}>
            {t("Clear build cache")}
          </Button>
          <Button variant="destructive" onClick={() => setDeleting(true)}>
            {t("Delete project")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("Delete {{name}}?", { name: project.name })}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Its containers stop on every server, and its releases and variables are deleted. Volumes are kept on the servers."
              )}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="confirm-slug">
              {t("Type {{slug}} to confirm", { slug: project.slug })}
            </FieldLabel>
            <Input
              id="confirm-slug"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              className="font-mono"
            />
          </Field>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={confirm !== project.slug || removing}
              onClick={remove}
            >
              {removing && <IconLoader2 className="animate-spin" aria-hidden />}
              {removing ? t("Deleting…") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** A project (PLAN §15.6 item 4): deploys, releases, logs, shells, variables, settings. */
export default function ProjectDetail() {
  const { t } = useTranslation()
  const { id = "" } = useParams()
  const location = useLocation()
  const [tab, setTab] = React.useState("overview")
  const [open, setOpen] = React.useState<string | null>(null)
  const [logs, setLogs] = React.useState<{
    server: string
    container: string
  } | null>(null)
  const [terminal, setTerminal] = React.useState<{
    server: string
    container: string
  } | null>(null)
  const [deployKey, setDeployKey] = React.useState<string | undefined>(
    (location.state as { deployKeyPublic?: string } | null)?.deployKeyPublic
  )

  const request = ThunderSDK.useCaching(
    ["projects", id],
    async ({ signal }) =>
      await ThunderSDK.projects.get({ signal, params: { id } })
  )
  const { data: project } = use(request)
  const history = ThunderSDK.useCaching(
    ["projects", id, "deployments"],
    async ({ signal }) =>
      await ThunderSDK.projects.deployments({
        signal,
        params: { id },
        query: { page: 1 },
      })
  )
  const { data: deployments } = use(history)
  useBreadcrumbTitle(project?.name)

  const refresh = () => {
    request.invalidate()
    history.invalidate()
  }
  usePolling(() => {
    if (deployments?.some((d) => isLive(d.status) || d.status === "queued"))
      refresh()
  }, 3_000)

  if (!project) {
    return (
      <Page className="flex flex-col gap-4 py-4">
        <Skeleton className="h-20 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </Page>
    )
  }

  const deployed = (deploymentId: string) => {
    refresh()
    setOpen(deploymentId)
  }
  const urls = project.publicPort
    ? project.servers
        .filter((s) => s.publicIp)
        .map((s) => `http://${s.publicIp}:${project.publicPort}`)
    : []
  const canShell = ThunderSDK.isPermitted("streams", "openTerminal")
  const latest = deployments?.[0]

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-3 text-xl font-semibold">
            {project.name}
            {latest && <DeploymentStatus status={latest.status} />}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <SourceIcon source={project.source.type} />
            {project.source.type === "github"
              ? `${project.source.repo} · ${project.source.branch}`
              : project.source.type === "git"
                ? `${project.source.url} · ${project.source.branch}`
                : project.source.type === "image"
                  ? project.source.image
                  : project.source.type === "compose"
                    ? t("Compose file")
                    : t("One-click service")}
          </p>
        </div>
        <DeployButton project={project} onDeployed={deployed} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
          <TabsTrigger value="logs">{t("Logs")}</TabsTrigger>
          <TabsTrigger value="variables">{t("Variables")}</TabsTrigger>
          <TabsTrigger value="settings">{t("Settings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6 pt-4">
          {project.networkWarnings.length > 0 && (
            <Alert variant="destructive">
              <IconAlertTriangle />
              <AlertTitle>{t("Can't reach what it uses")}</AlertTitle>
              <AlertDescription>
                <ul className="list-disc ps-4">
                  {project.networkWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {t("Live release")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.release ? (
                  <>
                    <p className="text-2xl font-semibold">
                      #{project.release.number}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {project.release.commit
                        ? `${shortSha(project.release.commit.sha)} ${project.release.commit.message ?? ""}`
                        : "—"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("Not deployed yet")}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {t("Running on")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {t("{{count}} servers", { count: project.placedOn.length })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("{{n}} replicas each · {{strategy}}", {
                    n: project.autoscale
                      ? `${project.autoscale.min}–${project.autoscale.max}`
                      : project.replicasPerServer,
                    strategy: {
                      rolling: t("rolling"),
                      allAtOnce: t("all at once"),
                      stopFirst: t("stop first"),
                    }[project.deployStrategy],
                  })}
                </p>
                {project.autoscale &&
                  project.autoscaled?.map((a) => (
                    <p
                      key={a.server}
                      className="text-xs text-muted-foreground"
                      title={a.reason}
                    >
                      {t("{{server}}: {{n}} replicas now ({{reason}})", {
                        server:
                          project.servers.find((s) => s._id === a.server)
                            ?.name ?? a.server,
                        n: a.replicas,
                        reason: a.reason,
                      })}
                    </p>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {t("Reach it")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm">
                <code className="text-xs">
                  {project.slug}.internal
                  {project.runtime.port ? `:${project.runtime.port}` : ""}
                </code>
                {urls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-primary underline-offset-4 hover:underline"
                  >
                    {url} <IconExternalLink className="size-3" aria-hidden />
                  </a>
                ))}
                {project.publicPort && !urls.length && (
                  <span className="text-xs text-muted-foreground">
                    {t("Port {{port}} on every server", {
                      port: project.publicPort,
                    })}
                  </span>
                )}
                {!project.publicPort && (
                  <span className="text-xs text-muted-foreground">
                    {t("Not public")}
                  </span>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("Deployments")}</CardTitle>
              </CardHeader>
              <CardContent>
                {!deployments?.length ? (
                  <p className="text-sm text-muted-foreground">
                    {t("No deployments yet.")}
                  </p>
                ) : (
                  <ul className="-mx-3 flex flex-col">
                    {deployments.map((d) => (
                      <DeploymentRow
                        key={d._id}
                        d={d}
                        onOpen={() => setOpen(d._id)}
                      />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Releases project={project} onDeployed={deployed} />
          </div>
        </TabsContent>

        <TabsContent value="logs" className="pt-4">
          {!project.containers.length ? (
            <p className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("Nothing is running yet.")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {project.containers.map((c) => (
                <li
                  key={`${c.server}/${c.name}`}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border p-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-sm">
                      {c.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {c.serverName}
                      {c.service !== "app" ? ` · ${c.service}` : ""}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setLogs({ server: c.server, container: c.name })
                    }
                  >
                    <IconFileText aria-hidden /> {t("Logs")}
                  </Button>
                  {canShell && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTerminal({ server: c.server, container: c.name })
                      }
                    >
                      <IconTerminal2 aria-hidden /> {t("Shell")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="variables" className="flex flex-col gap-3 pt-4">
          <p className="text-sm text-muted-foreground">
            {t(
              "Variables apply on the next deploy; they override workspace and account variables."
            )}
          </p>
          <VariableTable scope={{ scope: "project", project: project._id }} />
        </TabsContent>

        <TabsContent value="settings" className="pt-4">
          <Settings
            key={project.updatedAt}
            project={project}
            onSaved={refresh}
          />
        </TabsContent>
      </Tabs>

      <DeploymentSheet
        deployment={open}
        onOpenChange={(o) => !o && setOpen(null)}
        onChanged={refresh}
      />
      <LogsSheet
        server={logs?.server ?? ""}
        container={logs?.container ?? null}
        onOpenChange={(o) => !o && setLogs(null)}
      />
      {terminal && (
        <React.Suspense fallback={null}>
          <TerminalSheet
            server={terminal.server}
            container={terminal.container}
            open={!!terminal}
            onOpenChange={(o) => !o && setTerminal(null)}
          />
        </React.Suspense>
      )}

      <Dialog
        open={!!deployKey}
        onOpenChange={(o) => !o && setDeployKey(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Add the deploy key")}</DialogTitle>
            <DialogDescription>
              {t(
                "Add this public key to the repository as a read-only deploy key, then deploy."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-2xl bg-muted/50 p-3">
            <code className="min-w-0 flex-1 truncate text-xs">{deployKey}</code>
            {deployKey && <CopyButton value={deployKey} />}
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                setDeployKey(undefined)
                const { deployment } = await ThunderSDK.projects.deployProject({
                  params: { id: project._id },
                  body: { noCache: false },
                })
                deployed(deployment)
              }}
            >
              <IconRocket aria-hidden /> {t("I've added it, deploy")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  )
}
