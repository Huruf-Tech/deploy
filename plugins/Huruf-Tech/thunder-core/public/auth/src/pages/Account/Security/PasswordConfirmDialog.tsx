import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { PasswordInput } from "@/components/form/PasswordInput";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

/**
 * Asks for the current password before a sensitive action. `onConfirm` returns
 * an error message to show, or nothing on success.
 */
export function PasswordConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: (password: string) => Promise<string | void>;
}) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState, reset, setError } = useForm({
    defaultValues: { password: "" },
  });

  const onSubmit: SubmitHandler<{ password: string }> = async ({
    password,
  }) => {
    const error = await onConfirm(password);
    if (error) setError("password", { message: error });
    else reset();
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
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="contents">
          <DialogPanel>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                {t("Current password")}
              </FieldLabel>
              <PasswordInput
                id="confirm-password"
                autoFocus
                aria-invalid={!!formState.errors.password || undefined}
                {...register("password", {
                  required: t("Password is required!"),
                })}
              />
              <FieldError>{formState.errors.password?.message}</FieldError>
            </Field>
          </DialogPanel>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting && <Spinner />}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
