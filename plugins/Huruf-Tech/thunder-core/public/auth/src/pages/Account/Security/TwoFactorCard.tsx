import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  KeySquareIcon,
  ShieldCheckIcon,
  ShieldIcon,
} from "lucide-react";
import React from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { OtpInput } from "@/components/form/OtpInput";
import { PasswordInput } from "@/components/form/PasswordInput";
import { QRCode } from "@/components/QRCode";
import { SettingsCard, SettingsRow, StatusPill } from "@/components/Settings";
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
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useAppBranding } from "@/hooks/useAppBranding";
import { useLinkedAccounts } from "@/hooks/useAccountData";
import { authClient } from "@/lib/auth";
import { cn, downloadTextFile } from "@/lib/utils";
import { PasswordConfirmDialog } from "./PasswordConfirmDialog";

type TDialog = "enable" | "disable" | "regenerate" | null;

export function TwoFactorCard() {
  const { t } = useTranslation();
  const { data: session, refetch } = authClient.useSession();
  const { data: accounts } = useLinkedAccounts();
  const [dialog, setDialog] = React.useState<TDialog>(null);
  const [regenerated, setRegenerated] = React.useState<string[]>();

  const enabled = !!session?.user.twoFactorEnabled;
  const hasPassword =
    !accounts || accounts.some((a) => a.providerId === "credential");

  return (
    <SettingsCard
      title={t("2-step verification")}
      description={t(
        "Require a code from your authenticator app when signing in with a password.",
      )}
    >
      <SettingsRow
        icon={enabled ? ShieldCheckIcon : ShieldIcon}
        title={
          <span className="flex items-center gap-2">
            {t("Authenticator app")}
            {enabled ? (
              <StatusPill tone="success">{t("On")}</StatusPill>
            ) : (
              <StatusPill>{t("Off")}</StatusPill>
            )}
          </span>
        }
        description={
          hasPassword
            ? enabled
              ? t("Codes from your authenticator app are required to sign in.")
              : t("Add an extra layer of security to your account.")
            : t("Set a password first to turn on 2-step verification.")
        }
        action={
          enabled ? (
            <Button
              variant="destructive-outline"
              size="sm"
              onClick={() => setDialog("disable")}
            >
              {t("Turn off")}
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!hasPassword}
              onClick={() => setDialog("enable")}
            >
              {t("Turn on")}
            </Button>
          )
        }
      />
      {enabled && (
        <SettingsRow
          icon={KeySquareIcon}
          title={t("Backup codes")}
          description={t(
            "One-time codes to sign in if you lose access to your authenticator.",
          )}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialog("regenerate")}
            >
              {t("Get new codes")}
            </Button>
          }
        />
      )}

      <EnableTwoFactorDialog
        open={dialog === "enable"}
        onOpenChange={(open) => setDialog(open ? "enable" : null)}
      />

      <PasswordConfirmDialog
        open={dialog === "disable"}
        onOpenChange={(open) => setDialog(open ? "disable" : null)}
        title={t("Turn off 2-step verification?")}
        description={t("Your account will only be protected by your password.")}
        confirmLabel={t("Turn off")}
        destructive
        onConfirm={async (password) => {
          const { error } = await authClient.twoFactor.disable({ password });
          if (error) return error.message ?? t("Something went wrong");
          await refetch();
          toast.success(t("2-step verification turned off"));
          setDialog(null);
        }}
      />

      <PasswordConfirmDialog
        open={dialog === "regenerate"}
        onOpenChange={(open) => setDialog(open ? "regenerate" : null)}
        title={t("Generate new backup codes")}
        description={t("Your old backup codes will stop working.")}
        confirmLabel={t("Generate")}
        onConfirm={async (password) => {
          const { data, error } =
            await authClient.twoFactor.generateBackupCodes({
              password,
            });
          if (error) return error.message ?? t("Something went wrong");
          setDialog(null);
          setRegenerated(data.backupCodes);
        }}
      />

      <Dialog
        open={!!regenerated}
        onOpenChange={(open) => !open && setRegenerated(undefined)}
      >
        <DialogPopup className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Your new backup codes")}</DialogTitle>
            <DialogDescription>
              {t("Store them somewhere safe. Each code works once.")}
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <BackupCodes codes={regenerated ?? []} />
          </DialogPanel>
          <DialogFooter>
            <Button onClick={() => setRegenerated(undefined)}>
              {t("Done")}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </SettingsCard>
  );
}

type TSetup = { totpURI: string; backupCodes: string[] };

function EnableTwoFactorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { appName } = useAppBranding();
  const { refetch } = authClient.useSession();
  const [step, setStep] = React.useState<"password" | "scan" | "codes">(
    "password",
  );
  const [setup, setSetup] = React.useState<TSetup>();

  const passwordForm = useForm({ defaultValues: { password: "" } });
  const [code, setCode] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [codeError, setCodeError] = React.useState<string>();

  const close = () => {
    onOpenChange(false);
    // Let the closing animation finish before resetting the wizard.
    setTimeout(() => {
      setStep("password");
      setSetup(undefined);
      setCode("");
      setCodeError(undefined);
      passwordForm.reset();
    }, 200);
  };

  const startSetup: SubmitHandler<{ password: string }> = async ({
    password,
  }) => {
    const { data, error } = await authClient.twoFactor.enable({
      password,
      issuer: appName,
    });

    if (error) {
      passwordForm.setError("password", { message: error.message });
      return;
    }

    setSetup(data);
    setStep("scan");
  };

  const verify = async (value: string) => {
    if (value.length !== 6 || verifying) return;
    setVerifying(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code: value });
    setVerifying(false);

    if (error) {
      setCode("");
      setCodeError(error.message ?? t("Invalid code"));
      return;
    }

    await refetch();
    setStep("codes");
  };

  const secret = React.useMemo(() => {
    try {
      return setup ? new URL(setup.totpURI).searchParams.get("secret") : null;
    } catch {
      return null;
    }
  }, [setup]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <DialogPopup className="sm:max-w-md" showCloseButton={step !== "codes"}>
        <DialogHeader>
          <StepIndicator
            current={step === "password" ? 0 : step === "scan" ? 1 : 2}
          />
          <DialogTitle>
            {step === "password"
              ? t("Turn on 2-step verification")
              : step === "scan"
                ? t("Set up your authenticator")
                : t("Save your backup codes")}
          </DialogTitle>
          <DialogDescription>
            {step === "password"
              ? t("Confirm your password to continue.")
              : step === "scan"
                ? t(
                    "Scan the QR code with an app like Google Authenticator, 1Password or Authy, then enter the 6-digit code.",
                  )
                : t(
                    "2-step verification is on. Keep these codes somewhere safe — each one works once if you lose your device.",
                  )}
          </DialogDescription>
        </DialogHeader>

        {step === "password" && (
          <form
            onSubmit={passwordForm.handleSubmit(startSetup)}
            noValidate
            className="contents"
          >
            <DialogPanel>
              <Field>
                <FieldLabel htmlFor="tfa-password">
                  {t("Current password")}
                </FieldLabel>
                <PasswordInput
                  id="tfa-password"
                  autoFocus
                  aria-invalid={
                    !!passwordForm.formState.errors.password || undefined
                  }
                  {...passwordForm.register("password", {
                    required: t("Password is required!"),
                  })}
                />
                <FieldError>
                  {passwordForm.formState.errors.password?.message}
                </FieldError>
              </Field>
            </DialogPanel>
            <DialogFooter>
              <Button variant="ghost" onClick={close}>
                {t("Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting && <Spinner />}
                {t("Continue")}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "scan" && setup && (
          <>
            <DialogPanel className="flex flex-col items-center gap-5">
              <QRCode value={setup.totpURI} />
              {secret && (
                <div className="flex w-full flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {t("Can't scan? Enter this key manually:")}
                  </span>
                  <CopyableCode value={secret} />
                </div>
              )}
              <div className="flex w-full flex-col gap-2">
                <FieldLabel htmlFor="tfa-code">
                  {t("Verification code")}
                </FieldLabel>
                <OtpInput
                  id="tfa-code"
                  value={code}
                  invalid={!!codeError}
                  disabled={verifying}
                  onChange={(value) => {
                    setCodeError(undefined);
                    setCode(value);
                  }}
                  onComplete={verify}
                />
                <FieldError className="text-center">{codeError}</FieldError>
              </div>
            </DialogPanel>
            <DialogFooter>
              <Button variant="ghost" onClick={close}>
                {t("Cancel")}
              </Button>
              <Button
                disabled={verifying || code.length !== 6}
                onClick={() => verify(code)}
              >
                {verifying && <Spinner />}
                {t("Verify")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "codes" && setup && (
          <>
            <DialogPanel>
              <BackupCodes codes={setup.backupCodes} />
            </DialogPanel>
            <DialogFooter>
              <Button
                onClick={() => {
                  toast.success(t("2-step verification turned on"));
                  close();
                }}
              >
                {t("I've saved my codes")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogPopup>
    </Dialog>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-1 flex gap-1.5" aria-hidden>
      {[0, 1, 2].map((step) => (
        <span
          key={step}
          className={cn(
            "h-1 w-8 rounded-full transition-colors",
            step <= current ? "bg-primary" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

function CopyableCode({ value }: { value: string }) {
  const { t } = useTranslation();
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 py-1 ps-3 pe-1">
      <code className="flex-1 font-mono text-sm break-all select-all">
        {value}
      </code>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("Copy")}
        onClick={() => copyToClipboard(value)}
      >
        {isCopied ? <CheckIcon className="text-success" /> : <CopyIcon />}
      </Button>
    </div>
  );
}

export function BackupCodes({ codes }: { codes: string[] }) {
  const { t } = useTranslation();
  const { appName } = useAppBranding();
  const { data: session } = authClient.useSession();
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  const download = () => {
    const content = [
      `${appName} — backup verification codes`,
      "",
      `Account: ${session?.user.email ?? ""}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "Each code can be used only once. Keep them private.",
      "",
      ...codes.map((code, i) => `${String(i + 1).padStart(2, " ")}. ${code}`),
    ].join("\n");

    downloadTextFile(
      `${appName.replaceAll(" ", "-").toLowerCase()}-backup-codes.txt`,
      content,
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border bg-muted/40 p-4 font-mono text-sm">
        {codes.map((code) => (
          <li key={code} className="tracking-wide">
            {code}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => copyToClipboard(codes.join("\n"))}
        >
          {isCopied ? <CheckIcon className="text-success" /> : <CopyIcon />}
          {isCopied ? t("Copied") : t("Copy")}
        </Button>
        <Button variant="outline" onClick={download}>
          <DownloadIcon />
          {t("Download")}
        </Button>
      </div>
    </div>
  );
}
