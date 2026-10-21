import { FingerprintIcon, MailIcon, KeyRoundIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { FieldSeparator } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAppBranding } from "@/hooks/useAppBranding";
import { useCapabilities } from "@/hooks/useCapabilities";
import { useOnLogin } from "@/hooks/useOnLogin";
import { authClient } from "@/lib/auth";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";
import CredentialsForm from "./Credentials";
import MagicLinkForm from "./MagicLink";
import { SocialButtons, useEnabledProviders } from "./SocialButtons";
import TwoFactorChallenge from "./TwoFactorChallenge";

type TView = "password" | "magicLink" | "twoFactor";

/** WebAuthn errors that just mean the user dismissed the prompt. */
const CANCELLED_CODES = new Set(["AUTH_CANCELLED", "ERROR_CEREMONY_ABORTED"]);

function Login() {
  const { t } = useTranslation();
  const { appName } = useAppBranding();
  const { has, isLoading } = useCapabilities();
  const [searchParams] = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const providers = useEnabledProviders();

  const emailEnabled = has("email");
  const magicLinkEnabled = has("magicLink");
  const [view, setView] = React.useState<TView>("password");

  // Default to the magic link form when passwords are disabled.
  const activeView: TView =
    view === "password" && !emailEnabled && magicLinkEnabled
      ? "magicLink"
      : view;

  // Social / magic-link providers redirect back here with `?error=`.
  const callbackError = searchParams.get("error");
  React.useEffect(() => {
    if (callbackError)
      toast.error(t("Sign in failed"), {
        description: callbackError.replaceAll("_", " ").toLowerCase(),
      });
  }, [callbackError, t]);

  // An already signed-in user only stays here to add another account.
  if (!isPending && session && !searchParams.has("addAccount"))
    return (
      <Navigate
        to={withSearch("/account", { omit: TRANSIENT_PARAMS })}
        replace
      />
    );

  if (activeView === "twoFactor")
    return (
      <AuthLayout
        title={t("Two-step verification")}
        heading={t("Two-step verification")}
        description={t(
          "Enter the 6-digit code from your authenticator app to finish signing in.",
        )}
      >
        <TwoFactorChallenge onCancel={() => setView("password")} />
      </AuthLayout>
    );

  const hasPrimaryForm = emailEnabled || magicLinkEnabled;

  return (
    <AuthLayout
      title={t("Sign in")}
      heading={
        searchParams.has("addAccount")
          ? t("Add another account")
          : t("Welcome back")
      }
      description={t("Sign in to continue to {{name}}", {
        name: appName,
      })}
      footer={
        has("signup") && (
          <>
            {t("Don't have an account?")}{" "}
            <Link
              to={withSearch("/signup", { omit: TRANSIENT_PARAMS })}
              viewTransition
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("Create one")}
            </Link>
          </>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <SocialButtons />

        {has("passkey") && <PasskeyButton />}

        {hasPrimaryForm && (providers.length > 0 || has("passkey")) && (
          <FieldSeparator>{t("or")}</FieldSeparator>
        )}

        {activeView === "magicLink" ? (
          <MagicLinkForm />
        ) : emailEnabled ? (
          <CredentialsForm onTwoFactor={() => setView("twoFactor")} />
        ) : null}

        {emailEnabled && magicLinkEnabled && (
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() =>
              setView(activeView === "magicLink" ? "password" : "magicLink")
            }
          >
            {activeView === "magicLink" ? <KeyRoundIcon /> : <MailIcon />}
            {activeView === "magicLink"
              ? t("Sign in with password instead")
              : t("Email me a sign-in link instead")}
          </Button>
        )}

        {!isLoading &&
          !hasPrimaryForm &&
          providers.length === 0 &&
          !has("passkey") && (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("No sign-in methods are enabled for this app.")}
            </p>
          )}

        <Agreement />
      </div>
    </AuthLayout>
  );
}

function PasskeyButton() {
  const { t } = useTranslation();
  const onLogin = useOnLogin();
  const [pending, setPending] = React.useState(false);

  // Offer saved passkeys in the email field's autofill (conditional UI).
  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const available =
        await window.PublicKeyCredential?.isConditionalMediationAvailable?.();
      if (!available || cancelled) return;

      const { error } = await authClient.signIn.passkey({ autoFill: true });
      if (!error && !cancelled) onLogin();
    })().catch(() => {
      // Autofill ceremonies are aborted whenever another one starts; ignore.
    });

    return () => {
      cancelled = true;
    };
  }, [onLogin]);

  const signIn = async () => {
    setPending(true);
    const { error } = await authClient.signIn.passkey();
    setPending(false);

    if (error) {
      if (!CANCELLED_CODES.has((error as { code?: string }).code ?? ""))
        toast.error(error.message);
      return;
    }

    onLogin();
  };

  return (
    <Button variant="outline" size="lg" onClick={signIn} disabled={pending}>
      {pending ? <Spinner /> : <FingerprintIcon />}
      {t("Sign in with a passkey")}
    </Button>
  );
}

function Agreement() {
  const { t } = useTranslation();
  const { app } = useAppBranding();

  if (!app?.termsURL && !app?.privacyURL) return null;

  const link = (href: string, label: string) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-foreground underline underline-offset-4"
    >
      {label}
    </a>
  );

  return (
    <p className="text-center text-xs text-balance text-muted-foreground">
      {t("By continuing, you agree to the")}{" "}
      {app.termsURL && link(app.termsURL, t("Terms of Service"))}
      {app.termsURL && app.privacyURL && <> {t("and")} </>}
      {app.privacyURL && link(app.privacyURL, t("Privacy Policy"))}.
    </p>
  );
}

export default Login;
