import React from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth";
import { getSafeRedirect, resolveURL } from "@/lib/utils";

function Logout() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const redirect = searchParams.get("redirect");

  React.useEffect(() => {
    void (async () => {
      try {
        await authClient.signOut();
      } catch {
        // Already signed out or offline: redirect regardless.
      }
      window.location.replace(
        getSafeRedirect(redirect) ?? resolveURL("/login"),
      );
    })();
  }, [redirect]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5">
      <title>{t("Signing out…")}</title>
      <BrandLogo className="size-12 rounded-2xl" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        {t("Signing you out…")}
      </div>
    </div>
  );
}

export default Logout;
