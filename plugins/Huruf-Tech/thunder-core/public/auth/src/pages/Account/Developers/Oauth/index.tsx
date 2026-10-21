import {
  AppWindowIcon,
  EllipsisIcon,
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { generateSecret, getInitials, transformImage } from "@/lib/utils";
import { SecretDialog } from "../SecretDialog";
import { ClientDialog, type TOAuthClient } from "./ClientDialog";

function OAuthClients() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [dialog, setDialog] = React.useState<{ client?: TOAuthClient } | null>(
    null,
  );
  const [secret, setSecret] = React.useState<string | null>(null);

  const {
    items: clients,
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
    mutate,
  } = usePaginatedList(
    ["oauthClients"],
    async (query) => await ThunderSDK.oauthClients.get({ params: {}, query }),
  );

  const remove = (client: TOAuthClient) =>
    confirm({
      title: t("Delete {{name}}?", { name: client.name }),
      description: t(
        "Apps using this client will immediately stop being able to sign users in. This can't be undone.",
      ),
      confirmText: client.name,
      confirmLabel: t("Delete app"),
      destructive: true,
      onConfirm: async () => {
        await ThunderSDK.oauthClients.del({ params: { id: client._id } });
        toast.success(t("App deleted"));
        await mutate();
      },
    });

  const rotateSecret = (client: TOAuthClient) =>
    confirm({
      title: t("Generate a new client secret?"),
      description: t(
        "The current secret stops working immediately. Update your server with the new one right away.",
      ),
      confirmLabel: t("Generate new secret"),
      destructive: true,
      onConfirm: async () => {
        const next = generateSecret(48);
        await ThunderSDK.oauthClients.update({
          params: { id: client._id },
          body: { secret: next },
        });
        setSecret(next);
      },
    });

  const createButton = (
    <Button size="sm" onClick={() => setDialog({})}>
      <PlusIcon />
      {t("New app")}
    </Button>
  );

  return (
    <SettingsCard
      title={t("OAuth apps")}
      description={t(
        "Applications that can sign users in with this account system.",
      )}
      action={clients.length > 0 && createButton}
    >
      {isLoading ? (
        <>
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
        </>
      ) : clients.length === 0 ? (
        <div className="p-2">
          <EmptyState
            icon={AppWindowIcon}
            title={t("No OAuth apps yet")}
            description={t(
              "Create an app to add “Sign in with your account” to your own products.",
            )}
            action={createButton}
            className="py-8"
          />
        </div>
      ) : (
        <>
          {clients.map((client) => (
            <SettingsRow
              key={client._id}
              media={
                <Avatar className="size-10 rounded-xl ring-1 ring-foreground/8">
                  {client.logo && (
                    <AvatarImage
                      src={transformImage(client.logo)}
                      alt={client.name}
                    />
                  )}
                  <AvatarFallback className="rounded-[inherit] bg-muted text-xs font-semibold">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
              }
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {client.name}
                  <StatusPill
                    tone={client.type === "confidential" ? "warning" : "info"}
                  >
                    {t(
                      client.type === "confidential"
                        ? "Confidential"
                        : "Public",
                    )}
                  </StatusPill>
                  {client.disabled && (
                    <StatusPill tone="danger">{t("Disabled")}</StatusPill>
                  )}
                </span>
              }
              description={
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <CopyToClipboard text={client._id} />
                  <span className="text-xs">
                    {t("{{count}} redirect URIs", {
                      count: client.redirectUris?.length ?? 0,
                    })}
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
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setDialog({ client })}>
                      <PencilIcon />
                      {t("Edit")}
                    </DropdownMenuItem>
                    {client.type === "confidential" && (
                      <DropdownMenuItem onClick={() => rotateSecret(client)}>
                        <KeyRoundIcon />
                        {t("New client secret")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => remove(client)}
                    >
                      <Trash2Icon />
                      {t("Delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}
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

      <ClientDialog
        open={!!dialog}
        client={dialog?.client}
        onOpenChange={(open) => !open && setDialog(null)}
        onSaved={(newSecret) => {
          toast.success(dialog?.client ? t("App updated") : t("App created"));
          void mutate();
          if (newSecret) setSecret(newSecret);
        }}
      />

      <SecretDialog
        secret={secret}
        title={t("Your client secret")}
        onClose={() => setSecret(null)}
      />
    </SettingsCard>
  );
}

export default OAuthClients;
