import {
  LaptopIcon,
  LogOutIcon,
  MonitorSmartphoneIcon,
  SmartphoneIcon,
  TabletIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  SettingsCard,
  SettingsRow,
  SettingsRowSkeleton,
  StatusPill,
} from "@/components/Settings";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/contexts/Confirm";
import { useSessions } from "@/hooks/useAccountData";
import { authClient } from "@/lib/auth";
import { formatDate, parseUserAgent } from "@/lib/utils";
import type { TDeviceInfo } from "@/typings";

const DEVICE_ICONS = {
  mobile: SmartphoneIcon,
  tablet: TabletIcon,
  desktop: LaptopIcon,
};

export function DeviceSessions() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { data: current } = authClient.useSession();
  const { data: sessions, isLoading, mutate } = useSessions();

  const currentToken = current?.session.token;
  const sorted = [...(sessions ?? [])].sort((a, b) => {
    if (a.token === currentToken) return -1;
    if (b.token === currentToken) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  const otherCount = sorted.filter((s) => s.token !== currentToken).length;

  const revoke = (token: string, label: string) =>
    confirm({
      title: t("Sign out of this device?"),
      description: t("{{device}} will need to sign in again.", {
        device: label,
      }),
      confirmLabel: t("Sign out"),
      destructive: true,
      onConfirm: async () => {
        const { error } = await authClient.revokeSession({ token });
        if (error) {
          toast.error(error.message);
          return false;
        }
        await mutate();
      },
    });

  const revokeOthers = () =>
    confirm({
      title: t("Sign out of all other devices?"),
      description: t(
        "Every device except this one will need to sign in again.",
      ),
      confirmLabel: t("Sign out everywhere else"),
      destructive: true,
      onConfirm: async () => {
        const { error } = await authClient.revokeOtherSessions();
        if (error) {
          toast.error(error.message);
          return false;
        }
        toast.success(t("Signed out of other devices"));
        await mutate();
      },
    });

  return (
    <SettingsCard
      title={t("Your devices")}
      description={t("Where you're signed in right now.")}
      action={
        otherCount > 0 && (
          <Button variant="outline" size="sm" onClick={revokeOthers}>
            <LogOutIcon />
            {t("Sign out everywhere else")}
          </Button>
        )
      }
    >
      {isLoading ? (
        <>
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
        </>
      ) : sorted.length === 0 ? (
        <SettingsRow
          icon={MonitorSmartphoneIcon}
          title={t("No active sessions")}
        />
      ) : (
        sorted.map((session) => {
          const { browser, os, deviceType } = parseUserAgent(
            session.userAgent ?? "",
          );
          const device = (session as typeof session & { device?: TDeviceInfo })
            .device;
          const isCurrent = session.token === currentToken;
          const Icon = DEVICE_ICONS[deviceType];

          const name = device?.model
            ? `${device.model}`
            : [os, browser].filter((v) => v !== "Unknown").join(" · ") ||
              t("Unknown device");

          const details = [
            device?.model && browser !== "Unknown" ? browser : null,
            session.ipAddress,
            isCurrent
              ? t("Active now")
              : t("Last active {{time}}", {
                  time: formatDate(session.updatedAt, "timeAgo"),
                }),
          ].filter(Boolean);

          return (
            <SettingsRow
              key={session.id}
              icon={Icon}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {name}
                  {isCurrent && (
                    <StatusPill tone="primary">{t("This device")}</StatusPill>
                  )}
                </span>
              }
              description={details.join(" · ")}
              action={
                !isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revoke(session.token, name)}
                  >
                    {t("Sign out")}
                  </Button>
                )
              }
            />
          );
        })
      )}
    </SettingsCard>
  );
}
