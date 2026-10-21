import {
  EllipsisIcon,
  FingerprintIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import React from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import {
  SettingsCard,
  SettingsRow,
  SettingsRowSkeleton,
} from "@/components/Settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useConfirm } from "@/contexts/Confirm";
import { usePasskeys } from "@/hooks/useAccountData";
import { authClient } from "@/lib/auth";
import { formatDate, parseUserAgent } from "@/lib/utils";

const CANCELLED_CODES = new Set(["AUTH_CANCELLED", "ERROR_CEREMONY_ABORTED"]);

/** A sensible default name, e.g. "Chrome on macOS". */
function defaultPasskeyName() {
  const { browser, os } = parseUserAgent(navigator.userAgent);
  return [browser, os].filter((v) => v !== "Unknown").join(" on ") || "Passkey";
}

export function PasskeysCard() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { data: passkeys, isLoading, mutate } = usePasskeys();
  const [adding, setAdding] = React.useState(false);
  const [renaming, setRenaming] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  const addPasskey = async () => {
    setAdding(true);
    const { error } = await authClient.passkey.addPasskey({
      name: defaultPasskeyName(),
    });
    setAdding(false);

    if (error) {
      if (!CANCELLED_CODES.has((error as { code?: string }).code ?? ""))
        toast.error(error.message);
      return;
    }

    toast.success(t("Passkey added"));
    void mutate();
  };

  const remove = (id: string, name: string) =>
    confirm({
      title: t("Remove passkey?"),
      description: t(
        "You won't be able to sign in with “{{name}}” anymore. The passkey may still appear in your password manager until you delete it there.",
        { name },
      ),
      confirmLabel: t("Remove"),
      destructive: true,
      onConfirm: async () => {
        const { error } = await authClient.passkey.deletePasskey({ id });
        if (error) {
          toast.error(error.message);
          return false;
        }
        toast.success(t("Passkey removed"));
        await mutate();
      },
    });

  const addButton = (
    <Button size="sm" variant="outline" onClick={addPasskey} disabled={adding}>
      {adding ? <Spinner /> : <PlusIcon />}
      {t("Add passkey")}
    </Button>
  );

  return (
    <SettingsCard
      title={t("Passkeys")}
      description={t(
        "Sign in with your fingerprint, face or screen lock instead of a password.",
      )}
      action={(passkeys?.length ?? 0) > 0 && addButton}
    >
      {isLoading ? (
        <SettingsRowSkeleton />
      ) : !passkeys?.length ? (
        <div className="p-2">
          <EmptyState
            icon={FingerprintIcon}
            title={t("No passkeys yet")}
            description={t(
              "Passkeys are a safer, faster alternative to passwords and can't be phished.",
            )}
            action={addButton}
            className="py-8"
          />
        </div>
      ) : (
        passkeys.map((passkey) => {
          const name = passkey.name || t("Unnamed passkey");
          return (
            <SettingsRow
              key={passkey.id}
              icon={FingerprintIcon}
              title={name}
              description={t("Added {{date}}", {
                date: formatDate(passkey.createdAt, "PP"),
              })}
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
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() =>
                        setRenaming({
                          id: passkey.id,
                          name: passkey.name ?? "",
                        })
                      }
                    >
                      <PencilIcon />
                      {t("Rename")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => remove(passkey.id, name)}
                    >
                      <Trash2Icon />
                      {t("Remove")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          );
        })
      )}

      <RenamePasskeyDialog
        passkey={renaming}
        onClose={() => setRenaming(null)}
        onRenamed={() => void mutate()}
      />
    </SettingsCard>
  );
}

function RenamePasskeyDialog({
  passkey,
  onClose,
  onRenamed,
}: {
  passkey: { id: string; name: string } | null;
  onClose: () => void;
  onRenamed: () => void;
}) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState } = useForm({
    values: { name: passkey?.name ?? "" },
  });

  const onSubmit: SubmitHandler<{ name: string }> = async ({ name }) => {
    if (!passkey) return;
    const { error } = await authClient.passkey.updatePasskey({
      id: passkey.id,
      name: name.trim(),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    onRenamed();
    onClose();
  };

  return (
    <Dialog open={!!passkey} onOpenChange={(open) => !open && onClose()}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("Rename passkey")}</DialogTitle>
          <DialogDescription>
            {t("Pick a name that helps you recognize the device.")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="contents">
          <DialogPanel>
            <Field>
              <FieldLabel htmlFor="passkey-name">{t("Name")}</FieldLabel>
              <Input
                id="passkey-name"
                autoFocus
                maxLength={64}
                aria-invalid={!!formState.errors.name || undefined}
                {...register("name", {
                  validate: (value) => !!value.trim() || t("Name is required!"),
                })}
              />
              <FieldError>{formState.errors.name?.message}</FieldError>
            </Field>
          </DialogPanel>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Spinner />}
              {t("Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
