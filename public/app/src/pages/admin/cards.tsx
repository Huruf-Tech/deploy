import * as React from "react"
import z from "zod"
import { useTranslation } from "react-i18next"
import { IconEye, IconEyeOff } from "@tabler/icons-react"

import type { TCardProps } from "@/core/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Chip, RecordCards } from "@/components/record-cards"

/* Card views for the admin modules (thunder-ui card overrides). */

const planSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  visibility: z.enum(["public", "private"]),
  allowedTenants: z.array(z.string()).optional(),
  price: z.object({
    amount: z.number(),
    currency: z.string(),
    interval: z.enum(["month", "year"]),
  }),
  limits: z.object({
    servers: z.number(),
    projects: z.number(),
    members: z.number(),
  }),
  isFree: z.boolean().optional(),
  active: z.boolean(),
})

export function PlanCards(props: TCardProps) {
  const { t } = useTranslation()
  const money = (cents: number, currency: string) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100)

  return (
    <RecordCards
      {...props}
      schema={planSchema}
      emptyTitle={t("No plans yet")}
      render={(plan) => ({
        name: plan.name,
        title: plan.name,
        badges: (
          <>
            {plan.isFree && <Badge variant="secondary">{t("Default")}</Badge>}
            {plan.visibility === "private" && (
              <Badge variant="outline">
                {t("Private · {{count}} tenants", {
                  count: plan.allowedTenants?.length ?? 0,
                })}
              </Badge>
            )}
            {!plan.active && (
              <Badge variant="destructive">{t("Inactive")}</Badge>
            )}
          </>
        ),
        description: plan.description,
        body: (
          <div className="flex flex-col gap-3">
            <p className="text-2xl font-semibold tabular-nums">
              {plan.price.amount
                ? money(plan.price.amount, plan.price.currency)
                : t("Free")}
              {!!plan.price.amount && (
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {t(plan.price.interval)}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Chip>{t("{{n}} servers", { n: plan.limits.servers })}</Chip>
              <Chip>{t("{{n}} projects", { n: plan.limits.projects })}</Chip>
              <Chip>{t("{{n}} members", { n: plan.limits.members })}</Chip>
            </div>
          </div>
        ),
      })}
    />
  )
}

/** Shows a few items and how many more there are. */
function Chips({ items, max = 8 }: { items: string[]; max?: number }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.slice(0, max).map((item) => (
        <Chip key={item}>{item === "*" ? t("everything") : item}</Chip>
      ))}
      {items.length > max && (
        <Chip className="font-sans">
          {t("+{{n}} more", { n: items.length - max })}
        </Chip>
      )}
    </div>
  )
}

const roleSchema = z.object({
  _id: z.string(),
  role: z.string(),
  policies: z.array(z.string()),
  subRoles: z.array(z.string()).optional(),
  skipIntersection: z.boolean().optional(),
})

export function RoleCards(props: TCardProps) {
  const { t } = useTranslation()
  return (
    <RecordCards
      {...props}
      schema={roleSchema}
      emptyTitle={t("No roles yet")}
      opens="detail"
      render={(role) => ({
        name: role.role,
        title: <span className="font-mono">{role.role}</span>,
        badges: role.skipIntersection && (
          <Badge variant="outline">{t("Full grant to invitees")}</Badge>
        ),
        description:
          role.policies.length === 1
            ? t("1 policy attached")
            : t("{{count}} policies attached", {
                count: role.policies.length,
              }),
        body: !!role.subRoles?.length && (
          <p className="text-xs text-muted-foreground">
            {t("Can invite as: {{roles}}", {
              roles: role.subRoles.join(", "),
            })}
          </p>
        ),
      })}
    />
  )
}

const policySchema = z.object({
  _id: z.string(),
  name: z.string(),
  permissions: z.array(z.string()),
})

export function PolicyCards(props: TCardProps) {
  const { t } = useTranslation()
  return (
    <RecordCards
      {...props}
      schema={policySchema}
      emptyTitle={t("No policies yet")}
      render={(policy) => ({
        name: policy.name,
        title: <span className="font-mono">{policy.name}</span>,
        badges: policy.permissions.includes("*") && (
          <Badge variant="destructive">{t("Full access")}</Badge>
        ),
        description:
          policy.permissions.length === 1
            ? t("1 permission")
            : t("{{count}} permissions", { count: policy.permissions.length }),
        body: <Chips items={policy.permissions} max={10} />,
      })}
    />
  )
}

const envSchema = z.object({
  _id: z.string(),
  key: z.string(),
  value: z.string(),
})

/** Values may be secrets: hidden until asked for. */
function EnvValue({ value }: { value: string }) {
  const { t } = useTranslation()
  const [shown, setShown] = React.useState(false)
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1 text-xs">
        {shown ? value || t("(empty)") : "••••••••"}
      </code>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={shown ? t("Hide the value") : t("Show the value")}
        aria-pressed={shown}
        onClick={(e) => {
          e.stopPropagation()
          setShown((s) => !s)
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {shown ? <IconEyeOff /> : <IconEye />}
      </Button>
    </div>
  )
}

export function EnvCards(props: TCardProps) {
  const { t } = useTranslation()
  return (
    <RecordCards
      {...props}
      schema={envSchema}
      emptyTitle={t("No settings stored")}
      render={(env) => ({
        name: env.key,
        title: <span className="font-mono text-sm break-all">{env.key}</span>,
        body: <EnvValue value={env.value} />,
      })}
    />
  )
}
