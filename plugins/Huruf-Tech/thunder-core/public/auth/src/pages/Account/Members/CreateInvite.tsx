import { SendIcon } from "lucide-react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ThunderSDK } from "thunder-sdk";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useMyPolicies } from "@/hooks/useMyPolicies";
import { tenantScope } from "@/lib/sdk";
import { isValidEmail, resolveURL } from "@/lib/utils";

type TInviteForm = { email: string; role: string };

export function CreateInvite({
  tenantId,
  onSuccess,
}: {
  tenantId: string;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();
  const { myPolicies, isLoading } = useMyPolicies(tenantId);
  const roles = myPolicies?.subRoles ?? [];

  const { control, register, handleSubmit, reset, formState } =
    useForm<TInviteForm>({
      defaultValues: { email: "", role: "" },
    });

  const onSubmit: SubmitHandler<TInviteForm> = async ({ email, role }) => {
    try {
      await ThunderSDK.tenantInvites.create({
        body: {
          email: email.trim(),
          role,
          // The server substitutes the invite id into this template.
          url: resolveURL("invite/{{_id}}"),
        },
        ...tenantScope(tenantId),
      });
      toast.success(t("Invitation sent to {{email}}", { email }));
      reset({ email: "", role });
      onSuccess?.();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-2 px-3 pt-1 pb-3"
    >
      <FieldLabel htmlFor="invite-email" className="sr-only">
        {t("Email")}
      </FieldLabel>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Field className="flex-1">
          <Input
            id="invite-email"
            type="email"
            placeholder={t("teammate@company.com")}
            aria-invalid={!!formState.errors.email || undefined}
            {...register("email", {
              validate: (value) =>
                isValidEmail(value) || t("Please provide a valid email!"),
            })}
          />
        </Field>
        <Controller
          name="role"
          control={control}
          rules={{ required: t("Choose a role") }}
          render={({ field, fieldState }) => (
            <Select
              value={field.value || null}
              onValueChange={(value) => field.onChange(value ?? "")}
              disabled={isLoading}
              items={roles.map((role) => ({ label: role, value: role }))}
            >
              <SelectTrigger
                className="w-full capitalize sm:w-40"
                aria-invalid={!!fieldState.error || undefined}
                aria-label={t("Role")}
              >
                <SelectValue placeholder={t("Role")} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? <Spinner /> : <SendIcon />}
          {t("Invite")}
        </Button>
      </div>
      <FieldError>
        {formState.errors.email?.message ?? formState.errors.role?.message}
      </FieldError>
    </form>
  );
}
