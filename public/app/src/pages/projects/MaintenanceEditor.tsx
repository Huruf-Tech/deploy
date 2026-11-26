import * as React from "react"
import { useTranslation } from "react-i18next"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Field,
  FieldDescription,
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
import { Panel } from "@/components/console/panel"
import { StatusBadge, type TTone } from "@/components/console/status"
import { ago } from "@/lib/format"

/** Restart the project's containers on a schedule (PLAN §10.1). */
export type TRestartSchedule = {
  cron: string
  timezone: string
  /** Only these of its servers; all when empty. */
  servers: string[]
}

type TRestartResult = {
  server: string
  at: string
  status: "ok" | "failed" | "skipped"
  message?: string
}

type TMode = "daily" | "weekly" | "custom"

const DAILY = /^(\d{1,2}) (\d{1,2}) \* \* \*$/
const WEEKLY = /^(\d{1,2}) (\d{1,2}) \* \* ([0-7])$/

const modeOf = (cron: string): TMode =>
  DAILY.test(cron) ? "daily" : WEEKLY.test(cron) ? "weekly" : "custom"

const pad = (n: number) => String(n).padStart(2, "0")

/** The time and weekday of a daily or weekly expression. */
function partsOf(cron: string) {
  const m = cron.match(WEEKLY) ?? cron.match(DAILY)
  return {
    time: m ? `${pad(Number(m[2]))}:${pad(Number(m[1]))}` : "03:00",
    day: m?.[3] ? Number(m[3]) % 7 : 0,
  }
}

const cronOf = (mode: TMode, time: string, day: number) => {
  const [h, m] = time.split(":").map(Number)
  return `${m || 0} ${h || 0} * * ${mode === "weekly" ? day : "*"}`
}

const browserZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

const ZONES = ["UTC", ...Intl.supportedValuesOf("timeZone")]

const TONE: Record<TRestartResult["status"], TTone> = {
  ok: "success",
  failed: "danger",
  skipped: "neutral",
}

export function MaintenanceEditor({
  value,
  onChange,
  servers,
  results,
}: {
  value: TRestartSchedule | null
  onChange: (value: TRestartSchedule | null) => void
  servers: { _id: string; name: string }[]
  results?: TRestartResult[]
}) {
  const { t, i18n } = useTranslation()
  const [mode, setMode] = React.useState<TMode>(
    value ? modeOf(value.cron) : "daily"
  )
  const { time, day } = partsOf(value?.cron ?? "")
  const weekday = (d: number) =>
    // 2026-11-29 is a Sunday.
    new Intl.DateTimeFormat(i18n.language, { weekday: "long" }).format(
      new Date(2026, 10, 29 + d)
    )
  const set = (patch: Partial<TRestartSchedule>) =>
    value && onChange({ ...value, ...patch })
  const chosen = value?.servers.length
    ? value.servers
    : servers.map((s) => s._id)
  const nameOf = (id: string) =>
    servers.find((s) => s._id === id)?.name ?? t("Removed server")

  return (
    <Panel
      title={t("Maintenance")}
      actions={
        <Switch
          id="s-restart"
          aria-label={t("Restart on a schedule")}
          checked={!!value}
          onCheckedChange={(on) => {
            setMode("daily")
            onChange(
              on
                ? { cron: "0 3 * * *", timezone: browserZone(), servers: [] }
                : null
            )
          }}
        />
      }
      bodyClassName="flex flex-col gap-4"
    >
      <FieldDescription>
        {t(
          "Restart on a schedule, e.g. every night for an app that slowly leaks memory. Each server's agent recreates the containers one replica at a time, each healthy before the next, from the same image and variables: nothing is built. Skipped while a deploy runs. Needs the latest agent on each server."
        )}
      </FieldDescription>

      {value && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel>{t("Repeat")}</FieldLabel>
              <Select
                items={[
                  { value: "daily", label: t("Every day") },
                  { value: "weekly", label: t("Every week") },
                  { value: "custom", label: t("Cron expression") },
                ]}
                value={mode}
                onValueChange={(v) => {
                  const next = v as TMode
                  setMode(next)
                  if (next !== "custom") set({ cron: cronOf(next, time, day) })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t("Every day")}</SelectItem>
                  <SelectItem value="weekly">{t("Every week")}</SelectItem>
                  <SelectItem value="custom">{t("Cron expression")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {mode === "weekly" && (
              <Field>
                <FieldLabel>{t("On")}</FieldLabel>
                <Select
                  items={[0, 1, 2, 3, 4, 5, 6].map((d) => ({
                    value: String(d),
                    label: weekday(d),
                  }))}
                  value={String(day)}
                  onValueChange={(v) =>
                    set({ cron: cronOf("weekly", time, Number(v)) })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {weekday(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {mode === "custom" ? (
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="s-restart-cron">
                  {t("Cron expression")}
                </FieldLabel>
                <Input
                  id="s-restart-cron"
                  dir="ltr"
                  className="font-mono"
                  value={value.cron}
                  onChange={(e) => set({ cron: e.target.value })}
                  placeholder="0 3 * * *"
                />
                <FieldDescription>
                  {t(
                    "minute hour day month weekday, e.g. 0 */6 * * * for every 6 hours, or @daily."
                  )}
                </FieldDescription>
              </Field>
            ) : (
              <Field>
                <FieldLabel htmlFor="s-restart-time">{t("At")}</FieldLabel>
                <Input
                  id="s-restart-time"
                  type="time"
                  dir="ltr"
                  value={time}
                  onChange={(e) =>
                    e.target.value &&
                    set({ cron: cronOf(mode, e.target.value, day) })
                  }
                />
              </Field>
            )}
          </div>

          <Field>
            <FieldLabel htmlFor="s-restart-zone">{t("Time zone")}</FieldLabel>
            <Combobox
              items={ZONES}
              value={value.timezone}
              onValueChange={(zone: string | null) =>
                zone && set({ timezone: zone })
              }
            >
              <ComboboxInput
                id="s-restart-zone"
                dir="ltr"
                className="w-full sm:max-w-sm"
                placeholder="UTC"
              />
              <ComboboxContent>
                <ComboboxEmpty>{t("No time zone found.")}</ComboboxEmpty>
                <ComboboxList>
                  {(zone: string) => (
                    <ComboboxItem key={zone} value={zone}>
                      {zone}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>

          {servers.length > 1 && (
            <FieldSet>
              <FieldLegend variant="label">{t("On servers")}</FieldLegend>
              <div className="flex flex-col divide-y rounded-lg border">
                {servers.map((s) => {
                  const on = chosen.includes(s._id)
                  return (
                    <label
                      key={s._id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 text-[13px] first:rounded-t-lg last:rounded-b-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={on}
                        // At least one: none would read as all of them.
                        disabled={on && chosen.length === 1}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...chosen, s._id]
                            : chosen.filter((id) => id !== s._id)
                          set({
                            servers: next.length === servers.length ? [] : next,
                          })
                        }}
                      />
                      {s.name}
                    </label>
                  )
                })}
              </div>
              <FieldDescription>
                {t(
                  "Each server restarts on its own, so the project keeps serving from the others."
                )}
              </FieldDescription>
            </FieldSet>
          )}
        </>
      )}

      {!!results?.length && (
        <FieldSet>
          <FieldLegend variant="label">{t("Last restarts")}</FieldLegend>
          <div className="flex flex-col divide-y rounded-lg border">
            {results.map((r) => (
              <div
                key={r.server}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[13px]"
              >
                <span className="font-medium">{nameOf(r.server)}</span>
                <StatusBadge
                  tone={TONE[r.status]}
                  label={
                    r.status === "ok"
                      ? t("Restarted")
                      : r.status === "failed"
                        ? t("Failed")
                        : t("Skipped")
                  }
                />
                <span className="text-xs text-muted-foreground">
                  {ago(r.at)}
                </span>
                {r.message && (
                  <span className="w-full text-xs break-words text-muted-foreground">
                    {r.message}
                  </span>
                )}
              </div>
            ))}
          </div>
        </FieldSet>
      )}
    </Panel>
  )
}
