import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconPencil, IconPlus, IconTrash, IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DataTable, type TColumn } from "@/components/console/data-table"
import { Panel } from "@/components/console/panel"
import { StatusBadge } from "@/components/console/status"
import { Timeline } from "@/components/console/timeline"
import { errorMessage } from "@/lib/utils"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"
import { ago } from "@/lib/format"

type TMetric =
  "cpCpu" | "cpMemory" | "cpPollLatency" | "cpErrorRate" | "cpPollsMissing"
type TChannel = { type: "email" | "slack" | "webhook"; target: string }
type TRule = {
  _id: string
  name: string
  metric: TMetric
  threshold: number
  forSec: number
  channels: TChannel[]
  enabled: boolean
}
type TEvent = {
  _id: string
  ruleName: string
  metric: TMetric
  instance?: string
  value?: number
  open: boolean
  firedAt: string
  resolvedAt?: string
  delivery: { status: "pending" | "sent" | "failed"; error?: string }
}

/** Same defaults as lib/monitoring/rules.ts. */
const METRICS: Record<
  TMetric,
  {
    label: string
    unit: string
    threshold: number
    minutes: number
    below?: boolean
  }
> = {
  cpCpu: {
    label: "CPU of an instance",
    unit: "% of a core",
    threshold: 80,
    minutes: 5,
  },
  cpMemory: {
    label: "Host memory in use",
    unit: "%",
    threshold: 90,
    minutes: 5,
  },
  cpPollLatency: {
    label: "Agent poll time, p95",
    unit: "ms",
    threshold: 100,
    minutes: 5,
  },
  cpErrorRate: {
    label: "Server errors",
    unit: "% of requests",
    threshold: 2,
    minutes: 5,
  },
  cpPollsMissing: {
    label: "Agent polls arriving",
    unit: "% of expected",
    threshold: 50,
    minutes: 3,
    below: true,
  },
}

const can = (handler: string) => ThunderSDK.isPermitted("controlPlane", handler)

function RuleDialog({
  rule,
  open,
  onOpenChange,
  onSaved,
}: {
  rule?: TRule
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [metric, setMetric] = React.useState<TMetric>(rule?.metric ?? "cpCpu")
  const [name, setName] = React.useState(rule?.name ?? "")
  const [threshold, setThreshold] = React.useState(
    String(rule?.threshold ?? METRICS.cpCpu.threshold)
  )
  const [minutes, setMinutes] = React.useState(
    String(rule ? rule.forSec / 60 : METRICS.cpCpu.minutes)
  )
  const [channels, setChannels] = React.useState<TChannel[]>(
    rule?.channels ?? [{ type: "email", target: "" }]
  )
  const [busy, setBusy] = React.useState(false)
  const meta = METRICS[metric]

  const pick = (next: TMetric) => {
    setMetric(next)
    if (!rule) {
      setThreshold(String(METRICS[next].threshold))
      setMinutes(String(METRICS[next].minutes))
    }
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    const body = {
      name: name.trim() || t(meta.label),
      target: { kind: "controlPlane" as const },
      metric,
      threshold: Number(threshold),
      forSec: Math.round(Number(minutes) * 60),
      channels: channels.filter((c) => c.target.trim()),
      enabled: rule?.enabled ?? true,
    }
    try {
      if (rule)
        await ThunderSDK.controlPlane.updateRuleHandler({
          params: { id: rule._id },
          body,
        })
      else await ThunderSDK.controlPlane.createRuleHandler({ body })
      toast.success(rule ? t("Rule saved") : t("Rule created"))
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save the rule"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={save} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {rule ? t("Edit alert rule") : t("New alert rule")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cp-metric">{t("Watch")}</Label>
            <Select
              items={Object.entries(METRICS).map(([value, m]) => ({
                value,
                label: t(m.label),
              }))}
              value={metric}
              onValueChange={(v) => pick(v as TMetric)}
            >
              <SelectTrigger id="cp-metric" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METRICS).map(([value, m]) => (
                  <SelectItem key={value} value={value}>
                    {t(m.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cp-threshold">
                {meta.below ? t("Fires below") : t("Fires above")} (
                {t(meta.unit)})
              </Label>
              <Input
                id="cp-threshold"
                type="number"
                min={0}
                step="any"
                required
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cp-minutes">{t("For (minutes)")}</Label>
              <Input
                id="cp-minutes"
                type="number"
                min={1}
                max={1440}
                required
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cp-name">{t("Name")}</Label>
            <Input
              id="cp-name"
              maxLength={80}
              placeholder={t(meta.label)}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("Notify")}</Label>
            {channels.map((c, i) => (
              <div key={i} className="flex gap-2">
                <Select
                  items={[
                    { value: "email", label: t("Email") },
                    { value: "slack", label: "Slack" },
                    { value: "webhook", label: t("Webhook") },
                  ]}
                  value={c.type}
                  onValueChange={(v) =>
                    setChannels(
                      channels.map((x, j) =>
                        j === i ? { ...x, type: v as TChannel["type"] } : x
                      )
                    )
                  }
                >
                  <SelectTrigger className="w-32 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">{t("Email")}</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="webhook">{t("Webhook")}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  aria-label={t("Address or URL")}
                  required={i === 0}
                  placeholder={
                    c.type === "email" ? "admin@example.com" : "https://…"
                  }
                  value={c.target}
                  onChange={(e) =>
                    setChannels(
                      channels.map((x, j) =>
                        j === i ? { ...x, target: e.target.value } : x
                      )
                    )
                  }
                />
                {channels.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("Remove")}
                    onClick={() =>
                      setChannels(channels.filter((_, j) => j !== i))
                    }
                  >
                    <IconX />
                  </Button>
                )}
              </div>
            ))}
            {channels.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() =>
                  setChannels([...channels, { type: "email", target: "" }])
                }
              >
                <IconPlus data-icon="inline-start" /> {t("Add a channel")}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {t("Emails go to platform admins only.")}
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {rule ? t("Save") : t("Create rule")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Alerts on the control plane itself (CPU, memory, poll time, errors, polls
 * missing), delivered through the same channels as tenant alerts.
 */
export function ControlPlaneRules() {
  const { t } = useTranslation()
  const [editing, setEditing] = React.useState<TRule | null | undefined>()
  const rules = useCached(queries.controlPlaneRules())
  const events = useCached(queries.controlPlaneAlerts())
  const list = rules.data as unknown as TRule[] | null
  const recent = events.data as unknown as TEvent[] | null

  const reload = () => {
    rules.reload()
    events.reload()
  }

  const toggle = async (rule: TRule) => {
    try {
      await ThunderSDK.controlPlane.updateRuleHandler({
        params: { id: rule._id },
        body: {
          name: rule.name,
          target: { kind: "controlPlane" },
          metric: rule.metric,
          threshold: rule.threshold,
          forSec: rule.forSec,
          channels: rule.channels,
          enabled: !rule.enabled,
        },
      })
      reload()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save the rule"))
    }
  }

  const remove = async (rule: TRule) => {
    if (!confirm(t("Delete the rule {{name}}?", { name: rule.name }))) return
    try {
      await ThunderSDK.controlPlane.deleteRuleHandler({
        params: { id: rule._id },
      })
      reload()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not delete the rule"))
    }
  }

  const columns: TColumn<TRule>[] = [
    {
      id: "name",
      header: t("Rule"),
      sortValue: (rule) => rule.name,
      cell: (rule) => <span className="font-medium">{rule.name}</span>,
    },
    {
      id: "condition",
      header: t("Condition"),
      cell: (rule) => {
        const meta = METRICS[rule.metric]
        return (
          <span className="tabular-nums">
            {t(meta.label)} {meta.below ? "<" : ">"} {rule.threshold}{" "}
            {t(meta.unit)} · {t("for {{n}} min", { n: rule.forSec / 60 })}
          </span>
        )
      },
    },
    {
      id: "channels",
      header: t("Channels"),
      className: "max-w-64",
      cell: (rule) => (
        <span
          dir="ltr"
          className="block truncate font-mono text-xs"
          title={rule.channels.map((c) => c.target).join(", ")}
        >
          {rule.channels.map((c) => c.target).join(", ")}
        </span>
      ),
    },
    {
      id: "status",
      header: t("Status"),
      sortValue: (rule) => (rule.enabled ? 0 : 1),
      cell: (rule) => (
        <span className="flex items-center gap-2">
          {can("updateRuleHandler") && (
            <Switch
              aria-label={t("Enabled")}
              checked={rule.enabled}
              onCheckedChange={() => toggle(rule)}
            />
          )}
          {rule.enabled ? (
            <StatusBadge tone="success" label={t("Enabled")} />
          ) : (
            <StatusBadge tone="neutral" label={t("Disabled")} />
          )}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("Actions")}</span>,
      align: "end",
      className: "whitespace-nowrap",
      cell: (rule) => (
        <>
          {can("updateRuleHandler") && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("Edit {{name}}", { name: rule.name })}
              onClick={() => setEditing(rule)}
            >
              <IconPencil />
            </Button>
          )}
          {can("deleteRuleHandler") && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("Delete {{name}}", { name: rule.name })}
              onClick={() => remove(rule)}
            >
              <IconTrash />
            </Button>
          )}
        </>
      ),
    },
  ]

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{t("Alert rules")}</h2>
          <p className="text-xs text-muted-foreground">
            {t(
              "Checked by each instance once a minute; a rule fires when every minute of its window breaches."
            )}
          </p>
        </div>
        {can("createRuleHandler") && (
          <Button size="sm" onClick={() => setEditing(null)}>
            <IconPlus data-icon="inline-start" /> {t("Add rule")}
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <DataTable
          label={t("Alert rules")}
          columns={columns}
          rows={list}
          rowId={(rule) => rule._id}
          loading={!list}
          empty={t(
            "No rules yet. Start with CPU of an instance above 80% and agent polls arriving below 50%."
          )}
        />
      </div>

      {can("alerts") && !!recent?.length && (
        <Panel title={t("Recent alerts")} className="mt-2">
          <Timeline
            items={recent.map((e) => ({
              id: e._id,
              tone: e.open ? "danger" : "success",
              label: (
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">
                    {e.ruleName}
                    {e.value !== undefined && ` · ${e.value}`}
                  </span>
                  {e.open ? (
                    <StatusBadge tone="danger" label={t("Open")} />
                  ) : (
                    <StatusBadge state="resolved" label={t("Resolved")} />
                  )}
                </span>
              ),
              time: ago(e.firedAt),
              details: (
                <>
                  {e.instance === "all" ? t("All instances") : e.instance}
                  {e.delivery.status === "failed" &&
                    ` · ${t("not delivered")}: ${e.delivery.error ?? ""}`}
                </>
              ),
            }))}
          />
        </Panel>
      )}
      {editing !== undefined && (
        <RuleDialog
          rule={editing ?? undefined}
          open
          onOpenChange={(open) => !open && setEditing(undefined)}
          onSaved={reload}
        />
      )}
    </section>
  )
}
