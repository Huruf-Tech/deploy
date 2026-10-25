import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconLoader2, IconSparkles } from "@tabler/icons-react"

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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAiStatus } from "@/hooks/use-ai"
import { errorMessage } from "@/lib/utils"
import { GitHubPicker } from "@/pages/projects/NewProject"
import { slugify } from "./shared"

/** Drafts are often named alike ("Redis"): a short suffix keeps slugs free. */
const uniqueSlug = (name: string) =>
  `${slugify(name).slice(0, 55)}-${Date.now().toString(36).slice(-4)}`

type TDraft = Awaited<ReturnType<typeof ThunderSDK.ai.draft>>
type TRepo = {
  integration?: string
  installation?: number
  repo?: string
  branch?: string
}

/**
 * "Create with AI" (PLAN Phase 12): a description, optionally a repository,
 * then a draft to look over. Saving opens it in the normal template editor.
 */
export function AiDraftDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}) {
  const { t } = useTranslation()
  const { status, refresh } = useAiStatus()
  const [description, setDescription] = React.useState("")
  const [fromRepo, setFromRepo] = React.useState(false)
  const [repo, setRepo] = React.useState<TRepo>({})
  const [draft, setDraft] = React.useState<TDraft>()
  const [name, setName] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const repoReady = !!(
    repo.integration &&
    repo.installation &&
    repo.repo &&
    repo.branch
  )
  const left = status ? Math.max(0, status.limit - status.used) : 0

  const generate = async () => {
    setBusy(true)
    try {
      const result = await ThunderSDK.ai.draft({
        body: {
          description,
          ...(fromRepo && repoReady
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
    } catch (e) {
      toast.error(errorMessage(e) ?? t("The AI couldn't write a template"))
    } finally {
      setBusy(false)
      refresh()
    }
  }

  const save = async () => {
    if (!draft) return
    setBusy(true)
    try {
      const { _id } = await ThunderSDK.templates.create({
        body: {
          kind: draft.kind,
          name,
          slug: uniqueSlug(name),
          description: draft.description,
          ...(draft.kind === "service" ? { icon: "stack-2" } : {}),
          content: draft.content,
        },
      })
      onCreated(_id)
      close()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save the template"))
    } finally {
      setBusy(false)
    }
  }

  const close = () => {
    onOpenChange(false)
    setDraft(undefined)
    setDescription("")
    setFromRepo(false)
    setRepo({})
  }

  const source = draft?.content.dockerfile ?? draft?.content.compose ?? ""

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSparkles className="size-5 text-primary" aria-hidden />
            {t("Create a template with AI")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Describe what to deploy. Your description, and the repository's key files if you pick one, are sent to the AI provider."
            )}
          </DialogDescription>
        </DialogHeader>

        {!draft ? (
          <div className="flex min-w-0 flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="ai-description">
                {t("What should it deploy?")}
              </FieldLabel>
              <Textarea
                id="ai-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t(
                  "e.g. Redis with a password, 512 MB and append-only persistence"
                )}
              />
            </Field>
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={fromRepo} onCheckedChange={setFromRepo} />
              {t("Build from a GitHub repository")}
            </label>
            {fromRepo && <GitHubPicker value={repo} onChange={setRepo} />}
            <FieldDescription>
              {t("{{n}} of {{limit}} AI requests left this month.", {
                n: left,
                limit: status?.limit ?? 0,
              })}
            </FieldDescription>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            <p className="rounded-2xl bg-muted/50 p-3 text-sm">
              {draft.explanation}
            </p>
            <Field>
              <FieldLabel htmlFor="ai-name">{t("Name")}</FieldLabel>
              <Input
                id="ai-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">
                {draft.kind === "app" ? t("App") : t("Service")}
              </Badge>
              {draft.content.inputs.map((i) => (
                <Badge key={i.key} variant="outline" className="font-mono">
                  {i.key}
                </Badge>
              ))}
            </div>
            <pre
              dir="ltr"
              className="max-h-80 overflow-auto rounded-2xl bg-muted/50 p-3 font-mono text-xs leading-relaxed"
            >
              {source}
            </pre>
            <FieldDescription>
              {t(
                "Saving creates a template you can still edit and preview before deploying."
              )}
            </FieldDescription>
          </div>
        )}

        <DialogFooter>
          {draft ? (
            <>
              <Button
                variant="outline"
                onClick={() => setDraft(undefined)}
                disabled={busy}
              >
                {t("Start over")}
              </Button>
              <Button onClick={save} disabled={busy || !name.trim()}>
                {busy && <IconLoader2 className="animate-spin" aria-hidden />}
                {t("Save template")}
              </Button>
            </>
          ) : (
            <Button
              onClick={generate}
              disabled={
                busy ||
                description.trim().length < 3 ||
                (fromRepo && !repoReady) ||
                left === 0
              }
            >
              {busy ? (
                <IconLoader2 className="animate-spin" aria-hidden />
              ) : (
                <IconSparkles aria-hidden />
              )}
              {busy ? t("Writing the template…") : t("Generate")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
