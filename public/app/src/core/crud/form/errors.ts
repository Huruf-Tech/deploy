/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FieldErrors } from "react-hook-form"

/**
 * Walks a dotted field path (`contract.wage.amount`) through react-hook-form's
 * nested error tree and returns the error node, if any.
 *
 * Callers read `.message` for a plain field, or `.root?.message` for the
 * field-array-level error produced by `useFieldArray({ rules })`.
 *
 * The descent starts at the root and then follows the path strictly. The old
 * `error?.[part] ?? errors[part]` re-applied the root lookup on every segment,
 * so a miss part-way down resolved to an unrelated top-level key of the same
 * name — `wage.amount` could surface the error belonging to `amount`.
 */
export function findFieldError(
  errors: FieldErrors,
  name?: string
): any | undefined {
  if (!name) return

  let error: any = errors

  for (const part of name.split(".")) {
    if (error === undefined || error === null) return

    error = error[part]
  }

  return error
}
