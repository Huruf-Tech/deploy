import {
  BadgeCheckIcon,
  ChevronRightIcon,
  FingerprintIcon,
  MailWarningIcon,
  MonitorSmartphoneIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SettingsCard, SettingsRow, StatusPill } from "@/components/Settings";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { usePasskeys, useSessions } from "@/hooks/useAccountData";
import { useAppBranding } from "@/hooks/useAppBranding";
import { useCapabilities } from "@/hooks/useCapabilities";
import { authClient } from "@/lib/auth";
import { features } from "@/lib/features";
import { cn, formatDate } from "@/lib/utils";

function Overview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { t } = useTranslation();
  const { appName } = useAppBranding();
  const { has } = useCapabilities();
  const { data: session } = authClient.useSession();

  const { data: passkeys, isLoading: loadingPasskeys } = usePasskeys();
  const { data: sessions } = useSessions();

  if (!session) return null;
  const { user } = session;

  const checks = [
    {
      done: user.emailVerified,
      label: t("Verify your email address"),
      icon: MailWarningIcon,
      tab: "personal",
    },
    has("2fa") && {
      done: !!user.twoFactorEnabled,
      label: t("Turn on 2-step verification"),
      icon: ShieldIcon,
      tab: "security",
    },
    has("passkey") && {
      done: (passkeys?.length ?? 0) > 0,
      label: t("Add a passkey for faster, phishing-resistant sign in"),
      icon: FingerprintIcon,
      tab: "security",
      loading: loadingPasskeys,
    },
  ].filter(Boolean) as {
    done: boolean;
    label: string;
    icon: typeof ShieldIcon;
    tab: string;
    loading?: boolean;
  }[];

  const completed = checks.filter((c) => c.done).length;
  const score = checks.length
    ? Math.round((completed / checks.length) * 100)
    : 100;
  const pending = checks.filter((c) => !c.done && !c.loading);

  return (
    <>
      {/* Profile hero */}
      <section className="relative isolate overflow-hidden rounded-3xl border bg-card p-6 shadow-xs/5 sm:p-8">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-1 h-28 bg-[radial-gradient(100%_100%_at_0%_0%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_70%)]"
        />
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <UserAvatar
            size={76}
            name={user.name}
            email={user.email}
            image={user.image}
            className="ring-4 ring-card"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-sm text-muted-foreground">{t("Welcome,")}</p>
            <h1 className="truncate text-2xl font-semibold sm:text-3xl">
              {user.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{user.email}</span>
              {user.emailVerified ? (
                <StatusPill tone="success">
                  <BadgeCheckIcon />
                  {t("Verified")}
                </StatusPill>
              ) : (
                <StatusPill tone="warning">{t("Unverified")}</StatusPill>
              )}
            </div>
          </div>
        </div>
        <p className="mt-6 max-w-xl text-sm text-muted-foreground">
          {t(
            "Manage your info, privacy and security to make {{name}} work better for you.",
            { name: appName },
          )}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Security checkup */}
        <SettingsCard
          title={t("Security checkup")}
          description={
            pending.length === 0
              ? t("Your account is well protected.")
              : t("{{count}} recommended actions", { count: pending.length })
          }
          action={<ScoreRing value={score} />}
        >
          {checks.map((check) => (
            <SettingsRow
              key={check.label}
              icon={check.done ? ShieldCheckIcon : check.icon}
              title={check.label}
              description={check.done ? undefined : t("Recommended")}
              onClick={check.done ? undefined : () => onNavigate(check.tab)}
              className={cn(check.done && "opacity-70")}
              action={
                check.loading ? (
                  <Skeleton className="h-5 w-12 rounded-full" />
                ) : check.done ? (
                  <StatusPill tone="success">{t("Done")}</StatusPill>
                ) : (
                  <ChevronRightIcon className="size-4 text-muted-foreground rtl:rotate-180" />
                )
              }
            />
          ))}
        </SettingsCard>

        {/* Shortcuts */}
        <SettingsCard title={t("Quick links")}>
          <SettingsRow
            icon={UserRoundIcon}
            title={t("Personal info")}
            description={t("Name, photo and birthday")}
            onClick={() => onNavigate("personal")}
            action={
              <ChevronRightIcon className="size-4 text-muted-foreground rtl:rotate-180" />
            }
          />
          <SettingsRow
            icon={ShieldIcon}
            title={t("Security")}
            description={t("Password, passkeys and 2-step verification")}
            onClick={() => onNavigate("security")}
            action={
              <ChevronRightIcon className="size-4 text-muted-foreground rtl:rotate-180" />
            }
          />
          {features.deviceSessions && (
            <SettingsRow
              icon={MonitorSmartphoneIcon}
              title={t("Your devices")}
              description={
                sessions
                  ? t("{{count}} active sessions", { count: sessions.length })
                  : t("Where you're signed in")
              }
              onClick={() => onNavigate("security")}
              action={
                <ChevronRightIcon className="size-4 text-muted-foreground rtl:rotate-180" />
              }
            />
          )}
        </SettingsCard>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("Member since {{date}}", {
          date: formatDate(user.createdAt, "MMMM yyyy"),
        })}
      </p>
    </>
  );
}

function ScoreRing({ value }: { value: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex size-12 items-center justify-center">
      <svg
        viewBox="0 0 44 44"
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          className="stroke-muted"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className={cn(
            "transition-[stroke-dashoffset] duration-700",
            value === 100 ? "stroke-success" : "stroke-primary",
          )}
        />
      </svg>
      <span className="text-xs font-semibold">{value}%</span>
    </div>
  );
}

export default Overview;
