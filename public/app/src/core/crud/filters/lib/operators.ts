import type { TField } from "@/core/lib/jsonSchemaToFields"
import type { TValue } from ".."

export const RangeOperator = {
  "is between": "$bt",
  "is not between": "$nbt",
} as const

export const StringOperator = {
  contains: "$regex",
  "does not contain": "$nregex",
  is: "$eq",
  "is not": "$ne",
} as const

//! The operators are inclusive, so the labels say so. Renaming the labels keeps
//! every stored filter working; swapping the operators to $gt/$lt would silently
//! change the meaning of filters already saved in URLs.
export const NumberOperator = {
  is: "$eq",
  "is not": "$ne",
  "is at least": "$gte",
  "is at most": "$lte",
} as const

export const BooleanOperator = {
  is: "$eq",
  "is not": "$ne",
} as const

export const MultiOptionOperator = {
  all: "$all",
  includes: "$in",
  excludes: "$nin",
} as const

export const DateOperator = {
  is: "$eq",
  "is not": "$ne",
  "is on or after": "$gte",
  "is on or before": "$lte",
} as const

export function getDefaultOperator(field: TField, filter?: TValue) {
  if (field.enum) return MultiOptionOperator.all

  if (field.type === "boolean") return BooleanOperator.is

  if (field.type === "number")
    return Object.values(RangeOperator).includes(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (filter?.operator ?? "") as any
    )
      ? RangeOperator["is between"]
      : NumberOperator.is

  if (field.type === "date")
    return Object.values(RangeOperator).includes(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (filter?.operator ?? "") as any
    )
      ? RangeOperator["is between"]
      : DateOperator.is

  return StringOperator.contains
}

export function getOperator(field: TField, filter?: TValue) {
  if (field.enum) return MultiOptionOperator

  if (field.type === "boolean") return BooleanOperator

  if (field.type === "number")
    return Object.values(RangeOperator).includes(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (filter?.operator ?? "") as any
    )
      ? RangeOperator
      : NumberOperator

  if (field.type === "date")
    return Object.values(RangeOperator).includes(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (filter?.operator ?? "") as any
    )
      ? RangeOperator
      : DateOperator

  return StringOperator
}
