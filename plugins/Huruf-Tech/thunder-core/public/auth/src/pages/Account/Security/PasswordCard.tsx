import { AsteriskIcon } from "lucide-react";
import React from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PasswordInput } from "@/components/form/PasswordInput";
import {
  PasswordStrength,
  validatePassword,
} from "@/components/form/PasswordStrength";
import {
  SettingsCard,
  SettingsRow,
  SettingsRowSkeleton,
} from "@/components/Settings";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useLinkedAccounts, useSessions } from "@/hooks/useAccountData";
import { authClient } from "@/lib/auth";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";
import { formatDate, resolveURL } from "@/lib/utils";

export function PasswordCard() {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  const { data: accounts, isLoading } = useLinkedAccounts();
  const [open, setOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const credential = accounts?.find((a) => a.providerId === "credential");

  // Accounts created through a social provider have no password yet; the
  // reset flow creates one.
  const sendSetupLink = async () => {
    if (!session) return;
    setSending(true);
    const { error } = await authClient.requestPasswordReset({
      email: session.user.email,
      redirectTo: resolveURL(
        withSearch("/change-password", { omit: TRANSIENT_PARAMS }),
      ),
    });
    setSending(false);

    if (error) toast.error(error.message);
    else
      toast.success(t("Check your inbox"), {
        description: t("We sent you a link to set your password."),
      });
  };

  return (
    <SettingsCard
      title={t("Password")}
      description={t("Use a strong password you don't reuse elsewhere.")}
    >
      {isLoading ? (
        <SettingsRowSkeleton />
      ) : credential ? (
        <SettingsRow
          icon={AsteriskIcon}
          title={<span className="tracking-[0.2em]">••••••••••</span>}
          description={t("Last changed {{date}}", {
            date: formatDate(
              credential.updatedAt ?? credential.createdAt,
              "PP",
            ),
          })}
          action={
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              {t("Change password")}
            </Button>
          }
        />
      ) : (
        <SettingsRow
          icon={AsteriskIcon}
          title={t("No password set")}
          description={t(
            "You sign in with a connected account. Add a password as a backup.",
          )}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={sendSetupLink}
              disabled={sending}
            >
              {sending && <Spinner />}
              {t("Set password")}
            </Button>
          }
        />
      )}

      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </SettingsCard>
  );
}

type TChangePassword = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  revokeOtherSessions: boolean;
};

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { mutate: refreshSessions } = useSessions();
  const { mutate: refreshAccounts } = useLinkedAccounts();

  const { control, register, handleSubmit, formState, watch, reset, setError } =
    useForm<TChangePassword>({
      defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        revokeOtherSessions: true,
      },
    });
  const newPassword = watch("newPassword");

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const onSubmit: SubmitHandler<TChangePassword> = async (data) => {
    const { error } = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: data.revokeOtherSessions,
    });

    if (error) {
      if (error.status === 400 || error.status === 401)
        setError("currentPassword", { message: error.message });
      else toast.error(error.message);
      return;
    }

    toast.success(t("Password changed"));
    void refreshSessions();
    void refreshAccounts();
    close();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Change password")}</DialogTitle>
          <DialogDescription>
            {t("You'll use your new password the next time you sign in.")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="contents">
          <DialogPanel>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="currentPassword">
                  {t("Current password")}
                </FieldLabel>
                <PasswordInput
                  id="currentPassword"
                  autoFocus
                  aria-invalid={!!formState.errors.currentPassword || undefined}
                  {...register("currentPassword", {
                    required: t("Password is required!"),
                  })}
                />
                <FieldError>
                  {formState.errors.currentPassword?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="newPassword">
                  {t("New password")}
                </FieldLabel>
                <PasswordInput
                  id="newPassword"
                  autoComplete="new-password"
                  aria-invalid={!!formState.errors.newPassword || undefined}
                  {...register("newPassword", {
                    validate: validatePassword(t),
                  })}
                />
                <FieldError>{formState.errors.newPassword?.message}</FieldError>
                <PasswordStrength password={newPassword} />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmNewPassword">
                  {t("Confirm new password")}
                </FieldLabel>
                <PasswordInput
                  id="confirmNewPassword"
                  autoComplete="new-password"
                  aria-invalid={!!formState.errors.confirmPassword || undefined}
                  {...register("confirmPassword", {
                    validate: (value) =>
                      value === newPassword || t("Passwords don't match"),
                  })}
                />
                <FieldError>
                  {formState.errors.confirmPassword?.message}
                </FieldError>
              </Field>

              <Controller
                name="revokeOtherSessions"
                control={control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      id="revokeOtherSessions"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label
                      htmlFor="revokeOtherSessions"
                      className="font-normal"
                    >
                      {t("Sign out of all other devices")}
                    </Label>
                  </Field>
                )}
              />
            </FieldGroup>
          </DialogPanel>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Spinner />}
              {t("Change password")}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
