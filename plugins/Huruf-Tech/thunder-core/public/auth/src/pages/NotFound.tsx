import { CompassIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";

function NotFound() {
  const { t } = useTranslation();

  return (
    <AuthLayout title={t("Page not found")}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <CompassIcon className="size-6" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-primary">404</p>
          <h1 className="text-2xl font-semibold">{t("Page not found")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("The page you're looking for doesn't exist or has moved.")}
          </p>
        </div>
        <Button
          size="lg"
          className="mt-2 w-full"
          render={
            <Link to={withSearch("/account", { omit: TRANSIENT_PARAMS })} />
          }
        >
          {t("Go to your account")}
        </Button>
      </div>
    </AuthLayout>
  );
}

export default NotFound;
