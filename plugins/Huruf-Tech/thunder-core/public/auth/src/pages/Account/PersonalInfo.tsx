import {
  CakeIcon,
  ImageIcon,
  MailIcon,
  PencilIcon,
  UserRoundIcon,
  VenusAndMarsIcon,
} from "lucide-react";
import React from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { UserAvatar } from "@/components/UserAvatar";
import {
  SectionHeader,
  SettingsCard,
  SettingsRow,
  StatusPill,
} from "@/components/Settings";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useResendVerification } from "@/hooks/useResendVerification";
import { authClient, type TUser } from "@/lib/auth";
import { features } from "@/lib/features";
import { Gender } from "@/lib/globals";
import { formatDate, formatDateForInput, getInitials } from "@/lib/utils";

function PersonalInfo() {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  const [editing, setEditing] = React.useState(false);
  const { state: verifyState, resend } = useResendVerification();

  if (!session) return null;
  const { user } = session;

  const updateImage = async (image: string | null) => {
    const { error } = await authClient.updateUser({ image });
    if (error) toast.error(error.message);
    else
      toast.success(
        image ? t("Profile photo updated") : t("Profile photo removed"),
      );
  };

  // Read-only profile when editing is turned off for this deployment.
  const edit = features.profileEditing ? () => setEditing(true) : undefined;

  const editButton = edit && (
    <Button variant="ghost" size="sm" onClick={edit}>
      <PencilIcon />
      {t("Edit")}
    </Button>
  );

  return (
    <>
      <SectionHeader
        title={t("Personal info")}
        description={t(
          "Your basic info, used across apps that you sign in to.",
        )}
      />

      <SettingsCard
        title={t("Profile")}
        description={t("Some of this info may be visible to other people.")}
        action={editButton}
      >
        <SettingsRow
          icon={ImageIcon}
          title={t("Profile photo")}
          description={t("A photo helps people recognize you.")}
          action={
            edit ? (
              <ImageUpload
                value={user.image}
                onChange={updateImage}
                path={[user.id, "avatar"]}
                fallback={
                  <span className="font-semibold">
                    {getInitials(user.name)}
                  </span>
                }
              />
            ) : (
              <UserAvatar
                size={56}
                name={user.name}
                email={user.email}
                image={user.image}
              />
            )
          }
          stackOnMobile
        />
        <SettingsRow
          icon={UserRoundIcon}
          title={t("Name")}
          description={user.name || t("Not set")}
          onClick={edit}
        />
        <SettingsRow
          icon={VenusAndMarsIcon}
          title={t("Gender")}
          description={
            user.gender ? (
              <span className="capitalize">{t(user.gender)}</span>
            ) : (
              t("Not set")
            )
          }
          onClick={edit}
        />
        <SettingsRow
          icon={CakeIcon}
          title={t("Birthday")}
          description={user.dob ? formatDate(user.dob, "PPP") : t("Not set")}
          onClick={edit}
        />
      </SettingsCard>

      <SettingsCard
        title={t("Contact info")}
        description={t("Used to sign in and to recover your account.")}
      >
        <SettingsRow
          icon={MailIcon}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {user.email}
              {user.emailVerified ? (
                <StatusPill tone="success">{t("Verified")}</StatusPill>
              ) : (
                <StatusPill tone="warning">{t("Unverified")}</StatusPill>
              )}
            </span>
          }
          description={
            user.emailVerified
              ? t("Your primary email address")
              : t(
                  "Verify your email to secure your account and enable recovery.",
                )
          }
          stackOnMobile
          action={
            !user.emailVerified && (
              <Button
                size="sm"
                variant="outline"
                disabled={verifyState !== "idle"}
                onClick={() => resend(user.email)}
              >
                {verifyState === "sending" && <Spinner />}
                {verifyState === "sent" ? t("Email sent") : t("Send link")}
              </Button>
            )
          }
        />
      </SettingsCard>

      {edit && (
        <EditProfileDialog
          user={user}
          open={editing}
          onOpenChange={setEditing}
        />
      )}
    </>
  );
}

type TProfileForm = {
  name: string;
  gender: string;
  dob: string;
};

function EditProfileDialog({
  user,
  open,
  onOpenChange,
}: {
  user: TUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  const { control, register, handleSubmit, formState, reset } =
    useForm<TProfileForm>({
      values: {
        name: user.name ?? "",
        gender: user.gender ?? "",
        dob: formatDateForInput(user.dob),
      },
    });

  const onSubmit: SubmitHandler<TProfileForm> = async (data) => {
    const { error } = await authClient.updateUser({
      name: data.name.trim(),
      gender: data.gender || undefined,
      dob: data.dob ? new Date(data.dob) : undefined,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t("Profile updated"));
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Edit profile")}</DialogTitle>
          <DialogDescription>
            {t("Update your personal details.")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="contents">
          <DialogPanel>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="name">{t("Full name")}</FieldLabel>
                <Input
                  id="name"
                  autoComplete="name"
                  aria-invalid={!!formState.errors.name || undefined}
                  {...register("name", {
                    validate: (value) =>
                      !!value.trim() || t("Name is required!"),
                  })}
                />
                <FieldError>{formState.errors.name?.message}</FieldError>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="gender">{t("Gender")}</FieldLabel>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        id="gender"
                        value={field.value || null}
                        onValueChange={(value) => field.onChange(value ?? "")}
                        items={Object.values(Gender).map((g) => ({
                          label: t(g),
                          value: g,
                        }))}
                      >
                        <SelectTrigger className="w-full capitalize">
                          <SelectValue placeholder={t("Select")} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Gender).map((g) => (
                            <SelectItem
                              key={g}
                              value={g}
                              className="capitalize"
                            >
                              {t(g)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="dob">{t("Birthday")}</FieldLabel>
                  <Input
                    id="dob"
                    type="date"
                    max={formatDateForInput(new Date())}
                    {...register("dob", {
                      validate: (value) =>
                        !value ||
                        new Date(value) <= new Date() ||
                        t("Birthday can't be in the future"),
                    })}
                  />
                  <FieldError>{formState.errors.dob?.message}</FieldError>
                </Field>
              </div>
            </FieldGroup>
          </DialogPanel>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={formState.isSubmitting || !formState.isDirty}
            >
              {formState.isSubmitting && <Spinner />}
              {t("Save changes")}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

export default PersonalInfo;
