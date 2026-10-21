import { ArrowLeftIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/BrandLogo";
import PoweredBy from "@/components/PoweredBy";
import { PreferenceControls } from "@/components/Preferences";
import { Button } from "@/components/ui/button";
import { LegalLinks } from "@/components/layout/AuthLayout";
import { cn } from "@/lib/utils";

export type TNavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AccountLayout({
  items,
  active,
  onNavigate,
  returnUrl,
  menu,
  children,
}: {
  items: TNavItem[];
  active: string;
  onNavigate: (id: string) => void;
  /** Where the "Back to app" button goes, when the account was opened from an app. */
  returnUrl?: string | null;
  menu: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const mobileNavRef = React.useRef<HTMLElement>(null);

  // Keep the active pill visible in the horizontally scrolling mobile nav.
  React.useEffect(() => {
    mobileNavRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/65">
        <div className="mx-auto flex h-15 max-w-6xl items-center gap-3 px-4 sm:px-6">
          {returnUrl && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("Back to app")}
              title={t("Back to app")}
              render={<a href={returnUrl} />}
            >
              <ArrowLeftIcon className="rtl:rotate-180" />
            </Button>
          )}
          <BrandLogo showName className="size-8 rounded-lg" />
          <span className="hidden text-sm text-muted-foreground sm:inline">
            / {t("Account")}
          </span>
          <div className="ms-auto flex items-center gap-2">
            <PreferenceControls />
            {menu}
          </div>
        </div>

        {/* Mobile navigation */}
        <nav
          ref={mobileNavRef}
          aria-label={t("Account sections")}
          className="scrollbar-none mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2 md:hidden"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active === item.id ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                active === item.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 py-8 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] md:py-10">
        <aside className="hidden md:block">
          <nav
            aria-label={t("Account sections")}
            className="sticky top-24 flex flex-col gap-0.5"
          >
            {items.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-2 start-0 w-0.5 rounded-full bg-primary transition-opacity",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <item.icon
                    className={cn("size-4", isActive && "text-primary")}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main
          key={active}
          className="flex min-w-0 flex-col gap-6 animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          {children}
        </main>
      </div>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <LegalLinks />
          <PoweredBy />
        </div>
      </footer>
    </div>
  );
}
