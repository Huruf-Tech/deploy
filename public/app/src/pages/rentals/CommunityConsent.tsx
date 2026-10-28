import * as React from "react"
import { useTranslation } from "react-i18next"
import { IconAlertTriangle } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * The version of the wording below (PLAN §30.4). Keep in step with
 * `COMMUNITY_CONSENT_VERSION` in lib/market/consent.ts: bump both whenever
 * this text changes, so each rental records what its renter agreed to.
 */
export const COMMUNITY_CONSENT_VERSION = "2026-10-28"

/** A community machine's risks and the renter's consent to them. */
export function CommunityConsent({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-warning/50 bg-warning-soft px-3 py-3 text-[13px] text-warning-foreground">
      <p className="flex gap-2 font-medium">
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t("This is an unofficial community server")}
      </p>
      <ul className="flex list-disc flex-col gap-1 ps-10 text-xs">
        <li>
          {t(
            "Its owner has full access to the machine, so they can read or change your data and secrets."
          )}
        </li>
        <li>
          {t(
            "If the hardware fails or the owner shuts it down, data on it is lost. Huruf can't recover it."
          )}
        </li>
        <li>
          {t(
            "Keep important data off it: use external storage, such as an S3 bucket, for files and backups, and a database hosted elsewhere for anything sensitive."
          )}
        </li>
      </ul>
      <label className="flex items-start gap-2 text-foreground">
        <Checkbox
          checked={checked}
          onCheckedChange={(on) => onCheckedChange(!!on)}
          className="mt-0.5"
        />
        <span>
          {t(
            "I understand, and I'm responsible for any leak or loss of my data on it"
          )}
        </span>
      </label>
    </div>
  )
}

/** Asks for the consent before moving a rental onto a community machine. */
export function CommunityConsentDialog({
  machine,
  onOpenChange,
  onConfirm,
}: {
  machine?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<unknown> | unknown
}) {
  const { t } = useTranslation()
  const [checked, setChecked] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Move to a community server?")}</DialogTitle>
          <DialogDescription>
            {t(
              "{{name}} belongs to a community owner, not Huruf. Read this before your server moves there.",
              { name: machine ?? t("This machine") }
            )}
          </DialogDescription>
        </DialogHeader>
        <CommunityConsent checked={checked} onCheckedChange={setChecked} />
        <DialogFooter>
          <Button
            disabled={!checked || busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onConfirm()
                onOpenChange(false)
              } finally {
                setBusy(false)
              }
            }}
          >
            {t("Accept and move")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
