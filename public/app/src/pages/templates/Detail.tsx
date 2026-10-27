import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconCopy, IconPlayerPlay, IconTrash } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { KeyValue } from "@/components/console/key-value"
import { CodeBlock } from "@/components/console/code-block"
import { langOf } from "@/components/console/highlight"
import { DataTable } from "@/components/console/data-table"
import { useBreadcrumbTitle } from "@/core/layouts/shared/breadcrumb"
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
import { Textarea } from "@/components/ui/textarea"
import { errorMessage } from "@/lib/utils"
import { CloneDialog, TemplateIcon } from "./shared"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"
import { dateTime } from "@/lib/format"

type TDetail = Awaited<ReturnType<typeof ThunderSDK.templates.get>>
type TContent = TDetail["content"]
export type TInput = TContent["inputs"][number]

/** Tenant templates are edited here; saving creates the next version. */
function SourceEditor({
  id,
  kind,
  content,
  onSaved,
}: {
  id: string
  kind: "app" | "service"
  content: TContent
  onSaved: (version: number) => void
}) {
  const { t } = useTranslation()
  const field = kind === "app" ? "dockerfile" : "compose"
  const [source, setSource] = React.useState(content[field] ?? "")
  const [inputs, setInputs] = React.useState(
    JSON.stringify(content.inputs, null, 2)
  )
  const [changelog, setChangelog] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const dirty =
    source !== (content[field] ?? "") ||
    inputs !== JSON.stringify(content.inputs, null, 2)

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    let parsed: TInput[]
    try {
      parsed = JSON.parse(inputs)
    } catch {
      return setError(t("Inputs must be valid JSON"))
    }
    setBusy(true)
    try {
      const { version } = await ThunderSDK.templates.saveTemplateVersion({
        params: { id },
        body: {
          [field]: source,
          inputs: parsed,
          defaults: content.defaults,
          cachePaths: content.cachePaths,
          ...(changelog ? { changelog } : {}),
        },
      })
      toast.success(t("Saved as version {{version}}", { version }))
      setChangelog("")
      onSaved(version)
    } catch (e) {
      setError(errorMessage(e) ?? t("Could not save the template"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="template-source">
          {kind === "app" ? "Dockerfile" : "compose.yaml"}
        </FieldLabel>
        <Textarea
          id="template-source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={22}
          spellCheck={false}
          className="font-mono text-xs leading-relaxed"
        />
        <FieldDescription>
          {t("Handlebars: use {{inputs}} and {{cacheKey}}.", {
            inputs: "{{inputs.NAME}}",
            cacheKey: "{{build.cacheKey}}",
            interpolation: { escapeValue: false },
          })}
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="template-inputs">{t("Inputs (JSON)")}</FieldLabel>
        <Textarea
          id="template-inputs"
          value={inputs}
          onChange={(e) => setInputs(e.target.value)}
          rows={10}
          spellCheck={false}
          className="font-mono text-xs"
        />
      </Field>
      <div className="flex flex-wrap items-end gap-3">
        <Field className="min-w-60 flex-1">
          <FieldLabel htmlFor="template-changelog">
            {t("What changed")}
          </FieldLabel>
          <Input
            id="template-changelog"
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            maxLength={1_000}
            placeholder={t("Optional")}
          />
        </Field>
        <Button type="submit" disabled={busy || !dirty}>
          {t("Save as version {{version}}", {
            version: content.version + 1,
          })}
        </Button>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </form>
  )
}

/** One template input as a form field (also used by the project wizard). */
export function InputField({
  input,
  value,
  onChange,
}: {
  input: TInput
  value: unknown
  onChange: (value: unknown) => void
}) {
  const { t } = useTranslation()
  const id = `input-${input.key}`

  if (input.type === "boolean") {
    return (
      <Field orientation="horizontal">
        <FieldLabel htmlFor={id}>{input.label}</FieldLabel>
        <Switch
          id={id}
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </Field>
    )
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {input.label}
        {input.required && <span className="text-destructive">*</span>}
      </FieldLabel>
      {input.type === "select" ? (
        <Select
          items={(input.options ?? []).map((o) => ({ value: o, label: o }))}
          value={String(value ?? "")}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(input.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={
            input.type === "number"
              ? "number"
              : input.type === "secret"
                ? "password"
                : "text"
          }
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={input.generate ? t("Generated when empty") : undefined}
          autoComplete="off"
        />
      )}
      {input.description && (
        <FieldDescription>{input.description}</FieldDescription>
      )}
    </Field>
  )
}

/** Renders the version with sample values, exactly as a deploy would. */
function Preview({ id, content }: { id: string; content: TContent }) {
  const { t } = useTranslation()
  const [values, setValues] = React.useState<Record<string, unknown>>(() =>
    Object.fromEntries(content.inputs.map((i) => [i.key, i.default ?? ""]))
  )
  const [result, setResult] = React.useState<{
    files: Record<string, string>
    generated: string[]
  }>()
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const render = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      setResult(
        await ThunderSDK.templates.render({
          params: { id },
          body: { version: content.version, inputs: values },
        })
      )
    } catch (e) {
      setResult(undefined)
      setError(errorMessage(e) ?? t("Could not render the template"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <form onSubmit={render} className="flex flex-col gap-4">
        {content.inputs.map((input) => (
          <InputField
            key={input.key}
            input={input}
            value={values[input.key]}
            onChange={(value) =>
              setValues((current) => ({ ...current, [input.key]: value }))
            }
          />
        ))}
        <Button type="submit" disabled={busy}>
          <IconPlayerPlay aria-hidden /> {t("Render")}
        </Button>
      </form>
      <div className="flex min-w-0 flex-col gap-3">
        {error && <FieldError>{error}</FieldError>}
        {result ? (
          <>
            {result.generated.length > 0 && (
              <p className="text-[13px] text-muted-foreground">
                {t("Generated: {{keys}}. A deploy stores them as secrets.", {
                  keys: result.generated.join(", "),
                })}
              </p>
            )}
            {Object.entries(result.files).map(([name, text]) => (
              <CodeBlock
                key={name}
                label={<span className="font-mono">{name}</span>}
                code={text}
                lang={langOf(name)}
              />
            ))}
          </>
        ) : (
          !error && (
            <p className="rounded-[10px] border border-dashed p-6 text-center text-[13px] text-muted-foreground">
              {t("Fill in the inputs and render to see the final file.")}
            </p>
          )
        )}
      </div>
    </div>
  )
}

function InputsTable({ inputs }: { inputs: TInput[] }) {
  const { t } = useTranslation()
  return (
    <DataTable
      label={t("Inputs")}
      rows={inputs}
      rowId={(input) => input.key}
      empty={t("This template has no inputs.")}
      columns={[
        {
          id: "key",
          header: t("Key"),
          sortValue: (input) => input.key,
          cell: (input) => (
            <span dir="ltr" className="font-mono text-xs">
              {input.key}
              {input.required && <span className="text-destructive">*</span>}
            </span>
          ),
        },
        {
          id: "label",
          header: t("Label"),
          sortValue: (input) => input.label,
          cell: (input) => input.label,
        },
        {
          id: "type",
          header: t("Type"),
          sortValue: (input) => input.type,
          cell: (input) => <Badge variant="outline">{input.type}</Badge>,
        },
        {
          id: "default",
          header: t("Default"),
          cell: (input) => (
            <span dir="ltr" className="font-mono text-xs">
              {input.generate ? t("generated") : String(input.default ?? "—")}
            </span>
          ),
        },
      ]}
    />
  )
}

export default function TemplateDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const [version, setVersion] = React.useState<number>()
  const [cloning, setCloning] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [tab, setTab] = React.useState("source")

  const { data, reload } = useCached(queries.template(id, version))
  const versions = useCached(queries.templateVersions(id))
  const history = versions.data
  useBreadcrumbTitle(data?.template.name)

  if (!data) {
    return (
      <Page className="flex flex-col gap-4 py-5">
        <Skeleton className="h-12 rounded-[10px]" />
        <Skeleton className="h-96 rounded-[10px]" />
      </Page>
    )
  }

  const { template, content } = data
  const editable =
    template.scope === "tenant" && content.version === template.latestVersion
  const source =
    (template.kind === "app" ? content.dockerfile : content.compose) ?? ""

  const remove = async () => {
    try {
      await ThunderSDK.templates.del({ params: { id } })
      toast.success(t("Template deleted"))
      navigate("..", { relative: "path" })
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not delete the template"))
    }
  }

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-muted">
              <TemplateIcon icon={template.icon} className="size-4" />
            </span>
            <h1 className="truncate font-heading text-xl font-semibold tracking-tight">
              {template.name}
            </h1>
          </div>
        }
        status={
          <Badge variant="secondary">
            {template.kind === "app" ? t("App") : t("Service")}
          </Badge>
        }
        description={template.description}
        actions={
          <>
            <Select
              items={(history ?? []).map((v) => ({
                value: String(v.version),
                label: `v${v.version}`,
              }))}
              value={String(content.version)}
              onValueChange={(v) =>
                setVersion(
                  Number(v) === template.latestVersion ? undefined : Number(v)
                )
              }
            >
              <SelectTrigger
                size="sm"
                className="w-28"
                aria-label={t("Version")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(history ?? []).map((v) => (
                  <SelectItem key={v.version} value={String(v.version)}>
                    v{v.version}
                    {v.version === template.latestVersion &&
                      ` (${t("latest")})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCloning(true)}
            >
              <IconCopy aria-hidden /> {t("Clone")}
            </Button>
            {template.scope === "tenant" && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleting(true)}
                aria-label={t("Delete template")}
              >
                <IconTrash />
              </Button>
            )}
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Tabs value={tab} onValueChange={setTab} className="min-w-0">
          <TabsList>
            <TabsTrigger value="source">
              {template.kind === "app" ? "Dockerfile" : "Compose"}
            </TabsTrigger>
            <TabsTrigger value="inputs">{t("Inputs")}</TabsTrigger>
            <TabsTrigger value="preview">{t("Preview")}</TabsTrigger>
            <TabsTrigger value="versions">{t("Versions")}</TabsTrigger>
          </TabsList>
          <TabsContent value="source" className="pt-3">
            {editable ? (
              <SourceEditor
                key={content.version}
                id={id}
                kind={template.kind}
                content={content}
                onSaved={() => {
                  setVersion(undefined)
                  reload()
                  versions.reload()
                }}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {template.scope === "system" && (
                  <p className="text-[13px] text-muted-foreground">
                    {t("Built-in templates are read-only. Clone it to edit.")}
                  </p>
                )}
                <CodeBlock
                  code={source}
                  lang={template.kind === "app" ? "dockerfile" : "yaml"}
                />
              </div>
            )}
          </TabsContent>
          <TabsContent value="inputs" className="pt-3">
            <InputsTable inputs={content.inputs} />
          </TabsContent>
          <TabsContent value="preview" className="pt-3">
            <Preview key={content.version} id={id} content={content} />
          </TabsContent>
          <TabsContent value="versions" className="pt-3">
            <DataTable
              label={t("Versions")}
              rows={history}
              loading={!history}
              rowId={(v) => String(v.version)}
              onRowClick={(v) => {
                setVersion(
                  v.version === template.latestVersion ? undefined : v.version
                )
                setTab("source")
              }}
              columns={[
                {
                  id: "version",
                  header: t("Version"),
                  sortValue: (v) => v.version,
                  className: "w-20",
                  cell: (v) => (
                    <span className="font-mono text-xs tabular-nums">
                      v{v.version}
                    </span>
                  ),
                },
                {
                  id: "changelog",
                  header: t("What changed"),
                  cell: (v) => (
                    <span className="line-clamp-1">
                      {v.changelog ?? t("No description")}
                    </span>
                  ),
                },
                {
                  id: "created",
                  header: t("Created"),
                  align: "end",
                  sortValue: (v) => new Date(v.createdAt).getTime(),
                  cell: (v) => (
                    <span className="text-xs whitespace-nowrap text-muted-foreground">
                      {dateTime(v.createdAt)}
                    </span>
                  ),
                },
              ]}
            />
          </TabsContent>
        </Tabs>

        <Panel title={t("Details")} bodyClassName="px-4 py-1">
          <KeyValue
            items={[
              {
                label: t("Scope"),
                value:
                  template.scope === "system" ? t("Built-in") : t("Tenant"),
              },
              {
                label: t("Kind"),
                value: template.kind === "app" ? t("App") : t("Service"),
              },
              { label: t("Slug"), value: template.slug, copy: template.slug },
              {
                label: t("Version"),
                value: (
                  <span className="font-mono text-xs tabular-nums">
                    v{content.version}
                    {content.version === template.latestVersion &&
                      ` (${t("latest")})`}
                  </span>
                ),
              },
              { label: t("Inputs"), value: content.inputs.length },
            ]}
          />
        </Panel>
      </div>

      <CloneDialog
        template={cloning ? template : null}
        onOpenChange={setCloning}
        onCloned={(clone) => navigate(`../${clone}`, { relative: "path" })}
      />
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("Delete {{name}}?", { name: template.name })}
            </DialogTitle>
            <DialogDescription>
              {t("All of its versions are deleted too.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={remove}>
              {t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  )
}
