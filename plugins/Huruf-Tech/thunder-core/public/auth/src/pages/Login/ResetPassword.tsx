import { ArrowLeftIcon, MailCheckIcon } from "lucide-react";
import React from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";
import { isValidEmail, resolveURL } from "@/lib/utils";

/** Requests a password reset email. */
function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [sentTo, setSentTo] = React.useState<string>();

  const { register, handleSubmit, formState } = useForm<{ email: string }>({
    defaultValues: { email: searchParams.get("email") ?? "" },
  });

  const onSubmit: SubmitHandler<{ email: string }> = async ({ email }) => {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: resolveURL(
        withSearch("/change-password", { omit: TRANSIENT_PARAMS }),
      ),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setSentTo(email);
  };

  const backLink = (
    <Link
      to={withSearch("/login", { omit: TRANSIENT_PARAMS })}
      viewTransition
      className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
    >
      <ArrowLeftIcon className="size-4 rtl:rotate-180" />
      {t("Back to sign in")}
    </Link>
  );

  if (sentTo)
    return (
      <AuthLayout title={t("Reset password")} footer={backLink}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheckIcon className="size-6" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold">{t("Check your inbox")}</h1>
            <p className="text-sm text-muted-foreground">
              {t(
                "If an account exists for {{email}}, you'll get an email with a link to reset your password.",
                { email: sentTo },
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSentTo(undefined)}
          >
            {t("Use a different email")}
          </Button>
        </div>
      </AuthLayout>
    );

  return (
    <AuthLayout
      title={t("Reset password")}
      heading={t("Forgot your password?")}
      description={t(
        "Enter the email you use to sign in and we'll send you a reset link.",
      )}
      footer={backLink}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="email">{t("Email")}</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              autoFocus
              aria-invalid={!!formState.errors.email || undefined}
              {...register("email", {
                validate: (value) =>
                  isValidEmail(value) || t("Please provide a valid email!"),
              })}
            />
            <FieldError>{formState.errors.email?.message}</FieldError>
          </Field>

          <Button type="submit" size="lg" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <Spinner />}
            {t("Send reset link")}
          </Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
