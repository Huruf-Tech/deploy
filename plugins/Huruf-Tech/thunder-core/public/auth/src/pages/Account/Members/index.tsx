import { CrownIcon, MailIcon, Trash2Icon, UsersIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ThunderSDK } from "thunder-sdk";
import CopyToClipboard from "@/components/CopyToClipboard";
import { EmptyState } from "@/components/EmptyState";
import {
  SectionHeader,
  SettingsCard,
  SettingsRow,
  SettingsRowSkeleton,
  StatusPill,
} from "@/components/Settings";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useConfirm } from "@/contexts/Confirm";
import { useMyPolicies } from "@/hooks/useMyPolicies";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { authClient } from "@/lib/auth";
import { tenantScope } from "@/lib/sdk";
import { formatDate, resolveURL } from "@/lib/utils";
import { CreateInvite } from "./CreateInvite";

export function Members({ tenantId }: { tenantId: string }) {
  const { t } = useTranslation();
  const invites = usePaginatedList(
    ["tenantInvites", tenantId],
    async (query) =>
      await ThunderSDK.tenantInvites.get({
        params: {},
        query,
        ...tenantScope(tenantId),
      }),
  );

  return (
    <>
      <SectionHeader
        title={t("Members")}
        description={t(
          "Invite people to this workspace and manage their roles.",
        )}
      />

      <SettingsCard
        title={t("Invite a teammate")}
        description={t("They'll get an email with a link to join.")}
      >
        <CreateInvite
          tenantId={tenantId}
          onSuccess={() => void invites.mutate()}
        />
      </SettingsCard>

      <MemberList tenantId={tenantId} />
      <InviteList tenantId={tenantId} list={invites} />
    </>
  );
}

function MemberList({ tenantId }: { tenantId: string }) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { data: session } = authClient.useSession();
  const { myPolicies } = useMyPolicies(tenantId);
  const [updating, setUpdating] = React.useState<string | null>(null);

  const {
    items: members,
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
    mutate,
  } = usePaginatedList(
    ["tenantMembers", tenantId],
    async (query) =>
      await ThunderSDK.tenantMembers.get({
        params: {},
        query,
        ...tenantScope(tenantId),
      }),
  );

  const roles = myPolicies?.subRoles ?? [];

  const changeRole = async (id: string, role: string) => {
    setUpdating(id);
    try {
      await ThunderSDK.tenantMembers.update({
        params: { id },
        body: { role },
        ...tenantScope(tenantId),
      });
      toast.success(t("Role updated"));
      await mutate();
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(null);
    }
  };

  const remove = (id: string, email: string) =>
    confirm({
      title: t("Remove {{email}}?", { email }),
      description: t("They'll lose access to this workspace immediately."),
      confirmLabel: t("Remove member"),
      destructive: true,
      onConfirm: async () => {
        await ThunderSDK.tenantMembers.del({
          params: { id },
          ...tenantScope(tenantId),
        });
        toast.success(t("Member removed"));
        await mutate();
      },
    });

  return (
    <SettingsCard
      title={t("People")}
      description={t("Everyone with access to this workspace.")}
    >
      {isLoading ? (
        <>
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
        </>
      ) : members.length === 0 ? (
        <div className="p-2">
          <EmptyState
            icon={UsersIcon}
            title={t("No members yet")}
            description={t("Invite your first teammate above.")}
            className="py-8"
          />
        </div>
      ) : (
        <>
          {members.map((member) => {
            const isSelf = member.user === session?.user.id;
            const email = member.email ?? t("Unknown");
            // Only the person who added a member may change or remove them.
            const canManage =
              !member.isOwner &&
              !isSelf &&
              member.createdBy === session?.user.id;

            return (
              <SettingsRow
                key={member._id}
                media={<UserAvatar size={36} email={member.email} />}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {email}
                    {isSelf && <StatusPill>{t("You")}</StatusPill>}
                    {member.isOwner && (
                      <StatusPill tone="warning">
                        <CrownIcon />
                        {t("Owner")}
                      </StatusPill>
                    )}
                  </span>
                }
                description={t("Joined {{date}}", {
                  date: formatDate(member.createdAt, "PP"),
                })}
                stackOnMobile={canManage}
                action={
                  <>
                    {!member.isOwner &&
                      (canManage && roles.length > 0 ? (
                        <Select
                          value={member.role ?? null}
                          onValueChange={(role) =>
                            role &&
                            role !== member.role &&
                            changeRole(member._id, role)
                          }
                          disabled={updating === member._id}
                          items={roles.map((role) => ({
                            label: role,
                            value: role,
                          }))}
                        >
                          <SelectTrigger
                            size="sm"
                            className="w-32 capitalize"
                            aria-label={t("Role")}
                          >
                            {updating === member._id && <Spinner />}
                            <SelectValue placeholder={t("Role")} />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem
                                key={role}
                                value={role}
                                className="capitalize"
                              >
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        member.role && (
                          <StatusPill className="capitalize">
                            {member.role}
                          </StatusPill>
                        )
                      ))}
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("Remove member")}
                        onClick={() => remove(member._id, email)}
                      >
                        <Trash2Icon />
                      </Button>
                    )}
                  </>
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
    </SettingsCard>
  );
}

function InviteList({
  tenantId,
  list,
}: {
  tenantId: string;
  list: ReturnType<
    typeof usePaginatedList<
      Awaited<
        ReturnType<typeof ThunderSDK.tenantInvites.get>
      >["results"][number]
    >
  >;
}) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const {
    items: invites,
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
    mutate,
  } = list;

  const revoke = (id: string, email: string) =>
    confirm({
      title: t("Revoke invitation?"),
      description: t("The invite link sent to {{email}} will stop working.", {
        email,
      }),
      confirmLabel: t("Revoke"),
      destructive: true,
      onConfirm: async () => {
        await ThunderSDK.tenantInvites.del({
          params: { id },
          ...tenantScope(tenantId),
        });
        toast.success(t("Invitation revoked"));
        await mutate();
      },
    });

  if (!isLoading && invites.length === 0) return null;

  return (
    <SettingsCard
      title={t("Pending invitations")}
      description={t("People who haven't accepted their invite yet.")}
    >
      {isLoading ? (
        <SettingsRowSkeleton />
      ) : (
        <>
          {invites.map((invite) => (
            <SettingsRow
              key={invite._id}
              icon={MailIcon}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {invite.email}
                  <StatusPill tone="info" className="capitalize">
                    {invite.role}
                  </StatusPill>
                </span>
              }
              description={
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <CopyToClipboard
                    text={resolveURL(`invite/${invite._id}`)}
                    label={t("Copy invite link")}
                  />
                  {t("Sent {{time}}", {
                    time: formatDate(invite.createdAt, "timeAgo"),
                  })}
                </span>
              }
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revoke(invite._id, invite.email)}
                >
                  {t("Revoke")}
                </Button>
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
    </SettingsCard>
  );
}
