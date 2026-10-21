import { TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SecretField } from "@/components/CopyToClipboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

/** Shows a freshly generated secret exactly once. */
export function SecretDialog({
  secret,
  title,
  onClose,
}: {
  secret: string | null;
  title: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!secret} onOpenChange={(open) => !open && onClose()}>
      <DialogPopup className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t(
              "Copy this secret now and store it in a password manager or secret store.",
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-4">
          <SecretField value={secret ?? ""} />
          <Alert variant="warning">
            <TriangleAlertIcon />
            <AlertDescription>
              {t("For your security, you won't be able to see it again.")}
            </AlertDescription>
          </Alert>
        </DialogPanel>
        <DialogFooter>
          <Button onClick={onClose}>{t("I've saved it")}</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
