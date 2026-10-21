import {
  CircleAlertIcon,
  FingerprintIcon,
  KeyRoundIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/BrandLogo";
import PoweredBy from "@/components/PoweredBy";
import { PreferenceControls } from "@/components/Preferences";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppBranding } from "@/hooks/useAppBranding";
import { useCapabilities } from "@/hooks/useCapabilities";
import { cn } from "@/lib/utils";

type AuthLayoutProps = {
  /** Document title, suffixed with the app name. */
  title: string;
  heading?: React.ReactNode;
  description?: React.ReactNode;
  /** Rendered above the heading (e.g. app logos on the consent screen). */
  media?: React.ReactNode;
  /** Rendered under the form (e.g. "Don't have an account?"). */
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export function AuthLayout({
  title,
  heading,
  description,
  media,
  footer,
  children,
}: AuthLayoutProps) {
  const { t } = useTranslation();
  const { app, isLoading, error, appName } = useAppBranding();
  const { isLoading: capsLoading } = useCapabilities();
  const loading = isLoading || capsLoading;

  return (
    <div className="grid min-h-svh w-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <title>{loading ? t("Loading…") : `${title} · ${appName}`}</title>

      <div className="relative isolate flex min-h-svh flex-col px-5 py-5 sm:px-10">
        {/* Soft brand glow on small screens where the brand panel is hidden */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-1 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent)] lg:hidden"
        />

        <header className="flex items-center justify-between gap-3">
          {app?.homepageURL ? (
            <a href={app.homepageURL} className="rounded-lg">
              <BrandLogo showName />
            </a>
          ) : (
            <BrandLogo showName />
          )}
          <PreferenceControls />
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-2 duration-500">
            {error ? (
              <BrandingError error={error} />
            ) : loading ? (
              <FormSkeleton />
            ) : (
              <>
                {media && <div className="mb-6">{media}</div>}
                {(heading || description) && (
                  <div className="mb-7 flex flex-col gap-1.5">
                    {heading && (
                      <h1 className="text-2xl font-semibold">{heading}</h1>
                    )}
                    {description && (
                      <p className="text-sm text-pretty text-muted-foreground">
                        {description}
                      </p>
                    )}
                  </div>
                )}
                {children}
                {footer && (
                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    {footer}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <LegalLinks />
          <PoweredBy />
        </footer>
      </div>

      <aside className="hidden p-3 lg:block">
        <BrandPanel />
      </aside>
    </div>
  );
}

export function LegalLinks({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { app, appName } = useAppBranding();
  const year = new Date().getFullYear();

  return (
    <nav
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}
    >
      <span>
        © {year} {appName}
      </span>
      {app?.termsURL && (
        <a className="hover:text-foreground" href={app.termsURL}>
          {t("Terms")}
        </a>
      )}
      {app?.privacyURL && (
        <a className="hover:text-foreground" href={app.privacyURL}>
          {t("Privacy")}
        </a>
      )}
    </nav>
  );
}

function BrandPanel() {
  const { t } = useTranslation();
  const { app, appName, isLoading } = useAppBranding();
  const { has, isLoading: capsLoading } = useCapabilities();
  const name = appName;
  const imageStatus = useImageStatus(app?.heroImage);

  // Hold the skeleton until a background image is ready, so it never pops in.
  if (isLoading || capsLoading || imageStatus === "loading")
    return <BrandPanelSkeleton />;

  // A background image that failed to load falls back to the default panel.
  const heroImage = imageStatus === "loaded" ? app?.heroImage : undefined;

  // Only paint the panel in the brand color when the project defines one;
  // otherwise stay neutral instead of showing the default accent.
  const branded = !!app?.theme?.["--primary"];

  const features = [
    has("passkey") && { icon: FingerprintIcon, label: t("Passkeys") },
    has("2fa") && { icon: ShieldCheckIcon, label: t("2-step verification") },
    { icon: KeyRoundIcon, label: t("Single sign-on") },
  ].filter(Boolean) as { icon: typeof KeyRoundIcon; label: string }[];

  return (
    <div
      className={cn(
        "relative isolate flex h-full flex-col justify-between overflow-hidden rounded-[28px] p-10 animate-in fade-in duration-500",
        branded
          ? "bg-primary text-primary-foreground"
          : "bg-neutral-700 text-white dark:bg-neutral-800",
        heroImage && "text-white",
      )}
    >
      {heroImage && (
        <>
          <img
            src={heroImage}
            alt=""
            aria-hidden
            className="absolute inset-0 -z-2 size-full object-cover"
          />
          {/* Scrim keeping the badge and headline readable on any photo */}
          <div
            aria-hidden
            className="absolute inset-0 -z-1 bg-linear-to-t from-black/75 via-black/25 to-black/35"
          />
        </>
      )}
      {/* Layered light, built only from the brand color so any tenant theme works */}
      <div
        aria-hidden
        className="absolute inset-0 -z-1 bg-[radial-gradient(80%_60%_at_100%_0%,color-mix(in_oklch,white_28%,transparent),transparent_60%),radial-gradient(70%_60%_at_0%_100%,color-mix(in_oklch,black_35%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-1 bg-[radial-gradient(color-mix(in_oklch,white_22%,transparent)_1px,transparent_1px)] mask-[radial-gradient(70%_60%_at_70%_30%,black,transparent)] bg-size-[20px_20px]"
      />
      <div
        aria-hidden
        className="absolute -end-24 top-1/3 -z-1 size-96 rounded-full border border-white/15"
      />
      <div
        aria-hidden
        className="absolute -end-48 top-1/4 -z-1 size-[34rem] rounded-full border border-white/10"
      />

      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur">
        <ShieldCheckIcon className="size-3.5" />
        {t("Secure sign-in")}
      </span>

      {!heroImage && (
        <SecurityCard
          name={name}
          accentClass={branded ? "text-primary" : "text-neutral-700"}
        />
      )}

      <div className="flex max-w-md flex-col gap-5">
        <h2 className="text-4xl leading-[1.1] font-semibold text-balance">
          {app?.heroTitle ||
            t("One account for everything {{name}}.", { name })}
        </h2>
        {app?.description && (
          <p className="text-base text-pretty opacity-80">{app.description}</p>
        )}
        <ul className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <li
              key={feature.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1.5 text-sm ring-1 ring-white/15"
            >
              <feature.icon className="size-4 opacity-90" />
              {feature.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Tracks whether an image URL can be loaded ("none" when there's no URL). */
function useImageStatus(src?: string) {
  const [result, setResult] = React.useState<{
    src: string;
    status: "loaded" | "error";
  }>();

  React.useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => !cancelled && setResult({ src, status: "loaded" });
    image.onerror = () => !cancelled && setResult({ src, status: "error" });
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) return "none";
  return result?.src === src ? result.status : "loading";
}

/** Placeholder with the panel's layout while branding and capabilities load. */
function BrandPanelSkeleton() {
  const block = "rounded-md bg-foreground/7 dark:bg-foreground/6";

  return (
    <Skeleton
      aria-hidden
      className="flex h-full flex-col justify-between rounded-[28px] p-10"
    >
      <div className={cn(block, "h-7 w-32 rounded-full")} />
      <div className={cn(block, "mx-auto h-28 w-full max-w-xs rounded-2xl")} />
      <div className="flex flex-col gap-4">
        <div className={cn(block, "h-10 w-3/4")} />
        <div className={cn(block, "h-10 w-1/2")} />
        <div className={cn(block, "mt-2 h-5 w-2/3")} />
        <div className="mt-1 flex gap-2">
          <div className={cn(block, "h-8 w-28 rounded-full")} />
          <div className={cn(block, "h-8 w-36 rounded-full")} />
          <div className={cn(block, "h-8 w-32 rounded-full")} />
        </div>
      </div>
    </Skeleton>
  );
}

/** Decorative "glass" card hinting at what the account protects. */
function SecurityCard({
  name,
  accentClass,
}: {
  name: string;
  accentClass: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      aria-hidden
      className="mx-auto w-full max-w-xs rotate-[-4deg] rounded-2xl bg-white/14 p-4 shadow-2xl shadow-black/20 ring-1 ring-white/25 backdrop-blur-md transition-transform duration-700 hover:rotate-0"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-white/20">
          <FingerprintIcon className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{t("Verified")}</span>
          <span className="text-xs opacity-75">
            {t("Signed in to {{name}}", { name })}
          </span>
        </div>
        <span
          className={cn(
            "ms-auto flex size-6 items-center justify-center rounded-full bg-white",
            accentClass,
          )}
        >
          <ShieldCheckIcon className="size-3.5" />
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <span className="h-2 w-4/5 rounded-full bg-white/25" />
        <span className="h-2 w-3/5 rounded-full bg-white/15" />
      </div>
    </div>
  );
}

function BrandingError({ error }: { error: Error }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-xs/5">
      <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <CircleAlertIcon className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold">{t("We can't reach the server")}</h1>
        <p className="text-sm break-words text-muted-foreground">
          {error.message}
        </p>
      </div>
      <Button variant="outline" onClick={() => window.location.reload()}>
        <RefreshCcwIcon />
        {t("Try again")}
      </Button>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
