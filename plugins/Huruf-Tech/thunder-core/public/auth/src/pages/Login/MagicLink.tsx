import { MailCheckIcon } from "lucide-react";
import React from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";
import { isValidEmail, resolveURL } from "@/lib/utils";

function MagicLinkForm() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [sentTo, setSentTo] = React.useState<string>();

  const { register, handleSubmit, formState } = useForm<{ email: string }>({
    defaultValues: { email: searchParams.get("email") ?? "" },
  });

  const onSubmit: SubmitHandler<{ email: string }> = async ({ email }) => {
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: resolveURL(
        withSearch("/account", { omit: TRANSIENT_PARAMS }),
      ),
      errorCallbackURL: resolveURL(
        withSearch("/login", { omit: TRANSIENT_PARAMS }),
      ),
    });

    if (error) toast.error(error.message);
    else setSentTo(email);
  };

  if (sentTo)
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-6 text-center animate-in fade-in zoom-in-95">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MailCheckIcon className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">{t("Check your inbox")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("We sent a sign-in link to {{email}}. It expires shortly.", {
              email: sentTo,
            })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSentTo(undefined)}>
          {t("Use a different email")}
        </Button>
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="magic-email">{t("Email")}</FieldLabel>
          <Input
            id="magic-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!formState.errors.email || undefined}
            {...register("email", {
              validate: (value) =>
                isValidEmail(value) || t("Please provide a valid email!"),
            })}
          />
          <FieldError>{formState.errors.email?.message}</FieldError>
        </Field>
        <Button type="submit" size="lg" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {t("Email me a sign-in link")}
        </Button>
      </FieldGroup>
    </form>
  );
}

export default MagicLinkForm;
