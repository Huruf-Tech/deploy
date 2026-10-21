import { useTranslation } from "react-i18next";

import HurufLogo from "@/assets/huruf-logo.png";
import { useAppBranding } from "@/hooks/useAppBranding";
import { cn } from "@/lib/utils";

function PoweredBy({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { app, isLoading } = useAppBranding();

  if (isLoading || app?.hidePoweredBy) return null;

  if (!app || app.hidePoweredBy) {
    return null;
  }

  return (
    <a
      href="https://huruftech.com"
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {t("Powered by")}
      <img src={HurufLogo} className="h-4.5 w-auto" alt="Huruf Tech" />
    </a>
  );
}

export default PoweredBy;
