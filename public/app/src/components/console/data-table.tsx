import React from "react"
import { useTranslation } from "react-i18next"
import { IconArrowDown, IconArrowUp, IconSelector } from "@tabler/icons-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type TColumn<T> = {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  /** Makes the column sortable. */
  sortValue?: (row: T) => string | number | undefined
  align?: "start" | "end"
  className?: string
}

/**
 * The default list (DESIGN §5): real table markup, sticky header, 36 px rows,
 * client sorting, loading and empty states. Rows open with `onRowClick` (and
 * Enter when focused). Selection and row menus go in `columns`.
 */
export function DataTable<T>({
  label,
  columns,
  rows,
  rowId,
  loading,
  empty,
  onRowClick,
  className,
}: {
  /** Accessible name of the table. */
  label: string
  columns: TColumn<T>[]
  rows?: T[]
  rowId: (row: T) => string
  loading?: boolean
  empty?: React.ReactNode
  onRowClick?: (row: T) => void
  className?: string
}) {
  const { t } = useTranslation()
  const [sort, setSort] = React.useState<{ id: string; desc: boolean }>()

  const sorted = React.useMemo(() => {
    const col = columns.find((c) => c.id === sort?.id)
    if (!rows || !col?.sortValue) return rows
    const key = col.sortValue
    return [...rows].sort((a, b) => {
      const x = key(a) ?? ""
      const y = key(b) ?? ""
      const c =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), undefined, { numeric: true })
      return sort!.desc ? -c : c
    })
  }, [rows, columns, sort])

  const toggle = (id: string) =>
    setSort((s) =>
      s?.id !== id
        ? { id, desc: false }
        : s.desc
          ? undefined
          : { id, desc: true }
    )

  return (
    <div className={cn("min-w-0 rounded-[10px] border bg-card", className)}>
      <Table aria-label={label} className="text-[13px]">
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => {
              const active = sort?.id === col.id
              return (
                <TableHead
                  key={col.id}
                  aria-sort={
                    active
                      ? sort.desc
                        ? "descending"
                        : "ascending"
                      : undefined
                  }
                  className={cn(
                    "h-9 px-3 text-xs font-medium text-muted-foreground",
                    col.align === "end" && "text-end",
                    col.className
                  )}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggle(col.id)}
                      className="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {col.header}
                      {active ? (
                        sort.desc ? (
                          <IconArrowDown aria-hidden className="size-3" />
                        ) : (
                          <IconArrowUp aria-hidden className="size-3" />
                        )
                      ) : (
                        <IconSelector
                          aria-hidden
                          className="size-3 opacity-50"
                        />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && !rows ? (
            Array.from({ length: 3 }, (_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableCell key={col.id} className="h-9 px-3">
                    <Skeleton className="h-3.5 w-2/3" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : !sorted?.length ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="h-24 px-3 text-center text-muted-foreground"
              >
                {empty ?? t("Nothing here yet.")}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((row) => (
              <TableRow
                key={rowId(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick && (() => onRowClick(row))}
                onKeyDown={
                  onRowClick &&
                  ((e) => {
                    if (e.key === "Enter" && e.target === e.currentTarget)
                      onRowClick(row)
                  })
                }
                className={cn(
                  onRowClick &&
                    "cursor-pointer focus-visible:bg-muted focus-visible:outline-none"
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={cn(
                      "h-9 px-3 py-1.5",
                      col.align === "end" && "text-end tabular-nums",
                      col.className
                    )}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
