import React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export type TConfirmOptions = {
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  /** Ask the user to type this text before the action is enabled. */
  confirmText?: string;
  /**
   * Runs while the dialog shows a busy state. Return `false` (or throw) to keep
   * the dialog open, e.g. when the request failed.
   */
  onConfirm?: () => unknown | Promise<unknown>;
};

type TConfirm = (options: TConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<TConfirm | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [options, setOptions] = React.useState<TConfirmOptions | null>(null);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const resolver = React.useRef<(value: boolean) => void>(null);

  const confirm = React.useCallback<TConfirm>((next) => {
    resolver.current?.(false);
    setOptions(next);
    setTyped("");
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpen(false);
  };

  const handleConfirm = async () => {
    if (!options?.onConfirm) return close(true);

    setBusy(true);
    try {
      const result = await options.onConfirm();
      if (result !== false) close(true);
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  const blocked = !!options?.confirmText && typed !== options.confirmText;

  return (
    <ConfirmContext value={confirm}>
      {children}

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !busy) close(false);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-start">
            <AlertDialogTitle>
              {options?.title ?? t("Are you sure?")}
            </AlertDialogTitle>
            {options?.description ? (
              <AlertDialogDescription>
                {options.description}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>

          {options?.confirmText ? (
            <Field>
              <FieldLabel htmlFor="confirm-text" className="font-normal">
                {t("Type {{text}} to confirm", { text: options.confirmText })}
              </FieldLabel>
              <Input
                id="confirm-text"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
              />
            </Field>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("Cancel")}</AlertDialogCancel>
            <Button
              variant={options?.destructive ? "destructive" : "default"}
              disabled={busy || blocked}
              onClick={handleConfirm}
            >
              {busy && <Spinner />}
              {options?.confirmLabel ?? t("Confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext>
  );
}

export function useConfirm() {
  const context = React.useContext(ConfirmContext);
  if (!context)
    throw new Error("useConfirm must be used within ConfirmProvider");
  return context;
}
