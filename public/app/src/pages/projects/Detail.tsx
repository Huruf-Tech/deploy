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
  IconServer2,
  IconTerminal2,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { useBreadcrumbTitle } from "@/core/layouts/shared/breadcrumb"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Checkbox } from "@/components/ui/checkbox"
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
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Stat, StatStrip } from "@/components/console/stat"
import { KeyValue } from "@/components/console/key-value"
import { DataTable, type TColumn } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { CodeBlock } from "@/components/console/code-block"
import { StatusBadge } from "@/components/console/status"
import { usePolling } from "@/hooks/use-polling"
import { errorMessage } from "@/lib/utils"
import { LogsSheet } from "@/pages/servers/LogsSheet"
import { VariableTable } from "@/pages/variables"
import { DeploymentSheet } from "./DeploymentSheet"
import { DomainsTab } from "./DomainsTab"
import { type TVolume, VolumesEditor } from "./VolumesEditor"
import { DistributionEditor, type TDistribution } from "./DistributionEditor"
import { LabelChips } from "@/pages/servers/ServerLabels"
import { ago } from "@/lib/format"
import {
  DeploymentStatus,
  duration,
  isLive,
  shortSha,
  SourceIcon,
  type TDeploymentSummary,
  type TProject,
} from "./shared"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

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
      <Button size="sm" onClick={() => deploy(false)} disabled={busy}>
        {busy ? (
          <IconLoader2 className="animate-spin" aria-hidden />
        ) : (
          <IconRocket aria-hidden />
        )}{" "}
        {t("Deploy")}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="icon-sm"
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

/** Deployment history as a table; a row opens its sheet. */
function DeploymentsTable({
  deployments,
  onOpen,
}: {
  deployments?: TDeploymentSummary[] | null
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  const columns: TColumn<TDeploymentSummary>[] = [
    {
      id: "status",
      header: t("Status"),
      className: "w-28",
      sortValue: (d) => d.status,
      cell: (d) => <DeploymentStatus status={d.status} />,
    },
    {
      id: "what",
      header: t("Deployment"),
      cell: (d) => (
        <div className="min-w-40">
          <div className="truncate">
            {d.commit?.message ??
              (d.trigger === "rollback" ? t("Rollback") : t("Deployment"))}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {[
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
          </div>
        </div>
      ),
    },
    {
      id: "release",
      header: t("Release"),
      className: "max-sm:hidden",
      align: "end",
      sortValue: (d) => d.releaseNumber ?? -1,
      cell: (d) =>
        d.releaseNumber !== undefined ? `#${d.releaseNumber}` : "—",
    },
    {
      id: "duration",
      header: t("Duration"),
      className: "max-md:hidden",
      align: "end",
      sortValue: (d) => d.durationMs ?? -1,
      cell: (d) => duration(d.durationMs) || "—",
    },
    {
      id: "created",
      header: t("Created"),
      align: "end",
      sortValue: (d) => d.createdAt,
      cell: (d) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {ago(d.createdAt)}
        </span>
      ),
    },
  ]
  return (
    <DataTable
      label={t("Deployments")}
      columns={columns}
      rows={deployments}
      rowId={(d) => d._id}
      loading={!deployments}
      empty={t("No deployments yet.")}
      onRowClick={(d) => onOpen(d._id)}
      className="rounded-none border-0"
    />
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
  const { data, isLoading } = useCached(queries.releases(project._id))

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

  type TRelease = NonNullable<typeof data>[number]
  const columns: TColumn<TRelease>[] = [
    {
      id: "number",
      header: t("Release"),
      className: "w-20",
      sortValue: (r) => r.number,
      cell: (r) => (
        <span className="font-medium tabular-nums">#{r.number}</span>
      ),
    },
    {
      id: "what",
      header: t("Build"),
      cell: (r) => (
        <span
          dir="ltr"
          className="block max-w-80 truncate font-mono text-xs text-muted-foreground"
        >
          {r.commit
            ? `${shortSha(r.commit.sha)} ${r.commit.message ?? ""}`
            : (r.image ?? "")}
        </span>
      ),
    },
    {
      id: "created",
      header: t("Created"),
      className: "max-sm:hidden",
      sortValue: (r) => r.createdAt,
      cell: (r) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {ago(r.createdAt)}
        </span>
      ),
    },
    {
      id: "action",
      header: <span className="sr-only">{t("Actions")}</span>,
      align: "end",
      cell: (r) =>
        r.active ? (
          <StatusBadge state="healthy" label={t("Live")} />
        ) : (
          <Button
            size="xs"
            variant="outline"
            onClick={() => rollback(r._id, r.number)}
          >
            <IconHistory aria-hidden /> {t("Roll back")}
          </Button>
        ),
    },
  ]

  return (
    <Panel
      title={t("Releases")}
      description={t("Rollbacks reuse the kept image: nothing is rebuilt.")}
      bodyClassName="p-0"
    >
      <DataTable
        label={t("Releases")}
        columns={columns}
        rows={data}
        rowId={(r) => r._id}
        loading={isLoading}
        className="rounded-none border-0"
      />
    </Panel>
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
  const placement = useCached(queries.placement())
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
  // Partitions share their machine's ports: custom domains only (PLAN §26 D).
  const rentedOn = placement.data?.find(
    (p) => p.rented && servers.includes(p.server)
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
  const initialDistribution: TDistribution = {
    distribution: project.distribution as TDistribution["distribution"],
    registry: project.registry,
  }
  const [distribution, setDistribution] = React.useState(initialDistribution)
  const builds =
    project.source.type !== "image" && project.source.type !== "compose"
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
          publicPort: publicPort && !rentedOn ? Number(publicPort) : null,
          deployStrategy: strategy,
          acknowledgeVolumeRisk: strategy !== project.deployStrategy,
          autoDeploy,
          needsPrivateNetwork: needsNetwork,
          ...(JSON.stringify(distribution) !==
          JSON.stringify(initialDistribution)
            ? {
                distribution: distribution.distribution,
                registry:
                  distribution.distribution === "registry"
                    ? (distribution.registry ?? null)
                    : null,
              }
            : {}),
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
      // Its own entries (detail, deployments, releases) would refetch and 404
      // when the list below is invalidated: drop them first.
      await ThunderSDK.forgetCache(["projects", project._id], {
        subKeys: true,
      })
      // The cached list still has it: refresh it (and the server pickers,
      // keyed under "projects") before going back, so it's gone there.
      await queries.projects().invalidate()
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
    <div className="flex flex-col gap-4">
      <form onSubmit={save} className="flex flex-col gap-4">
        <Panel title={t("Placement")} bodyClassName="flex flex-col gap-4">
          <FieldSet>
            <FieldLegend variant="label">{t("Servers")}</FieldLegend>
            <div className="flex flex-col divide-y rounded-lg border">
              {(placement.data ?? []).map((s) => (
                <label
                  key={s.server}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 first:rounded-t-lg last:rounded-b-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={servers.includes(s.server)}
                    onCheckedChange={(on) =>
                      setServers((c) =>
                        on ? [...c, s.server] : c.filter((x) => x !== s.server)
                      )
                    }
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1 text-[13px]">
                    {s.name}
                    <LabelChips labels={s.labels} />
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
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
                disabled={!!rentedOn}
              />
              {rentedOn && (
                <FieldDescription>
                  {t(
                    "{{server}} is rented from Huruf: it shares its machine's ports, so reach it through a custom domain.",
                    { server: rentedOn.name }
                  )}
                </FieldDescription>
              )}
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
        </Panel>

        <Panel
          title={t("Autoscale")}
          actions={
            <Switch
              id="s-autoscale"
              aria-label={t("Autoscale")}
              checked={autoscale}
              onCheckedChange={setAutoscale}
            />
          }
          bodyClassName="flex flex-col gap-4"
        >
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
        </Panel>

        <Panel title={t("Resources")} bodyClassName="flex flex-col gap-4">
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
              <FieldLabel htmlFor="s-mem-l">
                {t("Memory limit (MiB)")}
              </FieldLabel>
              <Input
                id="s-mem-l"
                type="number"
                value={memLimit}
                onChange={(e) => setMemLimit(e.target.value)}
                placeholder={t("None")}
              />
            </Field>
          </div>

          {project.build.mode !== "compose" && (
            <VolumesEditor
              slug={project.slug}
              value={volumes}
              onChange={setVolumes}
            />
          )}
        </Panel>

        {builds && (
          <Panel title={t("Build")} bodyClassName="flex flex-col gap-4">
            <DistributionEditor
              value={distribution}
              onChange={setDistribution}
              note={t("Changes apply on the next deploy.")}
            />
          </Panel>
        )}

        <Panel
          title={t("Source and network")}
          bodyClassName="flex flex-col gap-4"
        >
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
                dir="ltr"
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
                  dir="ltr"
                  className="font-mono"
                />
              </Field>
              {project.source.type === "github" && (
                <Field orientation="horizontal" className="self-end">
                  <FieldLabel htmlFor="s-auto">
                    {t("Deploy on push")}
                  </FieldLabel>
                  <Switch
                    id="s-auto"
                    checked={autoDeploy}
                    onCheckedChange={setAutoDeploy}
                  />
                </Field>
              )}
            </div>
          )}
        </Panel>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={busy}>
            {busy && <IconLoader2 className="animate-spin" aria-hidden />}
            {t("Save")}
          </Button>
        </div>
      </form>

      {project.deployKeyPublic && (
        <Panel
          title={t("Deploy key")}
          description={t("Add it to the repository as a read-only deploy key.")}
        >
          <CodeBlock code={project.deployKeyPublic} wrap />
        </Panel>
      )}

      <Panel
        title={t("Danger zone")}
        className="border-destructive/40"
        bodyClassName="flex flex-wrap gap-2"
      >
        <Button size="sm" variant="outline" onClick={clearCache}>
          {t("Clear build cache")}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setDeleting(true)}
        >
          {t("Delete project")}
        </Button>
      </Panel>

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
              dir="ltr"
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

type TContainer = TProject["containers"][number]

/** A project (PLAN §15.6 item 4): deploys, releases, logs, shells, variables, settings. */
export default function ProjectDetail() {
  const { t } = useTranslation()
  const { id = "" } = useParams()
  const location = useLocation()
  const [tab, setTab] = React.useState(
    (location.state as { tab?: string } | null)?.tab ?? "overview"
  )
  const canDomains = ThunderSDK.isPermitted("domains", "list")
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

  const { data: project, reload } = useCached(queries.project(id))
  const history = useCached(queries.deployments(id))
  const deployments = history.data
  // Same query as the Domains tab, so changes there show here too.
  const { data: domains } = useCached(queries.domains(id))
  useBreadcrumbTitle(project?.name)

  const refresh = () => {
    reload()
    history.reload()
  }
  usePolling(() => {
    if (deployments?.some((d) => isLive(d.status) || d.status === "queued"))
      refresh()
  }, 3_000)

  if (!project) {
    return (
      <Page className="flex flex-col gap-4 py-5">
        <Skeleton className="h-14 rounded-[10px]" />
        <Skeleton className="h-20 rounded-[10px]" />
        <Skeleton className="h-64 rounded-[10px]" />
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
  const source =
    project.source.type === "github"
      ? `${project.source.repo} · ${project.source.branch}`
      : project.source.type === "git"
        ? `${project.source.url} · ${project.source.branch}`
        : project.source.type === "image"
          ? project.source.image
          : project.source.type === "compose"
            ? t("Compose file")
            : t("One-click service")
  const internal = `${project.slug}.internal${project.runtime.port ? `:${project.runtime.port}` : ""}`
  const activeDomains = (domains ?? []).filter((d) => d.status === "active")
  const strategyLabel = {
    rolling: t("rolling"),
    allAtOnce: t("all at once"),
    stopFirst: t("stop first"),
  }[project.deployStrategy]

  const containerColumns: TColumn<TContainer>[] = [
    {
      id: "name",
      header: t("Container"),
      sortValue: (c) => c.name,
      cell: (c) => (
        <span dir="ltr" className="block truncate font-mono text-xs">
          {c.name}
        </span>
      ),
    },
    {
      id: "server",
      header: t("Server"),
      sortValue: (c) => c.serverName,
      cell: (c) => c.serverName,
    },
    {
      id: "service",
      header: t("Service"),
      className: "max-sm:hidden",
      sortValue: (c) => c.service,
      cell: (c) => (
        <span dir="ltr" className="font-mono text-xs text-muted-foreground">
          {c.service}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("Actions")}</span>,
      align: "end",
      cell: (c) => (
        <span className="inline-flex gap-1">
          <Button
            size="xs"
            variant="outline"
            onClick={() => setLogs({ server: c.server, container: c.name })}
          >
            <IconFileText aria-hidden /> {t("Logs")}
          </Button>
          {canShell && (
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                setTerminal({ server: c.server, container: c.name })
              }
            >
              <IconTerminal2 aria-hidden /> {t("Shell")}
            </Button>
          )}
        </span>
      ),
    },
  ]

  const link =
    "inline-flex items-center gap-1 font-mono text-xs text-brand-text underline-offset-4 hover:underline"

  return (
    <Page className="flex flex-col gap-4 py-5">
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <PageHeader
          title={project.name}
          status={
            latest ? (
              <DeploymentStatus status={latest.status} />
            ) : (
              <StatusBadge state="new" label={t("Not deployed")} />
            )
          }
          description={
            <span className="flex min-w-0 items-center gap-1.5">
              <SourceIcon source={project.source.type} className="size-3.5" />
              <span dir="ltr" className="truncate">
                {source}
              </span>
            </span>
          }
          actions={<DeployButton project={project} onDeployed={deployed} />}
          tabs={
            <TabsList
              variant="line"
              className="w-full max-w-full justify-start overflow-x-auto border-b"
            >
              <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
              <TabsTrigger value="deployments">{t("Deployments")}</TabsTrigger>
              <TabsTrigger value="logs">{t("Logs")}</TabsTrigger>
              <TabsTrigger value="variables">{t("Variables")}</TabsTrigger>
              {canDomains && (
                <TabsTrigger value="domains">{t("Domains")}</TabsTrigger>
              )}
              <TabsTrigger value="settings">{t("Settings")}</TabsTrigger>
            </TabsList>
          }
        />

        <TabsContent value="overview" className="flex flex-col gap-4">
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

          <StatStrip>
            <Stat
              label={t("Live release")}
              value={project.release ? `#${project.release.number}` : "—"}
              hint={
                project.release
                  ? project.release.commit
                    ? `${shortSha(project.release.commit.sha)} ${project.release.commit.message ?? ""}`
                    : undefined
                  : t("Not deployed yet")
              }
            />
            <Stat
              label={t("Running on")}
              value={t("{{count}} servers", {
                count: project.placedOn.length,
              })}
              hint={t("{{n}} replicas each · {{strategy}}", {
                n: project.autoscale
                  ? `${project.autoscale.min}–${project.autoscale.max}`
                  : project.replicasPerServer,
                strategy: strategyLabel,
              })}
            />
            <Stat
              label={t("Last deployment")}
              value={latest ? ago(latest.createdAt) : "—"}
              hint={latest && <DeploymentStatus status={latest.status} />}
            />
            {canDomains && (
              <Stat
                label={t("Domains")}
                value={`${activeDomains.length} / ${domains?.length ?? 0}`}
                hint={t("Live")}
              />
            )}
          </StatStrip>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
            <Panel
              title={t("Recent deployments")}
              actions={
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setTab("deployments")}
                >
                  {t("View all")}
                </Button>
              }
              bodyClassName="p-0"
            >
              <DeploymentsTable
                deployments={deployments?.slice(0, 6)}
                onOpen={setOpen}
              />
            </Panel>

            <Panel title={t("Reach it")} bodyClassName="px-4 py-1">
              <KeyValue
                items={[
                  {
                    label: t("Internal"),
                    value: internal,
                    copy: internal,
                  },
                  ...(domains ?? []).map((d) => ({
                    label: t("Domain"),
                    value:
                      d.status === "active" ? (
                        <a
                          href={`https://${d.hostname}`}
                          target="_blank"
                          rel="noreferrer"
                          dir="ltr"
                          className={link}
                        >
                          https://{d.hostname}
                          <IconExternalLink className="size-3" aria-hidden />
                        </a>
                      ) : (
                        <span className="flex min-w-0 flex-wrap items-center gap-2">
                          <span
                            dir="ltr"
                            className="truncate font-mono text-xs text-muted-foreground"
                          >
                            {d.hostname}
                          </span>
                          <StatusBadge
                            state={d.status === "failed" ? "failed" : "pending"}
                            label={
                              d.status === "failed"
                                ? t("Needs attention")
                                : t("Not live yet")
                            }
                          />
                        </span>
                      ),
                  })),
                  ...urls.map((url) => ({
                    label: t("Public port"),
                    value: (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        dir="ltr"
                        className={link}
                      >
                        {url}
                        <IconExternalLink className="size-3" aria-hidden />
                      </a>
                    ),
                  })),
                  ...(project.publicPort && !urls.length
                    ? [
                        {
                          label: t("Public port"),
                          value: t("Port {{port}} on every server", {
                            port: project.publicPort,
                          }),
                        },
                      ]
                    : []),
                  ...(!project.publicPort && !activeDomains.length
                    ? [{ label: t("Public"), value: t("Not public") }]
                    : []),
                  ...(project.autoscale
                    ? (project.autoscaled ?? []).map((a) => ({
                        label: t("Autoscale"),
                        value: (
                          <span title={a.reason}>
                            {t("{{server}}: {{n}} replicas now ({{reason}})", {
                              server:
                                project.servers.find((s) => s._id === a.server)
                                  ?.name ?? a.server,
                              n: a.replicas,
                              reason: a.reason,
                            })}
                          </span>
                        ),
                      }))
                    : []),
                ]}
              />
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="deployments" className="flex flex-col gap-4">
          <Panel title={t("Deployments")} bodyClassName="p-0">
            <DeploymentsTable deployments={deployments} onOpen={setOpen} />
          </Panel>
          <Releases project={project} onDeployed={deployed} />
        </TabsContent>

        <TabsContent value="logs">
          {!project.containers.length ? (
            <EmptyState
              icon={IconServer2}
              title={t("Nothing is running yet.")}
            />
          ) : (
            <DataTable
              label={t("Containers")}
              columns={containerColumns}
              rows={project.containers}
              rowId={(c) => `${c.server}/${c.name}`}
            />
          )}
        </TabsContent>

        <TabsContent value="variables" className="flex flex-col gap-3">
          <p className="text-[13px] text-muted-foreground">
            {t(
              "Variables apply on the next deploy; they override tenant and global variables."
            )}
          </p>
          <VariableTable scope={{ scope: "project", project: project._id }} />
        </TabsContent>

        {canDomains && (
          <TabsContent value="domains">
            <DomainsTab project={project._id} />
          </TabsContent>
        )}

        <TabsContent value="settings">
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
        onRedeployed={deployed}
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
          {deployKey && <CodeBlock code={deployKey} wrap />}
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
