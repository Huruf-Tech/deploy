/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { IconChevronDown, IconSelector, IconX } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import type { TField } from "@/core/lib/jsonSchemaToFields"
import { valueWithType } from "@/core/crud/filters/lib/filterToMongo"
import { useDebounceCallback } from "@/core/crud/filters/hooks/use-debounce-callback"

export type TRefOption = { label: string; value: unknown }

/** Page size for one request to the referenced module. */
const PAGE_SIZE = 25

/** Fields consulted for a record's display label, in priority order. */
export function refLabelFields(field: TField): string[] {
  if (field.refLabel instanceof Array) return field.refLabel

  return [field.refLabel, "label", "name", "title"].filter(Boolean) as string[]
}

export function refValueKey(field: TField) {
  return field.refValue ?? "_id"
}

function toOption(field: TField, record: any): TRefOption {
  const labels = refLabelFields(field)
  const value = record[refValueKey(field)]

  const label = (field.refLabel instanceof Array ? labels : labels)
    .map((key) => record[key])
    .filter(Boolean)
    .join(" ")
    .trim()

  return { label: label || String(value ?? ""), value }
}

function buildProjection(field: TField) {
  return Object.fromEntries(
    [...refLabelFields(field), refValueKey(field)].map((key) => [key, 1])
  )
}

/**
 * Searches the referenced module server-side.
 *
 * The previous implementation (`JSONSchemaToFields.resolveRef`) fetched the
 * *entire* referenced collection up-front and stuffed it into `field.enum`, so a
 * `ref` to a large module downloaded every record before the form could render.
 *
 */
async function queryRef(
  field: TField,
  opts: { search?: string; offset: number; signal: AbortSignal }
) {
  const labels = refLabelFields(field)

  const search = opts.search?.trim()

  const subFilters = search
    ? {
        $or: labels.map((key) => ({
          [key]: {
            $regex: valueWithType("regex", search, { regexFlags: "i" }),
          },
        })),
      }
    : undefined

  const { results } = (await ThunderSDK.getModule(field.ref!).get({
    signal: opts.signal,
    query: {
      filters: field.refFilters,
      subFilters,
      project: buildProjection(field),
      limit: PAGE_SIZE,
      offset: opts.offset,
    },
  })) as { results: any[] }

  return (results ?? []).map((record) => toOption(field, record))
}

/** Resolves labels for values already stored on the record being edited. */
async function queryRefByValues(
  field: TField,
  values: unknown[],
  signal: AbortSignal
) {
  if (!values.length) return []

  const { results } = (await ThunderSDK.getModule(field.ref!).get({
    signal,
    query: {
      subFilters: {
        [refValueKey(field)]: {
          $in: values.map((value) => valueWithType("objectId", value)),
        },
      },
      project: buildProjection(field),
      limit: values.length,
    },
  })) as { results: any[] }

  return (results ?? []).map((record) => toOption(field, record))
}

export type TRefSelectProps = {
  id?: string
  field: TField
  value: unknown
  onValueChange: (value: unknown) => void
  multiple?: boolean
  disabled?: boolean
  className?: string
}

export function RefSelect({
  id,
  field,
  value,
  onValueChange,
  multiple,
  disabled,
  className,
}: TRefSelectProps) {
  const { t } = useTranslation()

  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [options, setOptions] = React.useState<TRefOption[]>([])
  const [isLoading, setLoading] = React.useState(false)
  const [isLoadingMore, setLoadingMore] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  /**
   * Labels for values the user has picked (or that arrived on the record) are
   * kept here so the trigger keeps reading correctly once the list is filtered
   * or paged away from them.
   */
  const [labels, setLabels] = React.useState<Map<string, string>>(new Map())

  const controller = React.useRef<AbortController | null>(null)

  const selected = React.useMemo<unknown[]>(() => {
    if (value === undefined || value === null || value === "") return []

    return multiple ? (Array.isArray(value) ? value : [value]) : [value]
  }, [value, multiple])

  const rememberLabels = React.useCallback((next: TRefOption[]) => {
    setLabels((current) => {
      const merged = new Map(current)

      for (const option of next) merged.set(String(option.value), option.label)

      return merged
    })
  }, [])

  const load = React.useCallback(
    async (term: string, offset: number) => {
      if (!field.ref) return

      controller.current?.abort()

      const next = new AbortController()
      controller.current = next

      if (offset) setLoadingMore(true)
      else setLoading(true)
      setError(null)

      try {
        const page = await queryRef(field, {
          search: term,
          offset,
          signal: next.signal,
        })

        if (next.signal.aborted) return

        rememberLabels(page)
        setHasMore(page.length === PAGE_SIZE)
        setOptions((current) => (offset ? [...current, ...page] : page))
      } catch (err) {
        if (next.signal.aborted) return

        setError(err instanceof Error ? err : new Error(String(err)))
        if (!offset) setOptions([])
      } finally {
        if (!next.signal.aborted) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [field, rememberLabels]
  )

  const debouncedSearch = useDebounceCallback((term: string) => {
    void load(term, 0)
  }, 300)

  // First open fetches page one; later opens reuse what is already loaded.
  React.useEffect(() => {
    if (!open || options.length || isLoading) return

    void load(search, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Resolve labels for values that arrived with the record in edit mode.
  React.useEffect(() => {
    const unresolved = selected
      .map((entry) => String(entry))
      .filter((entry) => entry && !labels.has(entry))

    if (!unresolved.length || !field.ref) return

    const abort = new AbortController()

    void queryRefByValues(field, unresolved, abort.signal)
      .then(rememberLabels)
      .catch(() => {
        // Falls back to showing the raw id in the trigger.
      })

    return () => abort.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.join(","), field.ref])

  React.useEffect(() => () => controller.current?.abort(), [])

  const labelFor = React.useCallback(
    (entry: unknown) => labels.get(String(entry)) ?? String(entry ?? ""),
    [labels]
  )

  const toggle = (option: TRefOption) => {
    rememberLabels([option])

    if (!multiple) {
      onValueChange(option.value)
      setOpen(false)
      return
    }

    const current = selected.map(String)
    const key = String(option.value)

    onValueChange(
      current.includes(key)
        ? selected.filter((entry) => String(entry) !== key)
        : [...selected, option.value]
    )
  }

  const clear = (event: React.MouseEvent) => {
    event.stopPropagation()
    onValueChange(multiple ? [] : null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-auto min-h-9 w-full justify-between gap-2 py-1.5 font-normal",
              className
            )}
          >
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-start">
              {!selected.length ? (
                <span className="text-muted-foreground">{t("Select")}</span>
              ) : multiple ? (
                selected.map((entry) => (
                  <Badge key={String(entry)} variant="secondary">
                    {labelFor(entry)}
                  </Badge>
                ))
              ) : (
                <span className="truncate">{labelFor(selected[0])}</span>
              )}
            </span>

            <span className="flex shrink-0 items-center gap-1">
              {!!selected.length && !disabled && (
                <IconX
                  className="size-4 text-muted-foreground hover:text-foreground"
                  onClick={clear}
                  aria-label={t("Clear")}
                />
              )}
              {multiple ? (
                <IconSelector className="size-4 opacity-50" />
              ) : (
                <IconChevronDown className="size-4 opacity-50" />
              )}
            </span>
          </Button>
        }
      />

      <PopoverContent className="w-(--anchor-width) min-w-60 p-0" align="start">
        {/* Filtering happens on the server, so cmdk must not filter again. */}
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={(term) => {
              setSearch(term)
              debouncedSearch(term)
            }}
            placeholder={t("Type or search")}
          />

          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Spinner /> {t("Loading...")}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 py-6 text-sm">
                <span className="text-destructive">{error.message}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void load(search, 0)}
                >
                  {t("Retry")}
                </Button>
              </div>
            ) : (
              <React.Fragment>
                <CommandEmpty>{t("No items found.")}</CommandEmpty>

                {options.map((option) => (
                  <CommandItem
                    key={String(option.value)}
                    value={String(option.value)}
                    data-checked={selected.map(String).includes(
                      String(option.value)
                    )}
                    onSelect={() => toggle(option)}
                  >
                    {option.label}
                  </CommandItem>
                ))}

                {hasMore && (
                  <div className="p-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      disabled={isLoadingMore}
                      onClick={() => void load(search, options.length)}
                    >
                      {isLoadingMore && <Spinner />}
                      {t("Load more")}
                    </Button>
                  </div>
                )}
              </React.Fragment>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
