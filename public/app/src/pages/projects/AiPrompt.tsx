import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconArrowUp,
  IconBrandGithub,
  IconLoader2,
  IconPlus,
  IconSparkles,
  IconX,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getLocalPath } from "@/core/lib/utils"
import { useAiStatus } from "@/hooks/use-ai"
import { cn, errorMessage } from "@/lib/utils"
import { GitHubPicker } from "@/pages/projects/NewProject"
import { InputField } from "@/pages/templates/Detail"
import { slugify } from "@/pages/templates/shared"

type TDraft = Awaited<ReturnType<typeof ThunderSDK.ai.draft>>
type TPlacement = Awaited<
  ReturnType<typeof ThunderSDK.projects.placementInfo>
>[number]
type TRepo = {
  integration?: string
  installation?: number
  repo?: string
  branch?: string
}

/** The inputs the chosen template asks for. */
const inputsOf = (draft: TDraft) =>
  draft.existing?.inputs ?? draft.template?.content.inputs ?? []

/** A free slug next to the tenant's projects: `redis`, then `redis-2`… */
const freeSlug = (name: string, taken: Set<string>) => {
  const base = slugify(name).slice(0, 34) || "app"
  let slug = base
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`
  return slug
}

/**
 * "What do you want to deploy?" on the overview (PLAN Phase 12): one prompt,
 * optionally a repository, then a short review (inputs, servers, name) and
 * Create project. It isn't deployed: the user adds its variables first.
 */
export function AiPrompt({ servers }: { servers: TPlacement[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { status, refresh } = useAiStatus()
  const [prompt, setPrompt] = React.useState("")
  const [withRepo, setWithRepo] = React.useState(false)
  const [repo, setRepo] = React.useState<TRepo>({})
  const [draft, setDraft] = React.useState<TDraft>()
  const [inputs, setInputs] = React.useState<Record<string, unknown>>({})
  const [picked, setPicked] = React.useState<string[]>([])
  const [name, setName] = React.useState("")
  const [replicas, setReplicas] = React.useState(1)
  const [domains, setDomains] = React.useState<string[]>([])
  const [busy, setBusy] = React.useState<"draft" | "deploy" | null>(null)

  const online = servers.filter((s) => s.online)
  const repoReady = !!(
    repo.integration &&
    repo.installation &&
    repo.repo &&
    repo.branch
  )
  const left = status ? Math.max(0, status.limit - status.used) : 0

  if (!status?.enabled) return null

  const ask = async () => {
    setBusy("draft")
    try {
      const result = await ThunderSDK.ai.draft({
        body: {
          description: prompt,
          ...(withRepo && repoReady
            ? {
                repo: {
                  integration: repo.integration!,
                  installation: repo.installation!,
                  repo: repo.repo!,
                  branch: repo.branch!,
                },
              }
            : {}),
        },
      })
      setDraft(result)
      setName(result.name)
      setReplicas(result.replicas ?? 1)
      setDomains(result.domains)
      setInputs({
        ...Object.fromEntries(
          inputsOf(result).flatMap((i) =>
            i.default === undefined ? [] : [[i.key, i.default]]
          )
        ),
        ...result.existing?.values,
      })
      // The online server with the most CPU to spare.
      const best = [...online].sort((a, b) => b.cpuFree - a.cpuFree)[0]
      setPicked(best ? [best.server] : [])
    } catch (e) {
      toast.error(errorMessage(e) ?? t("The AI couldn't write a template"))
    } finally {
      setBusy(null)
      refresh()
    }
  }

  const deploy = async () => {
    if (!draft) return
    setBusy("deploy")
    try {
      const projects = await ThunderSDK.projects.list({})
      const slug = freeSlug(name, new Set(projects.map((p) => p.slug)))
      // An existing template is used as it is; a new one is saved first.
      const template =
        draft.existing?.template ??
        (
          await ThunderSDK.templates.create({
            body: {
              kind: draft.kind,
              name: draft.template!.name,
              slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
              description: draft.template!.description,
              ...(draft.kind === "service" ? { icon: "stack-2" } : {}),
              content: draft.template!.content,
            },
          })
        )._id
      const fromRepo = draft.kind === "app" && withRepo && repoReady
      const { _id } = await ThunderSDK.projects.create({
        body: {
          name,
          slug,
          source: fromRepo
            ? {
                type: "github",
                gitIntegration: repo.integration!,
                installation: repo.installation!,
                repo: repo.repo!,
                branch: repo.branch!,
              }
            : { type: "template" },
          ...(fromRepo
            ? {
                build: {
                  mode: "template",
                  rootDir: ".",
                  dockerfilePath: "Dockerfile",
                },
              }
            : {}),
          template: { template },
          inputs: Object.fromEntries(
            Object.entries(inputs).filter(([, v]) => v !== "")
          ) as Record<string, string | number | boolean>,
          servers: picked,
          replicasPerServer: replicas,
          volumes: [],
          variables: [],
          autoDeploy: true,
          distribution: "auto",
        },
      })
      // Domains wait for their DNS records: the project's Domains tab says which.
      for (const hostname of domains) {
        await ThunderSDK.domains
          .create({ body: { project: _id, hostname } })
          .catch((e) =>
            toast.error(
              t("{{domain}}: {{error}}", {
                domain: hostname,
                error: errorMessage(e) ?? t("Could not add the domain"),
              })
            )
          )
      }
      // Not deployed yet: the app's variables (API keys, database URLs…)
      // aren't known, so the user adds them and deploys.
      toast.success(t("Project created. Add its variables, then deploy it."))
      navigate(getLocalPath(`applications/projects/${_id}`), {
        state: { tab: "variables" },
      })
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not create the project"))
    } finally {
      setBusy(null)
    }
  }

  const fields = draft ? inputsOf(draft) : []
  const missing = fields.some(
    (i) =>
      i.required &&
      !i.generate &&
      (inputs[i.key] === undefined || inputs[i.key] === "")
  )
  const appWithoutRepo = draft?.kind === "app" && !(withRepo && repoReady)

  return (
    <section
      aria-labelledby="ai-prompt-title"
      className="flex flex-col gap-3 rounded-[10px] border bg-card p-3"
    >
      <h2
        id="ai-prompt-title"
        className="flex items-center gap-2 px-1 text-sm font-semibold"
      >
        <IconSparkles className="size-4 text-brand-text" aria-hidden />
        {t("What do you want to deploy?")}
      </h2>

      <div className="rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring/40">
        <Textarea
          aria-labelledby="ai-prompt-title"
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && prompt.trim())
              ask()
          }}
          placeholder={t("e.g. Postgres 17 with 2 GB of memory")}
          className="min-h-14 resize-none border-0 bg-transparent text-[13px] shadow-none focus-visible:ring-0"
          disabled={!!busy}
        />
        <div className="flex flex-wrap items-center gap-2 px-2 pb-2">
          <Button
            type="button"
            size="sm"
            variant={withRepo ? "secondary" : "ghost"}
            onClick={() => setWithRepo((v) => !v)}
            aria-pressed={withRepo}
          >
            <IconBrandGithub aria-hidden />
            {withRepo && repo.repo ? repo.repo : t("From a repository")}
          </Button>
          <span className="ms-auto text-xs text-muted-foreground">
            {t("{{n}} of {{limit}} AI requests left this month.", {
              n: left,
              limit: status.limit,
            })}
          </span>
          <Button
            type="button"
            size="icon-sm"
            aria-label={t("Generate")}
            onClick={ask}
            disabled={
              !!busy ||
              prompt.trim().length < 3 ||
              (withRepo && !repoReady) ||
              left === 0
            }
          >
            {busy === "draft" ? (
              <IconLoader2 className="animate-spin" aria-hidden />
            ) : (
              <IconArrowUp aria-hidden />
            )}
          </Button>
        </div>
      </div>

      {withRepo && <GitHubPicker value={repo} onChange={setRepo} />}

      {busy === "draft" && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t("Writing the template…")}
        </p>
      )}

      {draft && (
        <div className="flex min-w-0 flex-col gap-4 rounded-lg border bg-background p-3">
          <div className="flex flex-wrap items-start gap-2">
            <p className="min-w-0 flex-1 text-sm">{draft.explanation}</p>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={t("Discard")}
              onClick={() => setDraft(undefined)}
            >
              <IconX />
            </Button>
          </div>

          {appWithoutRepo && (
            <p className="rounded-lg bg-warning-soft p-3 text-[13px] text-warning-foreground">
              {t(
                "This builds your code: pick a repository above, then generate again."
              )}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="ai-project-name">{t("Name")}</FieldLabel>
              <Input
                id="ai-project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            {fields.map((input) => (
              <InputField
                key={input.key}
                input={input}
                value={inputs[input.key]}
                onChange={(v) => setInputs((s) => ({ ...s, [input.key]: v }))}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("Servers")}</span>
            <div className="flex flex-wrap gap-2">
              {online.map((s) => {
                const on = picked.includes(s.server)
                return (
                  <button
                    key={s.server}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setPicked((p) =>
                        on ? p.filter((x) => x !== s.server) : [...p, s.server]
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      on
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    {s.name}
                  </button>
                )
              })}
              {!online.length && (
                <span className="text-sm text-muted-foreground">
                  {t("No server is online.")}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="ai-replicas">
                {t("Replicas per server")}
              </FieldLabel>
              <Input
                id="ai-replicas"
                type="number"
                min={1}
                max={20}
                value={replicas}
                onChange={(e) =>
                  setReplicas(Math.max(1, Math.min(20, Number(e.target.value))))
                }
              />
            </Field>
            {domains.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">{t("Domains")}</span>
                <div className="flex flex-wrap gap-2">
                  {domains.map((d) => (
                    <Badge
                      key={d}
                      variant="outline"
                      className="gap-1 font-mono"
                    >
                      {d}
                      <button
                        type="button"
                        aria-label={t("Remove {{name}}", { name: d })}
                        onClick={() =>
                          setDomains((all) => all.filter((x) => x !== d))
                        }
                      >
                        <IconX className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {t(
                    "Added to the project; its Domains tab shows the DNS records to create."
                  )}
                </span>
              </div>
            )}
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              <Badge variant="secondary" className="me-2">
                {draft.kind === "app" ? t("App") : t("Service")}
              </Badge>
              {draft.existing
                ? t("Uses the template {{name}}", {
                    name: draft.existing.name,
                  })
                : t("Show the new template")}
            </summary>
            {draft.template && (
              <pre
                dir="ltr"
                className="mt-2 max-h-72 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed"
              >
                {draft.template.content.dockerfile ??
                  draft.template.content.compose}
              </pre>
            )}
          </details>

          <div className="flex justify-end">
            <Button
              onClick={deploy}
              disabled={
                !!busy ||
                !name.trim() ||
                !picked.length ||
                missing ||
                appWithoutRepo
              }
            >
              {busy === "deploy" ? (
                <IconLoader2 className="animate-spin" aria-hidden />
              ) : (
                <IconPlus aria-hidden />
              )}
              {t("Create project")}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
