import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { Link, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { IconCopy, IconSparkles } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { PageHeader } from "@/components/console/page-header"
import { use } from "@/core/hooks/use"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SelectAllCheckbox,
  SelectCheckbox,
  SelectionBar,
  useSelection,
  type TSelection,
} from "@/components/selection-bar"
import { cn } from "@/lib/utils"
import { CloneDialog, TemplateIcon, type TTemplate } from "./shared"
import { useFresh } from "@/hooks/use-fresh"
import { useAiStatus } from "@/hooks/use-ai"
import { AiDraftDialog } from "./AiDraft"

function TemplateCard({
  template,
  onClone,
  selection,
}: {
  template: TTemplate
  onClone: () => void
  selection?: TSelection
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-[10px] border bg-card p-3 transition-colors hover:bg-accent/50",
        selection?.has(template._id) && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted">
          <TemplateIcon icon={template.icon} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          {/* The whole card is the link; the clone button sits above it. */}
          <Link
            to={`./${template._id}`}
            className="block truncate text-[13px] font-medium after:absolute after:inset-0 after:rounded-[10px] focus-visible:outline-none after:focus-visible:ring-2 after:focus-visible:ring-ring"
          >
            {template.name}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            <Badge variant="secondary">
              {template.kind === "app" ? t("App") : t("Service")}
            </Badge>
            <Badge variant="outline" className="font-mono tabular-nums">
              v{template.latestVersion}
            </Badge>
            {template.clonedFrom && (
              <Badge variant="outline">{t("Cloned")}</Badge>
            )}
          </div>
        </div>
        {selection && (
          <span className="relative z-10 flex size-8 items-center justify-center">
            <SelectCheckbox
              selection={selection}
              id={template._id}
              label={template.name}
            />
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative z-10"
          onClick={onClone}
          aria-label={t("Clone {{name}}", { name: template.name })}
        >
          <IconCopy />
        </Button>
      </div>
      {template.description && (
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {template.description}
        </p>
      )}
    </div>
  )
}

function Section({
  title,
  description,
  templates,
  onClone,
  empty,
  selection,
}: {
  title: string
  description: string
  templates: TTemplate[]
  onClone: (template: TTemplate) => void
  empty?: string
  /** Only the tenant's own templates can be deleted, so only they select. */
  selection?: TSelection
}) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {selection && templates.length > 1 && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <SelectAllCheckbox
              selection={selection}
              ids={templates.map((x) => x._id)}
            />
            {t("Select all")}
          </label>
        )}
      </div>
      {templates.length ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {templates.map((template) => (
            <TemplateCard
              key={template._id}
              template={template}
              onClone={() => onClone(template)}
              selection={selection}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-[10px] border border-dashed p-6 text-center text-[13px] text-muted-foreground">
          {empty}
        </p>
      )}
    </section>
  )
}

/** Templates (PLAN §9.1): the tenant's own first, then the built-in ones to start from. */
export default function TemplatesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [cloning, setCloning] = React.useState<TTemplate | null>(null)
  const [drafting, setDrafting] = React.useState(false)
  const { status: ai } = useAiStatus()

  const request = ThunderSDK.useCaching(
    ["templates"],
    async ({ signal }) => await ThunderSDK.templates.list({ signal })
  )
  const { data, isLoading } = use(request)
  useFresh(request)
  const selection = useSelection()

  const own = (data ?? []).filter((x) => x.scope === "tenant")
  const system = (data ?? []).filter((x) => x.scope === "system")

  return (
    <Page className="flex flex-col gap-6 py-5">
      <PageHeader
        title={t("Templates")}
        description={t(
          "Recipes that turn a repository into an image, or set up a ready-made service."
        )}
        actions={
          ai?.enabled && (
            <Button size="sm" onClick={() => setDrafting(true)}>
              <IconSparkles aria-hidden /> {t("Create with AI")}
            </Button>
          )
        }
      />

      {isLoading && !data ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-[10px]" />
          ))}
        </div>
      ) : (
        <>
          <Section
            title={t("This tenant")}
            description={t(
              "Your own templates. Every save becomes a new version."
            )}
            templates={own}
            onClone={setCloning}
            selection={selection}
            empty={t("Clone a built-in template below to customise it.")}
          />
          <Section
            title={t("Apps")}
            description={t("Built-in templates for building from your code.")}
            templates={system.filter((x) => x.kind === "app")}
            onClone={setCloning}
          />
          <Section
            title={t("One-click services")}
            description={t("Databases and storage, with generated passwords.")}
            templates={system.filter((x) => x.kind === "service")}
            onClone={setCloning}
          />
        </>
      )}

      <SelectionBar
        selection={selection}
        remove={(id) => ThunderSDK.templates.del({ params: { id } })}
        onDone={() => request.invalidate()}
        canDelete={ThunderSDK.isPermitted("templates", "del")}
      />

      <AiDraftDialog
        open={drafting}
        onOpenChange={setDrafting}
        onCreated={(id) => {
          request.invalidate()
          navigate(`./${id}`)
        }}
      />

      <CloneDialog
        template={cloning}
        onOpenChange={(open) => !open && setCloning(null)}
        onCloned={(id) => {
          request.invalidate()
          navigate(`./${id}`)
        }}
      />
    </Page>
  )
}
