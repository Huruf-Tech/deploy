import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import { toast } from "sonner"
import { IconCopy, IconPlayerPlay, IconTrash } from "@tabler/icons-react"

import { Container } from "@/core/custom/Container"
import { use } from "@/core/hooks/use"
import { useBreadcrumbTitle } from "@/core/layouts/shared/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { errorMessage } from "@/lib/utils"
import { CloneDialog, TemplateIcon } from "./shared"

type TDetail = Awaited<ReturnType<typeof ThunderSDK.templates.get>>
type TContent = TDetail["content"]
export type TInput = TContent["inputs"][number]

const Code = ({ children }: { children: string }) => (
  <div className="relative rounded-2xl bg-muted/50">
    <pre className="max-h-[32rem] overflow-auto p-4 pe-12 font-mono text-xs leading-relaxed">
      {children}
    </pre>
    <CopyButton value={children} className="absolute end-2 top-2" />
  </div>
)

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
              <p className="text-sm text-muted-foreground">
                {t("Generated: {{keys}}. A deploy stores them as secrets.", {
                  keys: result.generated.join(", "),
                })}
              </p>
            )}
            {Object.entries(result.files).map(([name, text]) => (
              <div key={name} className="flex flex-col gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {name}
                </span>
                <Code>{text}</Code>
              </div>
            ))}
          </>
        ) : (
          !error && (
            <p className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
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
  if (!inputs.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("This template has no inputs.")}
      </p>
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("Key")}</TableHead>
            <TableHead>{t("Label")}</TableHead>
            <TableHead>{t("Type")}</TableHead>
            <TableHead>{t("Default")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inputs.map((input) => (
            <TableRow key={input.key}>
              <TableCell className="font-mono text-xs">
                {input.key}
                {input.required && <span className="text-destructive">*</span>}
              </TableCell>
              <TableCell>{input.label}</TableCell>
              <TableCell>
                <Badge variant="outline">{input.type}</Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {input.generate ? t("generated") : String(input.default ?? "—")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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

  const request = ThunderSDK.useCaching(
    ["templates", id, String(version ?? "latest")],
    async ({ signal }) =>
      await ThunderSDK.templates.get({
        signal,
        params: { id },
        query: version ? { version } : {},
      })
  )
  const { data } = use(request)
  const versions = ThunderSDK.useCaching(
    ["templates", id, "versions"],
    async ({ signal }) =>
      await ThunderSDK.templates.versions({ signal, params: { id } })
  )
  const { data: history } = use(versions)
  useBreadcrumbTitle(data?.template.name)

  if (!data) {
    return (
      <Container className="flex flex-col gap-4 py-4">
        <Skeleton className="h-16 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </Container>
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
    <Container className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted">
          <TemplateIcon icon={template.icon} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">{template.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge variant="secondary">
              {template.scope === "system" ? t("Built-in") : t("Workspace")}
            </Badge>
            <Badge variant="outline">
              {template.kind === "app" ? t("App") : t("Service")}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">
              {template.slug}
            </span>
          </div>
          {template.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {template.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            <SelectTrigger className="w-28" aria-label={t("Version")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(history ?? []).map((v) => (
                <SelectItem key={v.version} value={String(v.version)}>
                  v{v.version}
                  {v.version === template.latestVersion && ` (${t("latest")})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setCloning(true)}>
            <IconCopy aria-hidden /> {t("Clone")}
          </Button>
          {template.scope === "tenant" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleting(true)}
              aria-label={t("Delete template")}
            >
              <IconTrash />
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="source">
            {template.kind === "app" ? "Dockerfile" : "Compose"}
          </TabsTrigger>
          <TabsTrigger value="inputs">{t("Inputs")}</TabsTrigger>
          <TabsTrigger value="preview">{t("Preview")}</TabsTrigger>
          <TabsTrigger value="versions">{t("Versions")}</TabsTrigger>
        </TabsList>
        <TabsContent value="source" className="pt-4">
          {editable ? (
            <SourceEditor
              key={content.version}
              id={id}
              kind={template.kind}
              content={content}
              onSaved={() => {
                setVersion(undefined)
                request.invalidate()
                versions.invalidate()
              }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {template.scope === "system" && (
                <p className="text-sm text-muted-foreground">
                  {t("Built-in templates are read-only. Clone it to edit.")}
                </p>
              )}
              <Code>{source}</Code>
            </div>
          )}
        </TabsContent>
        <TabsContent value="inputs" className="pt-4">
          <InputsTable inputs={content.inputs} />
        </TabsContent>
        <TabsContent value="preview" className="pt-4">
          <Preview key={content.version} id={id} content={content} />
        </TabsContent>
        <TabsContent value="versions" className="pt-4">
          <ol className="flex flex-col gap-2">
            {(history ?? []).map((v) => (
              <li
                key={v.version}
                className="flex flex-wrap items-center gap-3 rounded-2xl border p-3"
              >
                <Badge variant="outline">v{v.version}</Badge>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {v.changelog ?? t("No description")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(v.createdAt), "PPp")}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setVersion(
                      v.version === template.latestVersion
                        ? undefined
                        : v.version
                    )
                    setTab("source")
                  }}
                >
                  {t("View")}
                </Button>
              </li>
            ))}
          </ol>
        </TabsContent>
      </Tabs>

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
    </Container>
  )
}
