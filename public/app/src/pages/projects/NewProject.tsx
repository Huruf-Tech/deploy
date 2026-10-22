import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { Link, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconBrandDocker,
  IconBrandGithub,
  IconDatabase,
  IconStack2,
  IconGitBranch,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { use } from "@/core/hooks/use"
import { useBreadcrumbTitle } from "@/core/layouts/shared/breadcrumb"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
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
import { getLocalPath } from "@/core/lib/utils"
import { useCapacity } from "@/hooks/use-capacity"
import { classFootprints, fitsIn, roomOf } from "@/lib/capacity"
import { cn, errorMessage } from "@/lib/utils"
import { InputField } from "@/pages/templates/Detail"
import { slugify, TemplateIcon } from "@/pages/templates/shared"

type TSourceKind = "github" | "git" | "image" | "compose" | "template"
type TBuildMode = "template" | "dockerfile" | "compose"
type TTemplateDetail = Awaited<ReturnType<typeof ThunderSDK.templates.get>>
type TRepository = Awaited<
  ReturnType<typeof ThunderSDK.gitIntegrations.repositories>
>["repositories"][number]

const SOURCES: {
  kind: TSourceKind
  icon: typeof IconBrandGithub
  title: string
  hint: string
}[] = [
  {
    kind: "github",
    icon: IconBrandGithub,
    title: "GitHub",
    hint: "Private repos, deploy on push",
  },
  {
    kind: "git",
    icon: IconGitBranch,
    title: "Git URL",
    hint: "Any host, over HTTPS or SSH",
  },
  {
    kind: "image",
    icon: IconBrandDocker,
    title: "Docker image",
    hint: "Already built and published",
  },
  {
    kind: "compose",
    icon: IconStack2,
    title: "Compose file",
    hint: "Paste a docker-compose.yml",
  },
  {
    kind: "template",
    icon: IconDatabase,
    title: "One-click service",
    hint: "Postgres, Redis, MinIO…",
  },
]

function Section({
  step,
  title,
  children,
}: {
  step: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border p-4 sm:p-6">
      <h2 className="flex items-center gap-3 font-medium">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Picks a GitHub installation, repository and branch. */
function GitHubPicker({
  value,
  onChange,
}: {
  value: {
    integration?: string
    installation?: number
    repo?: string
    branch?: string
  }
  onChange: (value: {
    integration?: string
    installation?: number
    repo?: string
    branch?: string
  }) => void
}) {
  const { t } = useTranslation()
  const integrations = use(
    ThunderSDK.useCaching(
      ["gitIntegrations"],
      async ({ signal }) => await ThunderSDK.gitIntegrations.list({ signal })
    )
  )
  const [repos, setRepos] = React.useState<TRepository[]>()
  const [filter, setFilter] = React.useState("")
  const [branches, setBranches] = React.useState<string[]>()

  const installations = (integrations.data ?? []).flatMap((i) =>
    i.installations.map((inst) => ({
      integration: i._id,
      installation: inst.id,
      label: `${inst.account.login} (${i.appName})`,
    }))
  )
  const installationKey =
    value.integration && value.installation
      ? `${value.integration}:${value.installation}`
      : ""

  React.useEffect(() => {
    if (!value.integration || !value.installation) return
    setRepos(undefined)
    ThunderSDK.gitIntegrations
      .repositories({
        params: {
          id: value.integration,
          installation: String(value.installation),
        },
        query: { page: 1 },
      })
      .then((r) => setRepos(r.repositories))
      .catch(() => setRepos([]))
  }, [value.integration, value.installation])

  React.useEffect(() => {
    if (!value.integration || !value.installation || !value.repo) return
    setBranches(undefined)
    ThunderSDK.gitIntegrations
      .branches({
        params: {
          id: value.integration,
          installation: String(value.installation),
        },
        query: { repo: value.repo, page: 1 },
      })
      .then((r) => setBranches(r.branches.map((b) => b.name)))
      .catch(() => setBranches([]))
  }, [value.integration, value.installation, value.repo])

  if (integrations.isLoading) return <Skeleton className="h-10 rounded-2xl" />
  if (!installations.length) {
    return (
      <Alert>
        <IconBrandGithub />
        <AlertDescription>
          {t("Connect GitHub first; it takes three clicks.")}{" "}
          <Link
            to={getLocalPath("build/gitIntegrations")}
            className="font-medium underline"
          >
            {t("Connect GitHub")}
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  const shown = (repos ?? [])
    .filter((r) => r.fullName.toLowerCase().includes(filter.toLowerCase()))
    .slice(0, 50)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel>{t("Account")}</FieldLabel>
        <Select
          items={installations.map((i) => ({
            value: `${i.integration}:${i.installation}`,
            label: i.label,
          }))}
          value={installationKey}
          onValueChange={(v) => {
            const [integration, installation] = String(v).split(":")
            onChange({ integration, installation: Number(installation) })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("Pick an account")} />
          </SelectTrigger>
          <SelectContent>
            {installations.map((i) => (
              <SelectItem
                key={`${i.integration}:${i.installation}`}
                value={`${i.integration}:${i.installation}`}
              >
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {installationKey && (
        <Field>
          <FieldLabel htmlFor="repo-filter">{t("Repository")}</FieldLabel>
          {value.repo ? (
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-mono text-sm">
                {value.repo}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({ ...value, repo: undefined, branch: undefined })
                }
              >
                {t("Change")}
              </Button>
            </div>
          ) : (
            <>
              <Input
                id="repo-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t("Filter repositories")}
              />
              <ul className="max-h-48 overflow-y-auto rounded-2xl border">
                {!repos ? (
                  <li className="p-3">
                    <Skeleton className="h-5" />
                  </li>
                ) : shown.length === 0 ? (
                  <li className="p-3 text-sm text-muted-foreground">
                    {t("No repositories")}
                  </li>
                ) : (
                  shown.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="w-full truncate px-3 py-2 text-start text-sm hover:bg-muted"
                        onClick={() =>
                          onChange({
                            ...value,
                            repo: r.fullName,
                            branch: r.defaultBranch,
                          })
                        }
                      >
                        {r.fullName}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </Field>
      )}
      {value.repo && (
        <Field>
          <FieldLabel>{t("Branch")}</FieldLabel>
          <Select
            items={(branches ?? [value.branch ?? ""]).map((b) => ({
              value: b,
              label: b,
            }))}
            value={value.branch ?? ""}
            onValueChange={(v) => onChange({ ...value, branch: String(v) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(branches ?? [value.branch ?? ""]).map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            {t("Pushes to this branch deploy automatically.")}
          </FieldDescription>
        </Field>
      )}
    </div>
  )
}

/** New project (PLAN §15.6): source → build → where it runs. */
export default function NewProject() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  useBreadcrumbTitle(t("New project"))

  const [kind, setKind] = React.useState<TSourceKind>("github")
  const [github, setGithub] = React.useState<{
    integration?: string
    installation?: number
    repo?: string
    branch?: string
  }>({})
  const [gitUrl, setGitUrl] = React.useState("")
  const [gitBranch, setGitBranch] = React.useState("main")
  const [image, setImage] = React.useState("")
  const [compose, setCompose] = React.useState("")
  const [mode, setMode] = React.useState<TBuildMode>("template")
  const [templateId, setTemplateId] = React.useState<string>()
  const [template, setTemplate] = React.useState<TTemplateDetail>()
  const [inputs, setInputs] = React.useState<Record<string, unknown>>({})
  const [rootDir, setRootDir] = React.useState(".")
  const [dockerfilePath, setDockerfilePath] = React.useState("Dockerfile")
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [slugEdited, setSlugEdited] = React.useState(false)
  const [servers, setServers] = React.useState<string[]>([])
  const [replicas, setReplicas] = React.useState(1)
  const [port, setPort] = React.useState("")
  const [publicPort, setPublicPort] = React.useState("")
  const [healthPath, setHealthPath] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const templates = use(
    ThunderSDK.useCaching(
      ["templates"],
      async ({ signal }) => await ThunderSDK.templates.list({ signal })
    )
  )
  const placement = use(
    ThunderSDK.useCaching(
      ["projects", "placement"],
      async ({ signal }) => await ThunderSDK.projects.placementInfo({ signal })
    )
  )
  const projects = use(
    ThunderSDK.useCaching(
      ["projects"],
      async ({ signal }) => await ThunderSDK.projects.list({ signal })
    )
  )
  const onlineServers = React.useMemo(
    () => (placement.data ?? []).filter((s) => s.online).map((s) => s.server),
    [placement.data]
  )
  // Observed footprints (PLAN §7.1): fit by what this kind of app uses here.
  const capacity = useCapacity(onlineServers)
  const wantedKind = kind === "template" ? "service" : "app"
  const choices = (templates.data ?? []).filter((x) => x.kind === wantedKind)

  React.useEffect(() => {
    if (!templateId) return setTemplate(undefined)
    ThunderSDK.templates
      .get({ params: { id: templateId }, query: {} })
      .then((detail) => {
        setTemplate(detail)
        setInputs(
          Object.fromEntries(
            detail.content.inputs.map((i) => [i.key, i.default ?? ""])
          )
        )
        if (detail.content.defaults.port)
          setPort(String(detail.content.defaults.port))
        if (detail.content.defaults.healthcheckPath)
          setHealthPath(detail.content.defaults.healthcheckPath)
        if (!slugEdited && !name) {
          setName(detail.template.name)
          setSlug(slugify(detail.template.slug))
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  // Name the project after the repository by default.
  React.useEffect(() => {
    const base =
      kind === "github"
        ? github.repo?.split("/")[1]
        : kind === "git"
          ? gitUrl
              .split("/")
              .pop()
              ?.replace(/\.git$/, "")
          : undefined
    if (base && !slugEdited) {
      setName(base)
      setSlug(slugify(base))
    }
  }, [kind, github.repo, gitUrl, slugEdited])

  const fromRepo = kind === "github" || kind === "git"
  const usesTemplate = kind === "template" || (fromRepo && mode === "template")
  const needCpu = 0.1 * replicas
  const needMem = 128 * replicas
  const reports = (capacity.data ?? []).flatMap((r) =>
    "report" in r ? [r] : []
  )
  const footprint = (usesTemplate &&
    templateId &&
    projects.data &&
    classFootprints(
      reports.map((r) => r.report),
      projects.data
    ).find((c) => c.key === templateId && c.samples > 0)) || {
    key: "new",
    name: name || "this app",
    cpu: 0.1,
    memMb: 128,
    diskMb: 0,
    samples: 0,
  }
  /** Room left on a server after this project, in more apps like it. */
  const fitAfter = (server: string) => {
    const r = reports.find((x) => x.server === server)
    if (!r) return undefined
    const room = roomOf(r.report)
    const after = {
      cpu: room.cpu - footprint.cpu * replicas,
      memMb: room.memMb - footprint.memMb * replicas,
      diskMb: room.diskMb - footprint.diskMb * replicas,
    }
    return after.memMb < 0 || after.diskMb < 0
      ? -1
      : fitsIn(after, footprint).fits
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const source =
      kind === "github"
        ? {
            type: "github" as const,
            gitIntegration: github.integration!,
            installation: github.installation!,
            repo: github.repo!,
            branch: github.branch!,
          }
        : kind === "git"
          ? {
              type: "git" as const,
              url: gitUrl.trim(),
              branch: gitBranch.trim(),
            }
          : kind === "image"
            ? { type: "image" as const, image: image.trim() }
            : kind === "compose"
              ? { type: "compose" as const }
              : { type: "template" as const }
    setBusy(true)
    try {
      const { _id, deployKeyPublic } = await ThunderSDK.projects.create({
        body: {
          name,
          slug,
          source,
          ...(kind === "github" || kind === "git"
            ? {
                build: {
                  mode: usesTemplate ? "template" : mode,
                  rootDir,
                  dockerfilePath,
                },
              }
            : {}),
          ...(usesTemplate && templateId
            ? { template: { template: templateId } }
            : {}),
          inputs,
          ...(kind === "compose" ? { compose } : {}),
          runtime: {
            ...(port ? { port: Number(port) } : {}),
            ...(healthPath ? { healthcheckPath: healthPath } : {}),
          },
          servers,
          replicasPerServer: replicas,
          ...(publicPort ? { publicPort: Number(publicPort) } : {}),
          volumes: [],
          autoDeploy: true,
          distribution: "auto",
        },
      })
      if (!deployKeyPublic) {
        await ThunderSDK.projects
          .deployProject({ params: { id: _id }, body: { noCache: false } })
          .catch(() => {})
        toast.success(t("Project created; the first deploy has started"))
      }
      navigate(`../${_id}`, { relative: "path", state: { deployKeyPublic } })
    } catch (e) {
      setError(errorMessage(e) ?? t("Could not create the project"))
    } finally {
      setBusy(false)
    }
  }

  const sourceReady =
    kind === "github"
      ? !!github.repo && !!github.branch
      : kind === "git"
        ? !!gitUrl && !!gitBranch
        : kind === "image"
          ? !!image
          : kind === "compose"
            ? !!compose.trim()
            : true
  const buildReady = !usesTemplate || !!template
  const ready =
    sourceReady && buildReady && !!name && !!slug && servers.length > 0

  return (
    <Page className="flex max-w-3xl flex-col gap-6 py-4">
      <div>
        <h1 className="text-xl font-semibold">{t("New project")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("Deploys start as soon as it's created.")}
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-6">
        <Section step={1} title={t("Source")}>
          <div
            role="radiogroup"
            aria-label={t("Source")}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
          >
            {SOURCES.map((s) => (
              <button
                key={s.kind}
                type="button"
                role="radio"
                aria-checked={kind === s.kind}
                onClick={() => {
                  setKind(s.kind)
                  setTemplateId(undefined)
                  setMode(s.kind === "template" ? "compose" : "template")
                }}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-2xl border p-3 text-start transition-colors hover:bg-muted",
                  kind === s.kind && "border-primary bg-primary/5"
                )}
              >
                <s.icon className="size-5" aria-hidden />
                <span className="text-sm font-medium">{t(s.title)}</span>
                <span className="text-xs text-muted-foreground">
                  {t(s.hint)}
                </span>
              </button>
            ))}
          </div>

          {kind === "github" && (
            <GitHubPicker value={github} onChange={setGithub} />
          )}
          {kind === "git" && (
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <Field>
                <FieldLabel htmlFor="git-url">{t("Repository URL")}</FieldLabel>
                <Input
                  id="git-url"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="https://gitlab.com/acme/shop.git"
                  required
                  className="font-mono"
                />
                <FieldDescription>
                  {t(
                    "For SSH URLs (git@…) you'll get a deploy key to add to the repository."
                  )}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="git-branch">{t("Branch")}</FieldLabel>
                <Input
                  id="git-branch"
                  value={gitBranch}
                  onChange={(e) => setGitBranch(e.target.value)}
                  required
                />
              </Field>
            </div>
          )}
          {kind === "image" && (
            <Field>
              <FieldLabel htmlFor="image">{t("Image")}</FieldLabel>
              <Input
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="ghcr.io/acme/api:1.4"
                required
                className="font-mono"
              />
            </Field>
          )}
          {kind === "compose" && (
            <Field>
              <FieldLabel htmlFor="compose">{t("Compose file")}</FieldLabel>
              <Textarea
                id="compose"
                value={compose}
                onChange={(e) => setCompose(e.target.value)}
                rows={14}
                spellCheck={false}
                placeholder={`services:\n  web:\n    image: nginx:1.27-alpine\n    ports: ["8080:80"]`}
                className="font-mono text-xs"
              />
              <FieldDescription>
                {t(
                  "Each service runs as its own container and is reachable as <service>.<slug>.internal. Use ${VAR} for secrets and set them in the project's variables; the file itself is stored encrypted. Services need an image (no build:)."
                )}
              </FieldDescription>
            </Field>
          )}
        </Section>

        {kind !== "image" && kind !== "compose" && (
          <Section
            step={2}
            title={kind === "template" ? t("Service") : t("Build")}
          >
            {kind !== "template" && (
              <div
                role="radiogroup"
                aria-label={t("How to build")}
                className="flex flex-wrap gap-2"
              >
                {(
                  [
                    ["template", t("From a template")],
                    ["dockerfile", t("The repo's Dockerfile")],
                    ...(kind === "github"
                      ? [["compose", t("The repo's compose file")]]
                      : []),
                  ] as [TBuildMode, string][]
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={mode === value ? "default" : "outline"}
                    size="sm"
                    role="radio"
                    aria-checked={mode === value}
                    onClick={() => setMode(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}

            {usesTemplate && (
              <div className="grid gap-2 sm:grid-cols-3">
                {choices.map((x) => (
                  <button
                    key={x._id}
                    type="button"
                    aria-pressed={templateId === x._id}
                    onClick={() => setTemplateId(x._id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3 text-start transition-colors hover:bg-muted",
                      templateId === x._id && "border-primary bg-primary/5"
                    )}
                  >
                    <TemplateIcon icon={x.icon} className="size-5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {x.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {x.scope === "system" ? t("Built-in") : t("Workspace")}{" "}
                        · v{x.latestVersion}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {usesTemplate && template && template.content.inputs.length > 0 && (
              <FieldSet>
                <FieldLegend variant="label">
                  {t("Template inputs")}
                </FieldLegend>
                <div className="grid gap-4 sm:grid-cols-2">
                  {template.content.inputs.map((input) => (
                    <InputField
                      key={input.key}
                      input={input}
                      value={inputs[input.key]}
                      onChange={(v) =>
                        setInputs((c) => ({ ...c, [input.key]: v }))
                      }
                    />
                  ))}
                </div>
              </FieldSet>
            )}

            {kind !== "template" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="root-dir">
                    {t("Root directory")}
                  </FieldLabel>
                  <Input
                    id="root-dir"
                    value={rootDir}
                    onChange={(e) => setRootDir(e.target.value)}
                    className="font-mono"
                  />
                </Field>
                {mode === "dockerfile" && (
                  <Field>
                    <FieldLabel htmlFor="dockerfile">
                      {t("Dockerfile path")}
                    </FieldLabel>
                    <Input
                      id="dockerfile"
                      value={dockerfilePath}
                      onChange={(e) => setDockerfilePath(e.target.value)}
                      className="font-mono"
                    />
                  </Field>
                )}
              </div>
            )}
          </Section>
        )}

        <Section
          step={kind === "image" || kind === "compose" ? 2 : 3}
          title={t("Where it runs")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="project-name">{t("Name")}</FieldLabel>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!slugEdited) setSlug(slugify(e.target.value))
                }}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-slug">{t("Slug")}</FieldLabel>
              <Input
                id="project-slug"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true)
                  setSlug(slugify(e.target.value).slice(0, 39))
                }}
                required
                className="font-mono"
              />
              <FieldDescription>
                {t("Other projects on the server reach it as {{name}}.", {
                  name: `${slug || "slug"}.internal`,
                })}
              </FieldDescription>
            </Field>
          </div>

          <FieldSet>
            <FieldLegend variant="label">{t("Servers")}</FieldLegend>
            {placement.isLoading && !placement.data ? (
              <Skeleton className="h-16 rounded-2xl" />
            ) : !placement.data?.length ? (
              <Alert>
                <IconAlertTriangle />
                <AlertDescription>
                  {t("Add a server first.")}{" "}
                  <Link
                    to={getLocalPath("infrastructure/servers")}
                    className="font-medium underline"
                  >
                    {t("Servers")}
                  </Link>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex flex-col gap-2">
                {placement.data.map((s) => {
                  const fits = s.cpuFree >= needCpu && s.memFreeMb >= needMem
                  const after = fitAfter(s.server)
                  const checked = servers.includes(s.server)
                  return (
                    <label
                      key={s.server}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-2xl border p-3",
                        checked && "border-primary bg-primary/5"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(on) =>
                          setServers((c) =>
                            on
                              ? [...c, s.server]
                              : c.filter((x) => x !== s.server)
                          )
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {s.name}{" "}
                          {!s.online && (
                            <span className="text-xs text-muted-foreground">
                              ({t("offline")})
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {t(
                            "{{cpu}} of {{cores}} CPU and {{mem}} MiB free to allocate",
                            {
                              cpu: s.cpuFree.toFixed(1),
                              cores: s.cpuCores,
                              mem: s.memFreeMb,
                            }
                          )}
                        </span>
                        {after !== undefined && (
                          <span
                            className={cn(
                              "block text-xs",
                              after < 0
                                ? "text-destructive"
                                : "text-muted-foreground"
                            )}
                          >
                            {after < 0
                              ? t(
                                  "By what runs there now, it's short on memory or disk."
                                )
                              : t(
                                  "After this, room for ≈ {{n}} more like it ({{mem}} MB each, {{how}}).",
                                  {
                                    n: after,
                                    mem: Math.round(footprint.memMb),
                                    how: footprint.samples
                                      ? t("measured")
                                      : t("reserved"),
                                  }
                                )}
                          </span>
                        )}
                      </span>
                      {!fits && (
                        <span className="text-xs text-destructive">
                          {t("Doesn't fit")}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </FieldSet>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="replicas">
                {t("Replicas per server")}
              </FieldLabel>
              <Input
                id="replicas"
                type="number"
                min={1}
                max={20}
                value={replicas}
                onChange={(e) =>
                  setReplicas(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </Field>
            {kind !== "template" && kind !== "compose" && (
              <Field>
                <FieldLabel htmlFor="port">{t("App port")}</FieldLabel>
                <Input
                  id="port"
                  type="number"
                  min={1}
                  max={65535}
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="3000"
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="public-port">{t("Public port")}</FieldLabel>
              <Input
                id="public-port"
                type="number"
                min={1}
                max={65535}
                value={publicPort}
                onChange={(e) => setPublicPort(e.target.value)}
                placeholder={t("Private")}
              />
            </Field>
            {kind !== "template" && kind !== "compose" && (
              <Field>
                <FieldLabel htmlFor="health">
                  {t("Health check path")}
                </FieldLabel>
                <Input
                  id="health"
                  value={healthPath}
                  onChange={(e) => setHealthPath(e.target.value)}
                  placeholder="/"
                  className="font-mono"
                />
              </Field>
            )}
          </div>
        </Section>

        {error && <FieldError>{error}</FieldError>}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={!ready || busy}>
            {busy ? t("Creating…") : t("Create and deploy")}
          </Button>
        </div>
      </form>
    </Page>
  )
}
