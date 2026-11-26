import { useTranslation } from "react-i18next"

import { Checkbox } from "@/components/ui/checkbox"

/**
 * The install-time choice (PLAN §27.6): this machine runs apps itself, without
 * Sysbox, and never hosts partitions. It can't be changed later.
 */
export function DirectChoice({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <label className="flex cursor-pointer gap-3 rounded-lg border p-3 has-[[data-state=checked]]:bg-primary/5">
      <Checkbox
        className="mt-0.5"
        checked={checked}
        onCheckedChange={(on) => onCheckedChange(on === true)}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[13px] font-medium">
          {t("Run apps directly on this machine")}
        </span>
        <span className="text-xs text-muted-foreground">
          {t(
            "For a server dedicated to your apps: no partitions, so no partition overhead, and it counts as one server on your plan. It can't host partitions later; changing that means reinstalling. Huruf Deploy sets Docker's log driver and live-restore on it, and the private network needs UDP 51820 open."
          )}
        </span>
      </span>
    </label>
  )
}
