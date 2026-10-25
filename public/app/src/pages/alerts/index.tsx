import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconBell,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { useFresh } from "@/hooks/use-fresh"
import { Page } from "@/components/page"
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
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  SelectAllCheckbox,
  SelectCheckbox,
  SelectionBar,
  useSelection,
} from "@/components/selection-bar"
import { PageHeader } from "@/components/console/page-header"
import { DataTable, type TColumn } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { StatusBadge } from "@/components/console/status"
import { Toolbar } from "@/components/console/toolbar"
import { errorMessage } from "@/lib/utils"
import { METRICS } from "./metrics"

type TRule = Awaited<ReturnType<typeof ThunderSDK.alertRules.list>>[number]
type TMetric = TRule["metric"]
type TKind = TRule["target"]["kind"]
type TChannel = { type: "email" | "webhook" | "slack"; target: string }

const DEFAULTS: Record<TMetric, [number, number]> = {
  cpu: [90, 300],
  memory: [90, 300],
  disk: [90, 0],
  room: [512, 600],
  agentOffline: [0, 20],
  deployFailed: [0, 0],
  cpCpu: [80, 300],
  cpMemory: [90, 300],
  cpPollLatency: [100, 300],
  cpErrorRate: [2, 300],
  cpPollsMissing: [50, 180],
}

function Choice<T extends string>({
  id,
  value,
  onChange,
  options,
}: {
  id?: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(v) => onChange(v as T)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function RuleDialog({
  rule,
  open,
  onOpenChange,
  onSaved,
}: {
  rule: TRule | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const servers = use(
    ThunderSDK.useCaching(
      ["projects", "placement"],
      async ({ signal }) => await ThunderSDK.projects.placementInfo({ signal })
    )
  ).data
  const projects = use(
    ThunderSDK.useCaching(
      ["projects"],
      async ({ signal }) => await ThunderSDK.projects.list({ signal })
    )
  ).data
  // The server list must be current: invalidating "projects" also refreshes "projects:placement".
  useFresh(
    ThunderSDK.useCaching(
      ["projects"],
      async ({ signal }) => await ThunderSDK.projects.list({ signal })
    )
  )
  const [name, setName] = React.useState("")
  const [kind, setKind] = React.useState<TKind>("server")
  const [ref, setRef] = React.useState("all")
  const [metric, setMetric] = React.useState<TMetric>("cpu")
  const [threshold, setThreshold] = React.useState("")
  const [forSec, setForSec] = React.useState("")
  const [channels, setChannels] = React.useState<TChannel[]>([])
  const [enabled, setEnabled] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setName(rule?.name ?? "")
    setKind(rule?.target.kind ?? "server")
    setRef(rule?.target.ref ?? "all")
    setMetric(rule?.metric ?? "cpu")
    setThreshold(rule ? String(rule.threshold) : "")
    setForSec(rule ? String(rule.forSec) : "")
    setChannels(
      (rule?.channels as TChannel[] | undefined) ?? [
        { type: "email", target: "" },
      ]
    )
    setEnabled(rule?.enabled ?? true)
    setError(null)
  }, [open, rule])

  const meta = METRICS[metric]
  const metrics = (Object.keys(METRICS) as TMetric[]).filter((m) =>
    METRICS[m].kinds.includes(kind)
  )
  const targets =
    kind === "server"
      ? (servers ?? []).map((s) => ({ value: s.server, label: s.name }))
      : (projects ?? []).map((p) => ({ value: p._id, label: p.name }))

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const body = {
      name: name.trim(),
      target: { kind, ...(ref !== "all" ? { ref } : {}) },
      metric,
      ...(meta.unit && threshold !== ""
        ? { threshold: Number(threshold) }
        : {}),
      ...(forSec !== "" ? { forSec: Number(forSec) } : {}),
      channels: channels.map((c) => ({ ...c, target: c.target.trim() })),
      enabled,
    }
    try {
      if (rule) {
        await ThunderSDK.alertRules.update({ params: { id: rule._id }, body })
      } else {
        await ThunderSDK.alertRules.create({ body })
      }
      toast.success(t("Alert rule saved"))
      onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(errorMessage(e) ?? t("Could not save the rule"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {rule ? t("Edit alert rule") : t("New alert rule")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "CPU, memory, disk and room are checked by the servers themselves; offline and failed deploys by Huruf Deploy. You get one notice when it fires and one when it resolves."
              )}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="rule-name">{t("Name")}</FieldLabel>
            <Input
              id="rule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="rule-kind">{t("Watch")}</FieldLabel>
              <Choice
                id="rule-kind"
                value={kind}
                onChange={(k) => {
                  setKind(k)
                  setRef("all")
                  if (!METRICS[metric].kinds.includes(k)) setMetric("cpu")
                }}
                options={[
                  { value: "server", label: t("Servers") },
                  { value: "project", label: t("Projects") },
                ]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="rule-ref">
                {kind === "server" ? t("Server") : t("Project")}
              </FieldLabel>
              <Choice
                id="rule-ref"
                value={ref}
                onChange={setRef}
                options={[
                  {
                    value: "all",
                    label:
                      kind === "server"
                        ? t("Every server")
                        : t("Every project"),
                  },
                  ...targets,
                ]}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="rule-metric">{t("When")}</FieldLabel>
              <Choice
                id="rule-metric"
                value={metric}
                onChange={(m) => {
                  setMetric(m)
                  setThreshold("")
                  setForSec("")
                }}
                options={metrics.map((m) => ({
                  value: m,
                  label: t(METRICS[m].label),
                }))}
              />
            </Field>
            {meta.unit && (
              <Field>
                <FieldLabel htmlFor="rule-threshold">
                  {metric === "room" ? t("Below (MiB)") : t("Above (%)")}
                </FieldLabel>
                <Input
                  id="rule-threshold"
                  type="number"
                  min={0}
                  value={threshold}
                  placeholder={String(DEFAULTS[metric][0])}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </Field>
            )}
            {metric !== "deployFailed" && (
              <Field>
                <FieldLabel htmlFor="rule-for">{t("For (seconds)")}</FieldLabel>
                <Input
                  id="rule-for"
                  type="number"
                  min={0}
                  value={forSec}
                  placeholder={String(DEFAULTS[metric][1])}
                  onChange={(e) => setForSec(e.target.value)}
                />
              </Field>
            )}
          </div>
          <FieldDescription>
            {metric === "room"
              ? t(
                  "Memory left for more apps after headroom and what's reserved or used."
                )
              : kind === "project" && metric !== "deployFailed"
                ? t(
                    "Per replica, as a percent of its limit (else its reservation)."
                  )
                : metric === "agentOffline"
                  ? t("A server back within this grace period never alerts.")
                  : metric === "deployFailed"
                    ? t("Resolves when a later deploy succeeds.")
                    : null}
          </FieldDescription>

          <FieldSet>
            <FieldLegend variant="label">{t("Send to")}</FieldLegend>
            <FieldDescription>
              {t(
                "Email goes to tenant members only. Webhook and Slack URLs are stored encrypted and shown masked."
              )}
            </FieldDescription>
            {channels.map((c, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-32 shrink-0">
                  <Choice
                    value={c.type}
                    onChange={(type) =>
                      setChannels((list) =>
                        list.map((x, j) => (j === i ? { type, target: "" } : x))
                      )
                    }
                    options={[
                      { value: "email", label: t("Email") },
                      { value: "slack", label: "Slack" },
                      { value: "webhook", label: t("Webhook") },
                    ]}
                  />
                </div>
                <Input
                  aria-label={t("Channel {{n}} target", { n: i + 1 })}
                  value={c.target}
                  required
                  type={c.type === "email" ? "email" : "url"}
                  placeholder={
                    c.type === "email"
                      ? "you@example.com"
                      : c.type === "slack"
                        ? "https://hooks.slack.com/services/…"
                        : "https://example.com/hooks/alerts"
                  }
                  onChange={(e) =>
                    setChannels((list) =>
                      list.map((x, j) =>
                        j === i ? { ...x, target: e.target.value } : x
                      )
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("Remove channel {{n}}", { n: i + 1 })}
                  disabled={channels.length === 1}
                  onClick={() =>
                    setChannels((list) => list.filter((_, j) => j !== i))
                  }
                >
                  <IconX />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              disabled={channels.length >= 10}
              onClick={() =>
                setChannels((list) => [...list, { type: "email", target: "" }])
              }
            >
              <IconPlus data-icon="inline-start" />
              {t("Add a channel")}
            </Button>
          </FieldSet>

          <Field orientation="horizontal">
            <Switch
              id="rule-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <FieldLabel htmlFor="rule-enabled">{t("Enabled")}</FieldLabel>
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {t("Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Monitoring → Alert rules (PLAN §13). */
export default function AlertRules() {
  const { t } = useTranslation()
  const request = ThunderSDK.useCaching(
    ["alertRules"],
    async ({ signal }) => await ThunderSDK.alertRules.list({ signal })
  )
  const { data } = use(request)
  const [editing, setEditing] = React.useState<TRule | null>(null)
  const [open, setOpen] = React.useState(false)
  const selection = useSelection()

  const edit = (rule: TRule | null) => {
    setEditing(rule)
    setOpen(true)
  }
  const remove = async (rule: TRule) => {
    if (!confirm(t("Delete the rule {{name}}?", { name: rule.name }))) return
    try {
      await ThunderSDK.alertRules.del({ params: { id: rule._id } })
      request.invalidate()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not delete it"))
    }
  }

  const [search, setSearch] = React.useState("")
  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? data?.filter((r) => r.name.toLowerCase().includes(q)) : data
  }, [data, search])

  const columns: TColumn<TRule>[] = [
    {
      id: "select",
      header: (
        <SelectAllCheckbox
          selection={selection}
          ids={(rows ?? []).map((r) => r._id)}
        />
      ),
      cell: (rule) => (
        <SelectCheckbox selection={selection} id={rule._id} label={rule.name} />
      ),
      className: "w-10",
    },
    {
      id: "name",
      header: t("Rule"),
      sortValue: (rule) => rule.name,
      cell: (rule) => <span className="font-medium">{rule.name}</span>,
    },
    {
      id: "condition",
      header: t("Condition"),
      sortValue: (rule) => t(METRICS[rule.metric].label),
      cell: (rule) => {
        const meta = METRICS[rule.metric]
        return (
          <div className="min-w-0">
            <div className="tabular-nums">
              {t(meta.label)}
              {meta.unit &&
                ` ${rule.metric === "room" ? "<" : ">"} ${rule.threshold}${meta.unit === "%" ? "%" : " MiB"}`}
              {rule.forSec > 0 && ` · ${t("{{n}} s", { n: rule.forSec })}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {rule.target.ref
                ? rule.target.kind === "server"
                  ? t("One server")
                  : t("One project")
                : rule.target.kind === "server"
                  ? t("Every server")
                  : t("Every project")}
            </div>
          </div>
        )
      },
    },
    {
      id: "channels",
      header: t("Channels"),
      className: "max-w-72",
      cell: (rule) =>
        rule.channels.map((c, i) => (
          <div key={i} className="truncate text-xs" title={c.target}>
            <span className="text-muted-foreground">{c.type}:</span>{" "}
            <span dir="ltr" className="font-mono">
              {c.target}
            </span>
          </div>
        )),
    },
    {
      id: "status",
      header: t("Status"),
      sortValue: (rule) => (rule.enabled ? 0 : 1),
      cell: (rule) =>
        rule.enabled ? (
          <StatusBadge tone="success" label={t("Enabled")} />
        ) : (
          <StatusBadge tone="neutral" label={t("Disabled")} />
        ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("Actions")}</span>,
      align: "end",
      className: "whitespace-nowrap",
      cell: (rule) => (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("Edit {{name}}", { name: rule.name })}
            onClick={() => edit(rule)}
          >
            <IconPencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("Delete {{name}}", { name: rule.name })}
            onClick={() => remove(rule)}
          >
            <IconTrash />
          </Button>
        </>
      ),
    },
  ]

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Alert rules")}
        description={t(
          "Get told by email, Slack or a webhook when a server or project needs attention."
        )}
        actions={
          <Button size="sm" onClick={() => edit(null)}>
            <IconPlus data-icon="inline-start" />
            {t("New rule")}
          </Button>
        }
      />

      {data && !data.length ? (
        <EmptyState
          icon={IconBell}
          title={t("No alert rules yet")}
          description={t(
            "Start with a server offline rule and a failed deploy rule."
          )}
          action={
            <Button size="sm" onClick={() => edit(null)}>
              {t("New rule")}
            </Button>
          }
        />
      ) : (
        <>
          <Toolbar search={search} onSearch={setSearch} />
          <div className="overflow-x-auto">
            <DataTable
              label={t("Alert rules")}
              columns={columns}
              rows={rows}
              rowId={(rule) => rule._id}
              isSelected={(rule) => selection.has(rule._id)}
              loading={!data}
            />
          </div>
        </>
      )}

      <SelectionBar
        selection={selection}
        remove={(id) => ThunderSDK.alertRules.del({ params: { id } })}
        onDone={() => request.invalidate()}
        canDelete={ThunderSDK.isPermitted("alertRules", "del")}
      />

      <RuleDialog
        rule={editing}
        open={open}
        onOpenChange={setOpen}
        onSaved={() => request.invalidate()}
      />
    </Page>
  )
}
