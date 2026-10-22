/* eslint-disable @typescript-eslint/no-explicit-any */
import { hash } from "ohash"
import type { TFilters } from "thunder-sdk/types"
import type { TFilterInput, TServerValueTypes } from "./filterToMongo"

type TTypedValue = {
  type: TServerValueTypes
  value: string
  options?: {
    regexFlags?: string
  }
}

const SERVER_VALUE_TYPES = new Set<TServerValueTypes>([
  "string",
  "number",
  "boolean",
  "date",
  "regex",
  "objectId",
])

const isTypedValue = (value: any): value is TTypedValue => {
  return (
    value !== null &&
    typeof value === "object" &&
    SERVER_VALUE_TYPES.has(value.type) &&
    "value" in value
  )
}

/**
 * Converts the serialized server value back to its original JS type.
 *
 * Also supports normal MongoDB values that aren't wrapped with valueWithType().
 */
const parseTypedValue = (value: any): any => {
  if (!isTypedValue(value)) return value

  switch (value.type) {
    case "number": {
      const parsed = Number(value.value)
      return Number.isNaN(parsed) ? value.value : parsed
    }

    case "boolean":
      return value.value === "true"

    case "date": {
      const parsed = new Date(value.value)
      return Number.isNaN(parsed.getTime()) ? value.value : parsed
    }

    case "string":
    case "regex":
    case "objectId":
    default:
      return value.value
  }
}

const getFieldCondition = (
  clause: any
): { key: string; query: Record<string, any> } | undefined => {
  if (!clause || typeof clause !== "object" || Array.isArray(clause)) {
    return undefined
  }

  const keys = Object.keys(clause)

  if (keys.length !== 1) return undefined

  const key = keys[0]
  const query = clause[key]

  if (!query || typeof query !== "object" || Array.isArray(query)) {
    return undefined
  }

  return { key, query }
}

export const _mongoToFilter = (
  mongoFilter: Record<string, any>
): TFilterInput => {
  const filter: TFilterInput = {}

  /**
   * Detect not-between expressions:
   *
   * {
   *   $or: [
   *     { age: { $lt: valueWithType("number", 18) } },
   *     { age: { $gt: valueWithType("number", 60) } }
   *   ]
   * }
   *
   * Becomes:
   *
   * {
   *   age: {
   *     value: [18, 60],
   *     operator: "$nbt"
   *   }
   * }
   */
  /**
   * `filterToMongo` nests each "not between" under `$and` so two of them stay
   * independent (see B-17). Older links still carry a single flat `$or`, so
   * both shapes are read here.
   */
  const orGroups: unknown[][] = []

  if (Array.isArray(mongoFilter.$or)) orGroups.push(mongoFilter.$or)

  if (Array.isArray(mongoFilter.$and)) {
    for (const clause of mongoFilter.$and) {
      if (
        clause &&
        typeof clause === "object" &&
        Array.isArray((clause as Record<string, unknown>).$or)
      ) {
        orGroups.push((clause as Record<string, unknown[]>).$or)
      }
    }
  }

  for (const orConditions of orGroups) {
    const usedIndexes = new Set<number>()

    for (let index = 0; index < orConditions.length; index++) {
      if (usedIndexes.has(index)) continue

      const lowerCondition = getFieldCondition(orConditions[index])

      if (!lowerCondition || !("$lt" in lowerCondition.query)) {
        continue
      }

      const upperIndex = orConditions.findIndex((clause, candidateIndex) => {
        if (candidateIndex === index || usedIndexes.has(candidateIndex)) {
          return false
        }

        const upperCondition = getFieldCondition(clause)

        return (
          upperCondition?.key === lowerCondition.key &&
          "$gt" in upperCondition.query
        )
      })

      if (upperIndex === -1) continue

      const upperCondition = getFieldCondition(orConditions[upperIndex])

      if (!upperCondition) continue

      filter[lowerCondition.key] = {
        value: [
          parseTypedValue(lowerCondition.query.$lt),
          parseTypedValue(upperCondition.query.$gt),
        ],
        operator: "$nbt",
      }

      usedIndexes.add(index)
      usedIndexes.add(upperIndex)
    }
  }

  for (const [key, query] of Object.entries(mongoFilter)) {
    if (key === "$or" || key === "$and") continue

    /**
     * Support direct Mongo equality:
     *
     * { status: "active" }
     */
    if (
      query === null ||
      typeof query !== "object" ||
      Array.isArray(query) ||
      query instanceof Date
    ) {
      filter[key] = {
        value: [parseTypedValue(query)],
        operator: "$eq",
      }

      continue
    }

    /**
     * Between:
     *
     * {
     *   age: {
     *     $gte: typedValue,
     *     $lte: typedValue
     *   }
     * }
     */
    if ("$gte" in query && "$lte" in query) {
      filter[key] = {
        value: [parseTypedValue(query.$gte), parseTypedValue(query.$lte)],
        operator: "$bt",
      }

      continue
    }

    /**
     * Not-regex:
     *
     * {
     *   name: {
     *     $not: {
     *       $regex: typedValue
     *     }
     *   }
     * }
     */
    if (
      "$not" in query &&
      query.$not &&
      typeof query.$not === "object" &&
      "$regex" in query.$not
    ) {
      filter[key] = {
        value: [parseTypedValue(query.$not.$regex)],
        operator: "$nregex",
      }

      continue
    }

    /**
     * Regex:
     */
    if ("$regex" in query) {
      filter[key] = {
        value: [parseTypedValue(query.$regex)],
        operator: "$regex",
      }

      continue
    }

    /**
     * Array operators:
     *
     * $in, $nin, $all
     */
    const arrayOperator = ["$in", "$nin", "$all"].find(
      (operator) => operator in query
    )

    if (arrayOperator) {
      const values = Array.isArray(query[arrayOperator])
        ? query[arrayOperator]
        : [query[arrayOperator]]

      filter[key] = {
        value: values.map(parseTypedValue),
        operator: arrayOperator,
      }

      continue
    }

    /**
     * Normal operators:
     *
     * $eq, $ne, $gt, $gte, $lt, $lte, etc.
     */
    const entries = Object.entries(query)

    if (entries.length > 0) {
      const [operator, value] = entries[0]

      filter[key] = {
        value: [parseTypedValue(value)],
        operator,
      }
    }
  }

  return filter
}

export const mongoToFilter = (
  filters: TFilters,
  revertMap?: Map<string, TFilterInput>
) => {
  let revertedFilters = revertMap?.get(hash(filters))

  if (!revertedFilters) revertedFilters = _mongoToFilter(filters)

  return revertedFilters
}
