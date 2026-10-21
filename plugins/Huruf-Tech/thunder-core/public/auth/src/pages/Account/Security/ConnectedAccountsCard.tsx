import { AsteriskIcon, LinkIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  SettingsCard,
  SettingsRow,
  SettingsRowSkeleton,
  StatusPill,
} from "@/components/Settings";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useConfirm } from "@/contexts/Confirm";
import { useLinkedAccounts } from "@/hooks/useAccountData";
import { authClient } from "@/lib/auth";
import { withSearch } from "@/lib/navigation";
import { authProviders, isProviderId, type TProviderId } from "@/lib/providers";
import { cn, formatDate, resolveURL } from "@/lib/utils";
import { useEnabledProviders } from "../../Login/SocialButtons";

export function ConnectedAccountsCard() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const enabledProviders = useEnabledProviders();
  const { data: accounts, isLoading, mutate } = useLinkedAccounts();
  const [linking, setLinking] = React.useState<TProviderId | null>(null);

  const linked = new Set(accounts?.map((a) => a.providerId));
  const available = enabledProviders.filter((id) => !linked.has(id));

  // Nothing to show when only passwords are supported.
  if (!isLoading && enabledProviders.length === 0) return null;

  const link = async (provider: TProviderId) => {
    setLinking(provider);
    const { error } = await authClient.linkSocial({
      provider,
      callbackURL: resolveURL(
        withSearch("/account", { set: { tab: "security" } }),
      ),
    });

    if (error) {
      setLinking(null);
      toast.error(error.message);
    }
  };

  const unlink = (providerId: string, accountId: string, label: string) =>
    confirm({
      title: t("Disconnect {{provider}}?", { provider: label }),
      description: t(
        "You won't be able to sign in with {{provider}} anymore.",
        {
          provider: label,
        },
      ),
      confirmLabel: t("Disconnect"),
      destructive: true,
      onConfirm: async () => {
        const { error } = await authClient.unlinkAccount({
          providerId,
          accountId,
        });
        if (error) {
          toast.error(error.message);
          return false;
        }
        await mutate();
      },
    });

  return (
    <SettingsCard
      title={t("Connected accounts")}
      description={t("Sign in faster with the accounts you already use.")}
    >
      {isLoading ? (
        <SettingsRowSkeleton />
      ) : (
        <>
          {accounts?.map((account) => {
            const provider = isProviderId(account.providerId)
              ? authProviders[account.providerId]
              : null;
            const isCredential = account.providerId === "credential";
            const label = isCredential
              ? t("Email & password")
              : (provider?.label ?? account.providerId);

            return (
              <SettingsRow
                key={account.id}
                media={<ProviderIcon providerId={account.providerId} />}
                title={
                  <span className="flex items-center gap-2">
                    {label}
                    <StatusPill tone="success">{t("Connected")}</StatusPill>
                  </span>
                }
                description={t("Connected {{date}}", {
                  date: formatDate(account.createdAt, "PP"),
                })}
                action={
                  !isCredential && (
                    <Button
                      variant="ghost"
                      size="sm"
                      // Keep at least one way to sign in.
                      disabled={(accounts?.length ?? 0) <= 1}
                      onClick={() =>
                        unlink(account.providerId, account.accountId, label)
                      }
                    >
                      {t("Disconnect")}
                    </Button>
                  )
                }
              />
            );
          })}

          {available.map((id) => (
            <SettingsRow
              key={id}
              media={<ProviderIcon providerId={id} muted />}
              title={authProviders[id].label}
              description={t("Not connected")}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={linking !== null}
                  onClick={() => link(id)}
                >
                  {linking === id ? <Spinner /> : <LinkIcon />}
                  {t("Connect")}
                </Button>
              }
            />
          ))}
        </>
      )}
    </SettingsCard>
  );
}

function ProviderIcon({
  providerId,
  muted,
}: {
  providerId: string;
  muted?: boolean;
}) {
  const provider = isProviderId(providerId) ? authProviders[providerId] : null;

  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background",
        muted && "opacity-70 grayscale",
      )}
    >
      {provider ? (
        <img
          src={provider.icon}
          alt=""
          className={cn("size-4.5", provider.invert && "dark:invert")}
        />
      ) : (
        <AsteriskIcon className="size-4 text-muted-foreground" />
      )}
    </div>
  );
}
