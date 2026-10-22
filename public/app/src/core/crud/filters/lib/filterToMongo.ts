/* eslint-disable @typescript-eslint/no-explicit-any */
import { hash } from "ohash"
import type { TFilters } from "thunder-sdk/types"

export type TServerValueTypes =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "regex"
  | "objectId"
  | "milliseconds"

export type TFilterInput = Record<
  string,
  {
    value: any
    operator: string
  }
>

export const valueWithType = (
  type: TServerValueTypes,
  value: any,
  options?: {
    regexFlags?: string
  }
) => {
  return {
    type,
    value: `${value}`,
    options,
  }
}

const RANGE_OPERATORS = new Set(["$bt", "$nbt"])
const REGEX_OPERATORS = new Set(["$regex", "$nregex"])
const ARRAY_OPERATORS = new Set(["$in", "$nin", "$all"])

const normalizeValue = (value: any, operator: string) => {
  if (!Array.isArray(value)) return value

  /**
   * Keep arrays for real array/range operators.
   */
  if (RANGE_OPERATORS.has(operator) || ARRAY_OPERATORS.has(operator)) {
    return value
  }

  /**
   * For normal single-value operators like:
   * $eq, $ne, $gte, $lte
   *
   * Your filter UI may send:
   * { value: [18], operator: "$gte" }
   *
   * So we convert it to:
   * { value: 18, operator: "$gte" }
   */
  return value[0]
}

const inferValueType = (value: any): TServerValueTypes => {
  if (
    value instanceof Date ||
    (typeof value === "string" && value.startsWith("nldate:"))
  )
    return "date"

  const type = typeof value

  if (type === "number") return "number"
  if (type === "boolean") return "boolean"

  return "string"
}

const isEmptyValue = (value: any) => {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  )
}

export const filterToMongo = (
  filter: TFilterInput,
  options?: {
    regexFlags?: string

    /**
     * Use this when you know some fields are dates/objectIds/etc.
     *
     * Example:
     * typeResolver: (key) => key === "_id" ? "objectId" : "string"
     */
    typeResolver?: (
      key: string,
      value: any,
      operator: string
    ) => TServerValueTypes | undefined
    revertMap?: Map<string, TFilterInput>
  }
): TFilters => {
  const mongoFilter: Record<string, any> = {}

  for (const key in filter) {
    const condition = filter[key]
    if (!condition) continue

    const { operator } = condition
    const value = normalizeValue(condition.value, operator)

    if (isEmptyValue(value)) continue

    /**
     * Between / not between
     *
     * $bt  => between
     * $nbt => not between
     */
    if (RANGE_OPERATORS.has(operator)) {
      if (!Array.isArray(value) || value.length < 2) continue

      const from = value[0]
      const to = value[1]

      if (isEmptyValue(from) || isEmptyValue(to)) continue

      const type =
        options?.typeResolver?.(key, from, operator) ?? inferValueType(from)

      const rangeQuery = {
        $gte: valueWithType(type, from),
        $lte: valueWithType(type, to),
      }

      if (operator === "$bt") {
        mongoFilter[key] = rangeQuery
      } else {
        /**
         * "not between" is `value < from OR value > to`, so each field needs its
         * own `$or`. Pushing every field's branches into one shared
         * `mongoFilter.$or` turned an AND of two exclusions into a single OR, so
         * adding a second "is not between" filter *widened* the result set
         * instead of narrowing it. Nesting each one under `$and` keeps the
         * fields independent.
         */
        mongoFilter.$and ??= []

        mongoFilter.$and.push({
          $or: [
            {
              [key]: {
                $lt: valueWithType(type, from),
              },
            },
            {
              [key]: {
                $gt: valueWithType(type, to),
              },
            },
          ],
        })
      }

      continue
    }

    /**
     * Multi-option operators:
     *
     * $in, $nin, $all
     */
    if (ARRAY_OPERATORS.has(operator)) {
      const values = Array.isArray(value) ? value : [value]

      if (values.length === 0) continue

      const type =
        options?.typeResolver?.(key, values[0], operator) ??
        inferValueType(values[0])

      mongoFilter[key] = {
        [operator]: values.map((item) => valueWithType(type, item)),
      }

      continue
    }

    /**
     * String operators:
     *
     * $regex, $nregex
     */
    if (REGEX_OPERATORS.has(operator)) {
      const queryValue = valueWithType("regex", value, {
        regexFlags: options?.regexFlags ?? "i",
      })

      if (operator === "$regex") {
        mongoFilter[key] = {
          $regex: queryValue,
        }
      } else {
        mongoFilter[key] = {
          $not: {
            $regex: queryValue,
          },
        }
      }

      continue
    }

    /**
     * Normal operators:
     *
     * $eq, $ne, $gte, $lte, etc.
     */
    const type =
      options?.typeResolver?.(key, value, operator) ?? inferValueType(value)

    mongoFilter[key] = {
      [operator]: valueWithType(type, value),
    }
  }

  if (options?.revertMap instanceof Map) {
    options?.revertMap.set(hash(mongoFilter), filter)
  }

  return mongoFilter
}
