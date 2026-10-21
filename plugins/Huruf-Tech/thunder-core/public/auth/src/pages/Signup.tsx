import { MailCheckIcon } from "lucide-react";
import React from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
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
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAppBranding } from "@/hooks/useAppBranding";
import { useCapabilities } from "@/hooks/useCapabilities";
import { useOnLogin } from "@/hooks/useOnLogin";
import { useResendVerification } from "@/hooks/useResendVerification";
import { authClient } from "@/lib/auth";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";
import { isValidEmail, resolveURL } from "@/lib/utils";
import { SocialButtons, useEnabledProviders } from "./Login/SocialButtons";

type TSignupForm = {
  fname: string;
  lname: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function Signup() {
  const { t } = useTranslation();
  const { appName } = useAppBranding();
  const { has, isLoading } = useCapabilities();
  const providers = useEnabledProviders();
  const onLogin = useOnLogin();
  const [pendingVerification, setPendingVerification] =
    React.useState<string>();

  const { register, handleSubmit, formState, watch } = useForm<TSignupForm>({
    defaultValues: {
      fname: "",
      lname: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit: SubmitHandler<TSignupForm> = async (data) => {
    const { data: result, error } = await authClient.signUp.email({
      name: [data.fname, data.lname]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" "),
      email: data.email,
      password: data.password,
      callbackURL: resolveURL(
        withSearch("/account", { omit: TRANSIENT_PARAMS }),
      ),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    // No session token means the server requires email verification first.
    if (!result?.token) setPendingVerification(data.email);
    else onLogin();
  };

  const signInLink = (
    <>
      {t("Already have an account?")}{" "}
      <Link
        to={withSearch("/login", { omit: TRANSIENT_PARAMS })}
        viewTransition
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {t("Sign in")}
      </Link>
    </>
  );

  if (pendingVerification)
    return (
      <AuthLayout title={t("Verify your email")} footer={signInLink}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheckIcon className="size-6" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold">{t("Check your inbox")}</h1>
            <p className="text-sm text-muted-foreground">
              {t(
                "We sent a verification link to {{email}}. Open it to activate your account.",
                { email: pendingVerification },
              )}
            </p>
          </div>
          <ResendVerification email={pendingVerification} />
        </div>
      </AuthLayout>
    );

  if (!isLoading && !has("signup"))
    return (
      <AuthLayout
        title={t("Sign up")}
        heading={t("Sign up is disabled")}
        description={t(
          "New accounts can't be created for {{name}} right now. Ask an administrator for an invitation.",
          { name: appName },
        )}
        footer={signInLink}
      >
        {null}
      </AuthLayout>
    );

  return (
    <AuthLayout
      title={t("Create account")}
      heading={t("Create your account")}
      description={t("Get started with {{name}} in less than a minute.", {
        name: appName,
      })}
      footer={signInLink}
    >
      <div className="flex flex-col gap-5">
        <SocialButtons mode="signup" />
        {providers.length > 0 && has("email") && (
          <FieldSeparator>{t("or")}</FieldSeparator>
        )}

        {has("email") && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup className="gap-5">
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="fname">{t("First name")}</FieldLabel>
                  <Input
                    id="fname"
                    autoComplete="given-name"
                    placeholder="Jane"
                    aria-invalid={!!formState.errors.fname || undefined}
                    {...register("fname", {
                      validate: (value) =>
                        !!value.trim() || t("First name is required!"),
                    })}
                  />
                  <FieldError>{formState.errors.fname?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="lname">{t("Last name")}</FieldLabel>
                  <Input
                    id="lname"
                    autoComplete="family-name"
                    placeholder="Doe"
                    {...register("lname")}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">{t("Email")}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={!!formState.errors.email || undefined}
                  {...register("email", {
                    validate: (value) =>
                      isValidEmail(value) || t("Please provide a valid email!"),
                  })}
                />
                <FieldError>{formState.errors.email?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">{t("Password")}</FieldLabel>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
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
                <FieldError>
                  {formState.errors.confirmPassword?.message}
                </FieldError>
              </Field>

              <Button type="submit" size="lg" disabled={formState.isSubmitting}>
                {formState.isSubmitting && <Spinner />}
                {t("Create account")}
              </Button>
            </FieldGroup>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

function ResendVerification({ email }: { email: string }) {
  const { t } = useTranslation();
  const { state, resend } = useResendVerification();

  return (
    <Button
      variant="outline"
      onClick={() => resend(email)}
      disabled={state !== "idle"}
    >
      {state === "sending" && <Spinner />}
      {state === "sent" ? t("Email sent") : t("Resend email")}
    </Button>
  );
}

export default Signup;
