import React from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { PasswordInput } from "@/components/form/PasswordInput";
import {
  PasswordStrength,
  validatePassword,
} from "@/components/form/PasswordStrength";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { StatusMessage } from "@/components/StatusMessage";
import { authClient } from "@/lib/auth";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";

type TForm = { password: string; confirmPassword: string };

/** Landing page of the password reset email: sets a new password. */
function ChangePassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  // Better Auth redirects here with `?error=INVALID_TOKEN` for expired links.
  const linkError = searchParams.get("error");
  const [done, setDone] = React.useState(false);

  const { register, handleSubmit, formState, watch } = useForm<TForm>({
    defaultValues: { password: "", confirmPassword: "" },
  });
  const password = watch("password");

  const onSubmit: SubmitHandler<TForm> = async (data) => {
    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token: token!,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setDone(true);
  };

  const loginLink = withSearch("/login", { omit: TRANSIENT_PARAMS });

  if (!token || linkError)
    return (
      <AuthLayout title={t("Reset password")}>
        <StatusMessage
          tone="error"
          title={t("This link is invalid or has expired")}
          description={t(
            "Password reset links can only be used once and expire after a while. Request a new one to continue.",
          )}
          action={
            <Button
              size="lg"
              render={
                <Link
                  to={withSearch("/reset-password", { omit: TRANSIENT_PARAMS })}
                />
              }
            >
              {t("Request a new link")}
            </Button>
          }
        />
      </AuthLayout>
    );

  if (done)
    return (
      <AuthLayout title={t("Password updated")}>
        <StatusMessage
          tone="success"
          title={t("Password updated")}
          description={t(
            "Your password has been changed. You can now sign in with your new password.",
          )}
          action={
            <Button size="lg" render={<Link to={loginLink} />}>
              {t("Continue to sign in")}
            </Button>
          }
        />
      </AuthLayout>
    );

  return (
    <AuthLayout
      title={t("Set a new password")}
      heading={t("Set a new password")}
      description={t("Choose a strong password you don't use anywhere else.")}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="password">{t("New password")}</FieldLabel>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              autoFocus
              aria-invalid={!!formState.errors.password || undefined}
              {...register("password", { validate: validatePassword(t) })}
            />
            <FieldError>{formState.errors.password?.message}</FieldError>
            <PasswordStrength password={password} />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">
              {t("Confirm password")}
            </FieldLabel>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              aria-invalid={!!formState.errors.confirmPassword || undefined}
              {...register("confirmPassword", {
                validate: (value) =>
                  value === password || t("Passwords don't match"),
              })}
            />
            <FieldError>{formState.errors.confirmPassword?.message}</FieldError>
          </Field>

          <Button type="submit" size="lg" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <Spinner />}
            {t("Update password")}
          </Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}

export default ChangePassword;
