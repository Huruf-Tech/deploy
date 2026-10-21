/* eslint-disable react-hooks/rules-of-hooks */
import React from "react"
import type { TField } from "@/core/lib/jsonSchemaToFields"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field"
import RenderInput from "./RenderInput"
import { RenderFieldGroup } from "./RenderFieldGroup"
import { findFieldError } from "./errors"

export type TRenderObjectProp = {
  name: string
  field: TField
}

export default function RenderObject({ name, field }: TRenderObjectProp) {
  if (field.type !== "object") return <RenderInput name={name} field={field} />

  if (!field.fields?.length) return

  const { t } = useTranslation()
  const {
    formState: { errors },
    watch,
  } = useFormContext()

  const getError = React.useCallback(
    (name?: string) => String(findFieldError(errors, name)?.message ?? ""),
    [errors]
  )

  if (field.requirementKey) {
    const value = watch(field.requirementKey)

    if (value !== field.name) return
  }

  return (
    <FieldGroup>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend>{t(field.label ?? field.name ?? "")}</FieldLegend>
        {field.description && (
          <FieldDescription>{t(field.description)}</FieldDescription>
        )}
        <FieldError>{getError(name)}</FieldError>
      </FieldSet>
      <FieldSet>
        <RenderFieldGroup
          fields={field.fields ?? []}
          fieldName={(subField) =>
            [name, subField.name].filter(Boolean).join(".")
          }
        />
      </FieldSet>
    </FieldGroup>
  )
}
