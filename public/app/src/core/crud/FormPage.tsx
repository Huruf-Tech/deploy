/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { useNavigate, useParams } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { IconAlertTriangle } from "@tabler/icons-react"
import type { TField } from "../lib/jsonSchemaToFields"
import { forms } from "@/overrides/crud/forms"
import { RenderFieldGroup } from "./form/RenderFieldGroup"
import { Container } from "@/core/custom/Container"
import { toast } from "sonner"
import { isAxiosError } from "axios"

//! Re-exported for backwards compatibility: these moved to ./metadata so the
//! `resolveRef` registration is no longer a side effect of loading this page.
import { fieldsFromModuleMetadata } from "./metadata"

export { fieldsFromModuleMetadata, REF_OPTIONS_LIMIT } from "./metadata"

export interface IFormPageProps {
  group?: string
  name: string
}

export function FormPage({ name }: IFormPageProps) {
  const CustomForm = forms[name as keyof typeof forms]

  if (CustomForm) return <CustomForm />

  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()

  const navigate = useNavigate()

  const isEditMode = !!id
  const methods = useForm<any>({
    shouldUnregister: true,
  })

  const [isRecordLoading, setIsRecordLoading] = React.useState(true)

  React.useEffect(() => {
    if (!isEditMode) return

    let cancelled = false

    void (async () => {
      setIsRecordLoading(true)

      try {
        const { results } = (await ThunderSDK.getModule(name).get({
          params: { id },
        })) as { results: any[] }

        if (cancelled) return

        if (results.length === 0) {
          toast.error(t("Record not found."))
          navigate(-1)
          return
        }

        methods.reset(results[0])
      } catch (error) {
        console.error("Failed to load record:", error)
      } finally {
        //! This used to run in `.finally()` on the fetch itself, i.e. *before*
        //! `reset()`. The form rendered once with empty values, and any
        //! uncontrolled input latched that blank.
        if (!cancelled) setIsRecordLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, isEditMode, methods, name, navigate, t])

  const metadata = React.useMemo(() => ThunderSDK.getMetadata(name), [name])

  const [isFieldsLoading, setIsFieldsLoading] = React.useState(true)
  const [fields, setFields] = React.useState<TField[]>([])

  React.useEffect(() => {
    let cancelled = false

    void (async () => {
      setIsFieldsLoading(true)

      try {
        const fields = await fieldsFromModuleMetadata(metadata, {
          type: isEditMode ? "update" : "insert",
          //! `ref` fields are rendered by `RefSelect`, which queries on demand.
          //! Resolving here would download every referenced collection before the
          //! form could paint.
          resolveRef: false,
        })

        if (!cancelled) setFields(fields)
      } catch (error) {
        console.error("Failed to build form fields:", error)

        if (!cancelled) setFields([])
      } finally {
        if (!cancelled) setIsFieldsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isEditMode, metadata])

  const isFormLoading = isFieldsLoading || (isEditMode && isRecordLoading)

  //! A module can expose create/update with no schema behind it, so `fields` can
  //! legitimately come back empty (B-02). The root must also be an object: a
  //! root-level array yields unnamed fields that cannot be registered (G-09).
  const hasFields = fields[0]?.type === "object" && !!fields[0]?.fields?.length
  const onSubmit: SubmitHandler<any> = async (body) => {
    try {
      if (isEditMode) {
        await ThunderSDK.getModule(name).update({
          params: { id },
          body,
        })

        toast.success(t("{{name}} updated successfully.", { name }))
      } else {
        await ThunderSDK.getModule(name).create({
          body,
        })

        toast.success(t("{{name}} created successfully.", { name }))
      }

      await ThunderSDK.withCaching(
        async ({ expire }) => {
          await expire()
        },
        {
          matcher: new RegExp(name),
        }
      )

      navigate(-1)
    } catch (error) {
      //! The axios interceptor already toasts whatever the server sent, so the
      //! generic message is only useful when the response carried none.
      const reported = isAxiosError<{ messages?: unknown[] }>(error)
        ? !!error.response?.data?.messages?.length
        : false

      if (!reported) {
        toast.error(
          isEditMode
            ? t("Failed to update {{name}}.", { name })
            : t("Failed to create {{name}}.", { name })
        )
      }
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto mask-y-from-98%">
      <Container>
        <FormProvider {...methods}>
          <form
            className="mx-auto w-full max-w-lg pb-24"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FieldGroup>
              <FieldSet>
                <FieldLegend>
                  {isEditMode ? t("Update") : t("Create")}
                </FieldLegend>
                <FieldDescription>
                  {isEditMode
                    ? t("Update the {{name}} entry below.", { name })
                    : t(
                        "Fill the form below to create a new {{name}} entry. All fields are required",
                        { name }
                      )}
                </FieldDescription>
              </FieldSet>

              {isFormLoading ? (
                <Skeleton className="py-8 text-center text-sm text-muted-foreground">
                  {isEditMode ? t("Loading record...") : t("Loading form...")}
                </Skeleton>
              ) : hasFields ? (
                <RenderFieldGroup fields={fields[0]!.fields!} />
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="bg-destructive/10">
                      <IconAlertTriangle className="text-destructive" />
                    </EmptyMedia>
                    <EmptyTitle>{t("This form is unavailable")}</EmptyTitle>
                    <EmptyDescription>
                      {t(
                        "{{name}} does not publish a schema for this action, so there is nothing to fill in.",
                        { name }
                      )}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}

              <FieldSet>
                <FieldGroup>
                  <Field orientation="horizontal">
                    <Button
                      type="submit"
                      disabled={
                        methods.formState.isSubmitting ||
                        isFormLoading ||
                        !hasFields
                      }
                    >
                      {t("Submit")}
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => navigate(-1)}
                    >
                      {t("Cancel")}
                    </Button>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </form>
        </FormProvider>
      </Container>
    </div>
  )
}
