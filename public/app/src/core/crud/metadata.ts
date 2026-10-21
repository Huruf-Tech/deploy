/* eslint-disable @typescript-eslint/no-explicit-any */
import { ThunderSDK } from "thunder-sdk"

import { JSONSchemaToFields } from "../lib/jsonSchemaToFields"

/**
 * Module metadata -> form fields, plus the `JSONSchemaToFields.resolveRef`
 * implementation.
 *
 * This lived in `FormPage.tsx`, where assigning `resolveRef` was a **module
 * side effect**. `ListPage` and the wallet transaction history both import
 * `fieldsFromModuleMetadata`, so they pulled the entire form page in just to get
 * that assignment to run — which made the form route impossible to code-split
 * and left a hidden import-order dependency: whoever evaluated first had to be
 * the one that registered the resolver. Keeping it in a small shared module
 * removes both problems.
 */

export const fieldsFromModuleMetadata = async (
  metadata: any,
  opts: {
    type: "insert" | "update" | "output"
    resolveRef?: boolean
  }
) => {
  if (!metadata) return []

  if (typeof metadata.crud !== "object" || metadata.crud === null) return []

  const schema = (() => {
    switch (opts.type) {
      case "insert":
        return metadata.crud.insertSchema ?? metadata.crud.schema

      case "update":
        return (
          metadata.crud.updateSchema ??
          metadata.crud.insertSchema ??
          metadata.crud.schema
        )

      default:
        return metadata.crud.schema
    }
  })()

  //! A module can expose create/update without publishing a schema for them, and
  //! `toFields` throws on anything that is not an object. Returning [] keeps this
  //! function total so no caller has to handle a rejected promise.
  if (typeof schema !== "object" || schema === null) return []

  // Convert json schema to fields data
  const results = await JSONSchemaToFields.toFields(undefined, schema, {
    resolveRef: opts.resolveRef,
  })

  return results
}

/** Upper bound on options materialised for the list filter dropdowns. */
export const REF_OPTIONS_LIMIT = 100

JSONSchemaToFields.resolveRef = async (ref, field) => {
  const createProjection = () => {
    const fields =
      field.refLabel instanceof Array
        ? field.refLabel
        : [field.refLabel, "label", "name", "title"].filter(Boolean)

    return Object.fromEntries(fields.map((field) => [field, 1]))
  }

  try {
    const { results } = await ThunderSDK.useCache(
      async () =>
        (await ThunderSDK.getModule(ref).get({
          query: {
            filters: field.refFilters,
            project: createProjection(),
            //! Still unbounded in spirit, but capped so a `ref` to a large module
            //! cannot stall the page. The list filter UI is the only caller left;
            //! form fields use `RefSelect`.
            limit: REF_OPTIONS_LIMIT,
          },
        })) as {
          results: any[]
        },
      {
        cacheKey: [ref, "get"],
        cacheTTL: parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1"),
      }
    )

    const resolveLabel = (item: any) => {
      if (field.refLabel instanceof Array) {
        return field.refLabel
          .map((prop) => item[prop])
          .filter(Boolean)
          .join(" ")
      }

      return (
        (field.refLabel && item[field.refLabel]) ||
        item.label ||
        item.name ||
        item.title
      )
    }

    const resolveValue = (item: any) => {
      if (field.refValue) {
        return item[field.refValue]
      }

      return item._id
    }

    return results.map((item: any) => {
      const value = resolveValue(item)

      return {
        label: resolveLabel(item) || value,
        value,
      }
    })
  } catch (error) {
    console.error(error)

    return []
  }
}
