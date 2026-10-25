import * as React from "react"
import type z from "zod"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"

import type { TCardProps } from "@/core/types"
import { Container } from "@/core/custom/Container"
import { zodToMongoProjection } from "@/core/lib/zodToMongoProjection"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-4xl" />
          ))}
        </div>
      ) : !records.length ? (
        <Empty className="min-h-[40vh]">
          <EmptyHeader>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                <Card
                  role="link"
                  tabIndex={0}
                  aria-label={t("Open {{name}}", { name: card.name })}
                  onClick={open}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") open()
                  }}
                  className={cn(
                    "h-full cursor-pointer transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    selectedIds.includes(record._id) && "ring-2 ring-primary"
                  )}
                >
                  <CardHeader>
                    <CardTitle className="flex min-w-0 flex-wrap items-center gap-2">
                      {card.title}
                      {card.badges}
                    </CardTitle>
                    {card.description && (
                      <CardDescription>{card.description}</CardDescription>
                    )}
                    <CardAction>
                      <Checkbox
                        aria-label={t("Select {{name}}", { name: card.name })}
                        checked={selectedIds.includes(record._id)}
                        onCheckedChange={() => toggleSelect(record._id)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </CardAction>
                  </CardHeader>
                  {card.body && <CardContent>{card.body}</CardContent>}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </Container>
  )
}
