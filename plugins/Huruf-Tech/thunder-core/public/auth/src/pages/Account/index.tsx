import {
  CodeIcon,
  LayoutGridIcon,
  ShieldIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useSearchParams } from "react-router";
import { BrandLogo } from "@/components/BrandLogo";
import {
  AccountLayout,
  type TNavItem,
} from "@/components/layout/AccountLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateSession } from "@/hooks/useUpdateSession";
import { apiOrigin } from "@/lib/api";
import { authClient } from "@/lib/auth";
import { features } from "@/lib/features";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";
import { getSafeRedirect } from "@/lib/utils";
import { AccountMenu } from "./AccountMenu";
import { Developers } from "./Developers";
import Overview from "./Home";
import { Members } from "./Members";
import PersonalInfo from "./PersonalInfo";
import Security from "./Security";

/** Where a signed-in user must be sent instead of seeing the account page. */
function usePendingRedirect() {
  const [searchParams] = useSearchParams();

  return React.useMemo(() => {
    // Resume an OAuth authorization started by a third-party app.
    if (searchParams.has("client_id"))
      return (
        new URL("/oauth/authorize", apiOrigin).toString() +
        withSearch("", { omit: TRANSIENT_PARAMS })
      );

    return getSafeRedirect(searchParams.get("redirect"));
    // Only evaluated on first render: navigating inside the account must not re-trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function Account() {
  const { data, isPending } = authClient.useSession();
  const pendingRedirect = usePendingRedirect();
  // Guard against malformed payloads (e.g. an HTML fallback page served
  // instead of the API) so they're treated as "signed out", not crash.
  const session = data?.session?.id && data.user?.id ? data : null;

  React.useEffect(() => {
    if (session && pendingRedirect) window.location.replace(pendingRedirect);
  }, [session, pendingRedirect]);

  if (isPending) return <AccountSkeleton />;

  if (!session)
    return (
      <Navigate to={withSearch("/login", { omit: TRANSIENT_PARAMS })} replace />
    );

  if (pendingRedirect) return <Redirecting />;

  return <AccountHome sessionId={session.session.id} />;
}

function AccountHome({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tenant = searchParams.get("tenant");

  useUpdateSession(sessionId);

  const items = React.useMemo<TNavItem[]>(
    () => [
      { id: "home", label: t("Overview"), icon: LayoutGridIcon },
      { id: "personal", label: t("Personal info"), icon: UserRoundIcon },
      { id: "security", label: t("Security"), icon: ShieldIcon },
      ...(features.oauthApps || features.apiKeys
        ? [{ id: "developers", label: t("Developers"), icon: CodeIcon }]
        : []),
      ...(tenant && features.members
        ? [{ id: "members", label: t("Members"), icon: UsersIcon }]
        : []),
    ],
    [t, tenant],
  );

  const requested = searchParams.get("tab") ?? "home";
  const active = items.some((item) => item.id === requested)
    ? requested
    : "home";

  const navigate = React.useCallback(
    (tab: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", tab);
          next.delete("view");
          return next;
        },
        { preventScrollReset: false },
      );
      window.scrollTo({ top: 0 });
    },
    [setSearchParams],
  );

  const sectionTitle = items.find((item) => item.id === active)?.label;

  return (
    <AccountLayout
      items={items}
      active={active}
      onNavigate={navigate}
      returnUrl={getSafeRedirect(searchParams.get("returnUri"))}
      menu={<AccountMenu />}
    >
      <title>{`${sectionTitle} · ${t("Account")}`}</title>
      {active === "home" && <Overview onNavigate={navigate} />}
      {active === "personal" && <PersonalInfo />}
      {active === "security" && <Security />}
      {active === "developers" && <Developers />}
      {active === "members" && tenant && <Members tenantId={tenant} />}
    </AccountLayout>
  );
}

function Redirecting() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5">
      <title>{t("Redirecting…")}</title>
      <BrandLogo className="size-12 rounded-2xl" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        {t("Taking you back to the app…")}
      </div>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="border-b">
        <div className="mx-auto flex h-15 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="ms-auto size-8 rounded-full" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="hidden flex-col gap-2 md:flex">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default Account;
