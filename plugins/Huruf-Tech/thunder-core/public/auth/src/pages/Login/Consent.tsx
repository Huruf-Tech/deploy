import {
  ArrowLeftRightIcon,
  BadgeCheckIcon,
  CircleAlertIcon,
  ExternalLinkIcon,
  IdCardIcon,
  KeyRoundIcon,
  MailIcon,
  RefreshCwIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import useSWR from "swr";
import { ThunderSDK } from "thunder-sdk";
import { BrandLogo } from "@/components/BrandLogo";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";
import { getInitials, transformImage } from "@/lib/utils";

const KNOWN_SCOPES: Record<
  string,
  { icon: typeof MailIcon; label: string; description: string }
> = {
  openid: {
    icon: IdCardIcon,
    label: "Verify your identity",
    description: "Know who you are when you sign in",
  },
  profile: {
    icon: UserRoundIcon,
    label: "View your profile",
    description: "Your name and profile picture",
  },
  email: {
    icon: MailIcon,
    label: "View your email address",
    description: "The primary email address of your account",
  },
  offline_access: {
    icon: RefreshCwIcon,
    label: "Stay connected",
    description: "Access your data while you're not using the app",
  },
  full_access: {
    icon: KeyRoundIcon,
    label: "Full access to your account",
    description: "Read and change all of your account's resources",
  },
};

function Consent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const [submitting, setSubmitting] = React.useState<"allow" | "deny" | null>(
    null,
  );

  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const scopes = React.useMemo(
    () => (searchParams.get("scope") ?? "").trim().split(/\s+/).filter(Boolean),
    [searchParams],
  );

  // Client details are only readable by some users; degrade gracefully.
  const { data: client, isLoading: loadingClient } = useSWR(
    session && clientId ? ["oauthClient", clientId] : null,
    async ([, id]) => {
      const { results } = await ThunderSDK.oauthClients.get({
        params: { id },
        query: {},
        axiosConfig: { silent: true },
      });
      return results[0] ?? null;
    },
    { shouldRetryOnError: false },
  );

  const redirectHost = React.useMemo(() => {
    try {
      return redirectUri ? new URL(redirectUri).host : null;
    } catch {
      return null;
    }
  }, [redirectUri]);

  /** Only bounce back to the client when its redirect URI is known-good. */
  const trustedRedirect =
    !!client && !!redirectUri && !!client.redirectUris?.includes(redirectUri);

  if (!isPending && !session)
    return (
      <Navigate to={withSearch("/login", { omit: TRANSIENT_PARAMS })} replace />
    );

  const clientName = client?.name ?? redirectHost ?? t("Unknown application");

  if (!clientId || !redirectUri || !redirectHost)
    return (
      <AuthLayout title={t("Authorize access")}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <CircleAlertIcon className="size-6" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold">
              {t("Invalid authorization request")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t(
                "This link is missing required information. Go back to the application and try signing in again.",
              )}
            </p>
          </div>
        </div>
      </AuthLayout>
    );

  const allow = async () => {
    setSubmitting("allow");
    try {
      const { _id } = await ThunderSDK.oauth.consent({
        query: {
          client_id: clientId,
          redirect_uri: redirectUri,
          state: searchParams.get("state") ?? undefined,
          scope: searchParams.get("scope") ?? "",
          nonce: searchParams.get("nonce") ?? undefined,
          response_type: "code",
          code_challenge: searchParams.get("code_challenge") ?? "",
          code_challenge_method: "S256",
        },
        body: { resourceGrant: {} },
      });

      if (!_id) throw new Error(t("Failed to process consent"));

      // The account route resumes the authorization now that consent exists.
      navigate(withSearch("/account", { omit: TRANSIENT_PARAMS }), {
        replace: true,
      });
    } catch (error) {
      console.error(error);
      setSubmitting(null);
    }
  };

  const deny = () => {
    setSubmitting("deny");

    if (trustedRedirect) {
      const url = new URL(redirectUri);
      url.searchParams.set("error", "access_denied");
      url.searchParams.set("error_description", "The user denied the request");
      const state = searchParams.get("state");
      if (state) url.searchParams.set("state", state);
      window.location.assign(url.toString());
    } else {
      toast.info(t("Access was not granted"));
      navigate("/account", { replace: true });
    }
  };

  return (
    <AuthLayout
      title={t("Authorize access")}
      media={
        <div className="flex items-center gap-3">
          <BrandLogo className="size-12 rounded-2xl" />
          <div className="flex items-center gap-1 text-muted-foreground/60">
            <span className="size-1 rounded-full bg-current" />
            <ArrowLeftRightIcon className="size-4" />
            <span className="size-1 rounded-full bg-current" />
          </div>
          {loadingClient ? (
            <Skeleton className="size-12 rounded-2xl" />
          ) : (
            <Avatar className="size-12 rounded-2xl bg-transparent ring-1 ring-foreground/8">
              {client?.logo && (
                <AvatarImage
                  src={transformImage(client.logo)}
                  alt={clientName}
                />
              )}
              <AvatarFallback className="rounded-[inherit] bg-muted text-sm font-semibold">
                {getInitials(clientName)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      }
      heading={
        loadingClient ? (
          <Skeleton className="h-7 w-56" />
        ) : (
          t("{{name}} wants to access your account", { name: clientName })
        )
      }
      description={client?.description}
    >
      <div className="flex flex-col gap-5">
        {/* Signed-in user */}
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs/5">
          <UserAvatar
            size={36}
            name={session?.user.name}
            email={session?.user.email}
            image={session?.user.image}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">
              {session?.user.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {session?.user.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            render={
              <Link
                to={withSearch("/login", {
                  omit: TRANSIENT_PARAMS,
                  set: { addAccount: "1" },
                })}
              />
            }
          >
            {t("Switch")}
          </Button>
        </div>

        {/* Requested permissions */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">
            {t("This will allow {{name}} to:", { name: clientName })}
          </p>
          <ul className="flex flex-col divide-y rounded-xl border bg-card shadow-xs/5">
            {(scopes.length ? scopes : ["openid"]).map((scope) => {
              const known = KNOWN_SCOPES[scope];
              const Icon = known?.icon ?? ShieldIcon;

              return (
                <li key={scope} className="flex items-start gap-3 p-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">
                      {known
                        ? t(known.label)
                        : t("Access “{{scope}}”", { scope })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {known
                        ? t(known.description)
                        : t("Permission defined by {{name}}", {
                            name: clientName,
                          })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          {trustedRedirect ? (
            <BadgeCheckIcon className="mt-px size-4 shrink-0 text-success" />
          ) : (
            <ExternalLinkIcon className="mt-px size-4 shrink-0" />
          )}
          <p>
            {t(
              "You'll be redirected to {{host}}. Only allow access if you trust this app.",
              {
                host: redirectHost,
              },
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={deny}
            disabled={submitting !== null}
          >
            {submitting === "deny" && <Spinner />}
            {t("Cancel")}
          </Button>
          <Button size="lg" onClick={allow} disabled={submitting !== null}>
            {submitting === "allow" && <Spinner />}
            {t("Allow")}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Consent;
