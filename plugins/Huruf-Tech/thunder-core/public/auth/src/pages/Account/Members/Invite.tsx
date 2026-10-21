import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router";
import { ThunderSDK } from "thunder-sdk";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAppBranding } from "@/hooks/useAppBranding";
import { useCapabilities } from "@/hooks/useCapabilities";
import { authClient } from "@/lib/auth";
import { getErrorMessage } from "@/lib/sdk";
import { StatusMessage } from "@/components/StatusMessage";

type TState =
  | { status: "joining" }
  | { status: "joined" }
  | { status: "failed"; message: string };

/** Accepts a tenant invitation for the signed-in user. */
function Invite() {
  const { t } = useTranslation();
  const { _id } = useParams<{ _id: string }>();
  const { app, appName } = useAppBranding();
  const { has } = useCapabilities();
  const { data: session, isPending } = authClient.useSession();
  const [state, setState] = React.useState<TState>({ status: "joining" });
  const accepted = React.useRef(false);

  React.useEffect(() => {
    if (!session || !_id || accepted.current) return;
    // Accepting is not idempotent: guard against StrictMode double effects.
    accepted.current = true;

    ThunderSDK.tenantMembers
      .create({ body: { invite: _id }, axiosConfig: { silent: true } })
      .then(() => setState({ status: "joined" }))
      .catch((error) =>
        setState({ status: "failed", message: getErrorMessage(error) }),
      );
  }, [session, _id]);

  if (!isPending && !session) {
    const back = encodeURIComponent(window.location.pathname);
    return (
      <Navigate
        to={`${has("signup") ? "/signup" : "/login"}?redirect=${back}`}
        replace
      />
    );
  }

  return (
    <AuthLayout title={t("Join workspace")}>
      {state.status === "joining" ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Spinner className="size-6" />
          <p className="text-sm text-muted-foreground">
            {t("Accepting your invitation…")}
          </p>
        </div>
      ) : state.status === "joined" ? (
        <StatusMessage
          tone="success"
          title={t("You're in!")}
          description={t("You've joined the workspace on {{name}}.", {
            name: appName,
          })}
          action={
            <Button size="lg" render={<Link to="/account" replace />}>
              {t("Go to your account")}
            </Button>
          }
        />
      ) : (
        <StatusMessage
          tone="error"
          title={t("We couldn't add you")}
          description={t(
            "This invitation may have expired, been revoked, or been sent to a different email address.",
          )}
          action={
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">{state.message}</p>
              <Button
                size="lg"
                variant="outline"
                render={<Link to="/account" replace />}
              >
                {t("Go to your account")}
              </Button>
              {app?.supportEmail && (
                <Button
                  size="lg"
                  variant="ghost"
                  render={<a href={`mailto:${app.supportEmail}`} />}
                >
                  {t("Contact support")}
                </Button>
              )}
            </div>
          }
        />
      )}
    </AuthLayout>
  );
}

export default Invite;
