import { ClipboardPasteIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { OtpInput } from "@/components/form/OtpInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useOnLogin } from "@/hooks/useOnLogin";
import { authClient } from "@/lib/auth";

/** Second step of a password sign-in when the account has 2FA enabled. */
function TwoFactorChallenge({ onCancel }: { onCancel: () => void }) {
  const { t } = useTranslation();
  const [useBackup, setUseBackup] = React.useState(false);

  return (
    <div className="flex flex-col gap-5">
      {useBackup ? <BackupCodeForm /> : <TotpForm />}

      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <Button variant="link" size="sm" className="px-0" onClick={onCancel}>
          {t("Back to sign in")}
        </Button>
        <Button
          variant="link"
          size="sm"
          className="px-0"
          onClick={() => setUseBackup((value) => !value)}
        >
          {useBackup ? t("Use authenticator app") : t("Use a backup code")}
        </Button>
      </div>
    </div>
  );
}

function TotpForm() {
  const { t } = useTranslation();
  const onLogin = useOnLogin();
  const [code, setCode] = React.useState("");
  const [trustDevice, setTrustDevice] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [invalid, setInvalid] = React.useState(false);

  const verify = async (value: string) => {
    if (value.length !== 6 || submitting) return;

    setSubmitting(true);
    const { error } = await authClient.twoFactor.verifyTotp({
      code: value,
      trustDevice,
    });
    setSubmitting(false);

    if (error) {
      setInvalid(true);
      setCode("");
      toast.error(error.message ?? t("Invalid code"));
      return;
    }

    onLogin();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void verify(code);
      }}
    >
      <FieldGroup className="gap-5">
        <OtpInput
          value={code}
          invalid={invalid}
          disabled={submitting}
          onChange={(value) => {
            setInvalid(false);
            setCode(value);
          }}
          onComplete={verify}
        />

        <Field orientation="horizontal" className="justify-center">
          <Checkbox
            id="trustDevice"
            checked={trustDevice}
            onCheckedChange={setTrustDevice}
          />
          <Label htmlFor="trustDevice" className="font-normal">
            {t("Trust this device for 30 days")}
          </Label>
        </Field>

        <Button
          type="submit"
          size="lg"
          disabled={submitting || code.length !== 6}
        >
          {submitting && <Spinner />}
          {t("Verify")}
        </Button>
      </FieldGroup>
    </form>
  );
}

function BackupCodeForm() {
  const { t } = useTranslation();
  const onLogin = useOnLogin();

  const { register, handleSubmit, setValue, formState } = useForm({
    defaultValues: { code: "" },
  });

  const onSubmit = async ({ code }: { code: string }) => {
    const { error } = await authClient.twoFactor.verifyBackupCode({
      code: code.trim(),
      disableSession: false,
    });

    if (error) {
      toast.error(error.message ?? t("Invalid backup code"));
      return;
    }

    onLogin();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="backup-code">{t("Backup code")}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="backup-code"
              autoComplete="off"
              autoFocus
              placeholder="XXXXX-XXXXX"
              className="font-mono"
              aria-invalid={!!formState.errors.code || undefined}
              {...register("code", { required: t("Backup code is required!") })}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label={t("Paste")}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setValue("code", text.trim(), { shouldValidate: true });
                  } catch {
                    toast.error(t("Clipboard access was denied"));
                  }
                }}
              >
                <ClipboardPasteIcon />
                {t("Paste")}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError>{formState.errors.code?.message}</FieldError>
          <FieldDescription>
            {t("Each backup code can only be used once.")}
          </FieldDescription>
        </Field>

        <Button type="submit" size="lg" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {t("Verify")}
        </Button>
      </FieldGroup>
    </form>
  );
}

export default TwoFactorChallenge;
