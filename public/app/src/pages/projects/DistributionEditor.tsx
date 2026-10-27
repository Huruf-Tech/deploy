import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import { getLocalPath } from "@/core/lib/utils"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

export type TDistribution = {
  distribution: "auto" | "perServer" | "registry"
  /** A connected registry; the tenant's default when absent. */
  registry?: string
}

const DEFAULT = "default"

/** How a built image reaches the project's servers (PLAN §8.4). */
export function DistributionEditor({
  value,
  onChange,
  note,
}: {
  value: TDistribution
  onChange: (value: TDistribution) => void
  /** Shown under the explanation, e.g. when a change applies. */
  note?: string
}) {
  const { t } = useTranslation()
  const cached = useCached(queries.registries()).data
  const registries = Array.isArray(cached) ? cached : []
  const fallback = registries.find((r) => r.isDefault)

  const modes = [
    {
      value: "auto",
      label: t("Automatic"),
      help: t(
        "Builds once and pushes to your default registry if one is connected; otherwise, for several servers, to the built-in registry over the private network; otherwise it builds on each server."
      ),
    },
    {
      value: "perServer",
      label: t("Build on each server"),
      help: t("Every server builds the image itself. No registry is used."),
    },
    {
      value: "registry",
      label: t("Push to a registry"),
      help: t(
        "Builds once and pushes to a connected registry. Deploys fail if none is connected."
      ),
    },
  ] as const
  const mode = modes.find((m) => m.value === value.distribution) ?? modes[0]
  const registryItems = [
    ...(fallback
      ? [
          {
            value: DEFAULT,
            label: t("The default ({{name}})", { name: fallback.name }),
          },
        ]
      : []),
    ...registries.map((r) => ({ value: r._id, label: r.name })),
  ]

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="distribution">
          {t("Image distribution")}
        </FieldLabel>
        <Select
          items={modes.map((m) => ({ value: m.value, label: m.label }))}
          value={mode.value}
          onValueChange={(v) =>
            onChange({
              distribution: v as TDistribution["distribution"],
              // No default to fall back on: start from the first registry.
              registry:
                v === "registry" && !fallback ? registries[0]?._id : undefined,
            })
          }
        >
          <SelectTrigger id="distribution" className="w-full sm:max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modes.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          {mode.help}
          {note && ` ${note}`}
        </FieldDescription>
      </Field>

      {mode.value === "registry" &&
        (registries.length ? (
          <Field>
            <FieldLabel htmlFor="distribution-registry">
              {t("Registry")}
            </FieldLabel>
            <Select
              items={registryItems}
              value={value.registry ?? (fallback ? DEFAULT : null)}
              onValueChange={(v) =>
                onChange({
                  distribution: "registry",
                  registry: v && v !== DEFAULT ? String(v) : undefined,
                })
              }
            >
              <SelectTrigger
                id="distribution-registry"
                className="w-full sm:max-w-xs"
              >
                <SelectValue placeholder={t("Pick a registry")} />
              </SelectTrigger>
              <SelectContent>
                {registryItems.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : (
          <p className="text-[13px] text-warning-foreground">
            {t("No registry is connected, so deploys would fail.")}{" "}
            <Link
              to={getLocalPath("infrastructure/registries")}
              className="font-medium text-brand-text underline"
            >
              {t("Connect a registry")}
            </Link>
          </p>
        ))}
    </div>
  )
}
