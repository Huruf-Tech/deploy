import { MailWarningIcon } from "lucide-react";
import React from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { PasswordInput } from "@/components/form/PasswordInput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useOnLogin } from "@/hooks/useOnLogin";
import { useResendVerification } from "@/hooks/useResendVerification";
import { authClient } from "@/lib/auth";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";
import { isValidEmail } from "@/lib/utils";

type TCredentials = {
  email: string;
  password: string;
  rememberMe: boolean;
};

function CredentialsForm({ onTwoFactor }: { onTwoFactor: () => void }) {
  const { t } = useTranslation();
  const onLogin = useOnLogin();
  const [searchParams] = useSearchParams();
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<string>();

  const { control, register, handleSubmit, formState } = useForm<TCredentials>({
    defaultValues: {
      email: searchParams.get("email") ?? "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit: SubmitHandler<TCredentials> = async (data) => {
    setUnverifiedEmail(undefined);

    const { data: result, error } = await authClient.signIn.email(data);

    if (error) {
      if (error.status === 403) setUnverifiedEmail(data.email);
      else toast.error(error.message ?? t("Invalid email or password"));
      return;
    }

    if ((result as { twoFactorRedirect?: boolean }).twoFactorRedirect)
      onTwoFactor();
    else onLogin();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-5">
        {unverifiedEmail && <VerifyEmailNotice email={unverifiedEmail} />}

        <Field>
          <FieldLabel htmlFor="email">{t("Email")}</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username webauthn"
            aria-invalid={!!formState.errors.email || undefined}
            {...register("email", {
              validate: (value) =>
                isValidEmail(value) || t("Please provide a valid email!"),
            })}
          />
          <FieldError>{formState.errors.email?.message}</FieldError>
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">{t("Password")}</FieldLabel>
            <Link
              to={withSearch("/reset-password", { omit: TRANSIENT_PARAMS })}
              viewTransition
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("Forgot password?")}
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password webauthn"
            aria-invalid={!!formState.errors.password || undefined}
            {...register("password", {
              required: t("Password is required!"),
            })}
          />
          <FieldError>{formState.errors.password?.message}</FieldError>
        </Field>

        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="rememberMe"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label htmlFor="rememberMe" className="font-normal">
                {t("Keep me signed in")}
              </Label>
            </Field>
          )}
        />

        <Button type="submit" size="lg" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {t("Sign in")}
        </Button>
      </FieldGroup>
    </form>
  );
}

function VerifyEmailNotice({ email }: { email: string }) {
  const { t } = useTranslation();
  const { state, resend } = useResendVerification();

  return (
    <Alert variant="warning">
      <MailWarningIcon />
      <AlertTitle>{t("Verify your email to continue")}</AlertTitle>
      <AlertDescription>
        {state === "sent"
          ? t("We sent a new verification link to {{email}}.", { email })
          : t("Check your inbox for the verification link.")}
        {state !== "sent" && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-foreground"
            onClick={() => resend(email)}
            disabled={state === "sending"}
          >
            {state === "sending" && <Spinner />}
            {t("Resend verification email")}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default CredentialsForm;
