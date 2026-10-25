import * as React from "react"
import type z from "zod"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"

import type { TCardProps } from "@/core/types"
import { Container } from "@/core/custom/Container"
import { zodToMongoProjection } from "@/core/lib/zodToMongoProjection"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/console/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type TRecordCard = {
  title: React.ReactNode
  /** Plain text for the detail page's breadcrumb. */
  name: string
  description?: React.ReactNode
  badges?: React.ReactNode
  body?: React.ReactNode
}

/** A small rounded label for lists inside a card. */
export function Chip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  )
}

/**
 * The card view of a CRUD module (thunder-ui card override): fetches with
 * the schema's projection, skips records that don't parse, and opens a
 * record's page on click. Selection feeds the core action bar.
 */
export function RecordCards<T extends { _id: string }>({
  schema,
  render,
  emptyTitle,
  data,
  isLoading,
  fetcher,
  selectedIds = [],
  toggleSelect,
  opens = "form",
}: TCardProps & {
  schema: z.ZodType<T>
  render: (record: T) => TRecordCard
  emptyTitle: string
  /** Where a card leads: the module's form, or its detail view (a views override). */
  opens?: "form" | "detail"
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Card mode doesn't fetch on its own (block body: not a cleanup).
  React.useEffect(() => {
    fetcher(zodToMongoProjection(schema as z.ZodObject))
  }, [fetcher, schema])

  const records = React.useMemo(
    () =>
      (Array.isArray(data) ? data : []).flatMap((item) => {
        const parsed = schema.safeParse(item)
        return parsed.success ? [parsed.data] : []
      }),
    [data, schema]
  )

  return (
    <Container className="py-4">
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[10px]" />
          ))}
        </div>
      ) : !records.length ? (
        <EmptyState title={emptyTitle} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {records.map((record) => {
            const card = render(record)
            // Straight to the form, as core's list rows do: core's `<id>`
            // redirect doubles the app's base path (`/app/app/…`).
            const open = () =>
              navigate(
                opens === "detail" ? `./${record._id}` : `./form/${record._id}`,
                { state: { name: card.name } }
              )
            return (
              <li key={record._id}>
                {/* The title's button stretches over the card, so the
                    checkbox stays a sibling, not nested in a control. */}
                <div
                  className={cn(
                    "relative flex h-full flex-col gap-3 rounded-[10px] border bg-card p-4 transition-colors hover:bg-accent/50 has-[[data-open]:focus-visible]:ring-2 has-[[data-open]:focus-visible]:ring-ring",
                    selectedIds.includes(record._id) &&
                      "border-primary ring-1 ring-primary"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold">
                        <button
                          type="button"
                          data-open
                          onClick={open}
                          aria-label={t("Open {{name}}", { name: card.name })}
                          className="min-w-0 text-start after:absolute after:inset-0 after:rounded-[10px] focus-visible:outline-none"
                        >
                          {card.title}
                        </button>
                        {card.badges}
                      </h3>
                      {card.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {card.description}
                        </p>
                      )}
                    </div>
                    <Checkbox
                      aria-label={t("Select {{name}}", { name: card.name })}
                      checked={selectedIds.includes(record._id)}
                      onCheckedChange={() => toggleSelect(record._id)}
                      className="relative z-10"
                    />
                  </div>
                  {card.body && <div className="text-[13px]">{card.body}</div>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Container>
  )
}
