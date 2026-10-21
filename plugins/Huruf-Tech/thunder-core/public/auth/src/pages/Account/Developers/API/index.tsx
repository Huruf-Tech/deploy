import {
  EllipsisIcon,
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ThunderSDK } from "thunder-sdk";
import CopyToClipboard from "@/components/CopyToClipboard";
import { EmptyState } from "@/components/EmptyState";
import {
  SettingsCard,
  SettingsRow,
  SettingsRowSkeleton,
  StatusPill,
} from "@/components/Settings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { useConfirm } from "@/contexts/Confirm";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { formatDate } from "@/lib/utils";
import { SecretDialog } from "../SecretDialog";
import { generateApiKeySecret, KeyDialog, type TApiKey } from "./KeyDialog";

export function APIKeys() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [dialog, setDialog] = React.useState<{ apiKey?: TApiKey } | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);

  const {
    items: keys,
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
    mutate,
  } = usePaginatedList(
    ["apiKeys"],
    async (query) => await ThunderSDK.apiKeys.get({ params: {}, query }),
  );

  const remove = (key: TApiKey) =>
    confirm({
      title: t("Delete {{name}}?", { name: key.name }),
      description: t(
        "Any server using this key will immediately lose access. This can't be undone.",
      ),
      confirmLabel: t("Delete key"),
      destructive: true,
      onConfirm: async () => {
        await ThunderSDK.apiKeys.del({ params: { id: key._id } });
        toast.success(t("API key deleted"));
        await mutate();
      },
    });

  const regenerate = (key: TApiKey) =>
    confirm({
      title: t("Regenerate {{name}}?", { name: key.name }),
      description: t("The current secret stops working immediately."),
      confirmLabel: t("Regenerate"),
      destructive: true,
      onConfirm: async () => {
        const next = generateApiKeySecret();
        await ThunderSDK.apiKeys.update({
          params: { id: key._id },
          body: { secret: next },
        });
        setSecret(next);
      },
    });

  const createButton = (
    <Button size="sm" onClick={() => setDialog({})}>
      <PlusIcon />
      {t("New key")}
    </Button>
  );

  return (
    <SettingsCard
      title={t("API keys")}
      description={t("Secret keys for calling the API from your servers.")}
      action={keys.length > 0 && createButton}
    >
      {isLoading ? (
        <>
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
        </>
      ) : keys.length === 0 ? (
        <div className="p-2">
          <EmptyState
            icon={KeyRoundIcon}
            title={t("No API keys yet")}
            description={t(
              "Create a key to authenticate requests from your backend.",
            )}
            action={createButton}
            className="py-8"
          />
        </div>
      ) : (
        <>
          {keys.map((key) => {
            const expired =
              !!key.expiresAt && new Date(key.expiresAt) < new Date();
            const tenantCount = Object.keys(key.resourceGrant ?? {}).length;

            return (
              <SettingsRow
                key={key._id}
                icon={KeyRoundIcon}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {key.name}
                    {expired ? (
                      <StatusPill tone="danger">{t("Expired")}</StatusPill>
                    ) : key.expiresAt ? (
                      <StatusPill>
                        {t("Expires {{date}}", {
                          date: formatDate(key.expiresAt, "PP"),
                        })}
                      </StatusPill>
                    ) : (
                      <StatusPill>{t("No expiry")}</StatusPill>
                    )}
                  </span>
                }
                description={
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <CopyToClipboard text={key._id} />
                    <span>
                      {tenantCount > 0
                        ? t("{{count}} tenants", { count: tenantCount })
                        : (key.scopes ?? []).join(", ") || t("No scopes")}
                    </span>
                    <span>
                      {key.lastAccessAt
                        ? t("Last used {{time}} · {{count}} requests", {
                            time: formatDate(key.lastAccessAt, "timeAgo"),
                            count: key.accessCount ?? 0,
                          })
                        : t("Never used")}
                    </span>
                  </span>
                }
                action={
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("Options")}
                        />
                      }
                    >
                      <EllipsisIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={() => setDialog({ apiKey: key })}
                      >
                        <PencilIcon />
                        {t("Edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => regenerate(key)}>
                        <RefreshCwIcon />
                        {t("Regenerate")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => remove(key)}
                      >
                        <Trash2Icon />
                        {t("Delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              />
            );
          })}
          {hasMore && (
            <div className="flex justify-center p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore && <Spinner />}
                {t("Load more")}
              </Button>
            </div>
          )}
        </>
      )}

      <KeyDialog
        open={!!dialog}
        apiKey={dialog?.apiKey}
        onOpenChange={(open) => !open && setDialog(null)}
        onSaved={(newSecret) => {
          toast.success(
            dialog?.apiKey ? t("API key updated") : t("API key created"),
          );
          void mutate();
          if (newSecret) setSecret(newSecret);
        }}
      />

      <SecretDialog
        secret={secret}
        title={t("Your API key")}
        onClose={() => setSecret(null)}
      />
    </SettingsCard>
  );
}
