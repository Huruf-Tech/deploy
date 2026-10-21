import { AppWindowIcon, KeyRoundIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { SectionHeader } from "@/components/Settings";
import { features } from "@/lib/features";
import { cn } from "@/lib/utils";
import { APIKeys } from "./API";
import OAuthClients from "./Oauth";

const VIEWS = [
  {
    id: "oauth",
    label: "OAuth apps",
    icon: AppWindowIcon,
    enabled: features.oauthApps,
  },
  {
    id: "api-keys",
    label: "API keys",
    icon: KeyRoundIcon,
    enabled: features.apiKeys,
  },
].filter((view) => view.enabled);

export function Developers() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const requested = searchParams.get("view");
  const view = VIEWS.find((v) => v.id === requested)?.id ?? VIEWS[0]?.id;

  if (!view) return null;

  return (
    <>
      <SectionHeader
        title={t("Developers")}
        description={
          VIEWS.length > 1
            ? t("Build on top of your account with OAuth apps and API keys.")
            : view === "oauth"
              ? t("Let your own applications sign users in.")
              : t("Call the API from your servers.")
        }
      />

      {VIEWS.length > 1 && (
        <div
          role="tablist"
          aria-label={t("Developer tools")}
          className="inline-flex w-fit gap-1 rounded-xl border bg-muted/50 p-1"
        >
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("view", item.id);
                  return next;
                })
              }
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                view === item.id
                  ? "bg-background text-foreground shadow-xs ring-1 ring-foreground/8"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {t(item.label)}
            </button>
          ))}
        </div>
      )}

      <div
        role="tabpanel"
        key={view}
        className="animate-in fade-in duration-300"
      >
        {view === "oauth" ? <OAuthClients /> : <APIKeys />}
      </div>
    </>
  );
}
