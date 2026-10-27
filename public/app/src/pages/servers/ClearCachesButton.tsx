import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconEraser } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { errorMessage } from "@/lib/utils"

/**
 * Frees disk on every server (PLAN §9.2): each drops its whole build cache
 * and dangling images. Images of releases stay, so rollbacks still work.
 */
export function ClearCachesButton() {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  if (!ThunderSDK.isPermitted("servers", "clearCaches")) return null
  const clear = async () => {
    try {
      const { servers } = await ThunderSDK.servers.clearCaches({})
      toast.success(
        t("Clearing build caches on {{count}} servers", { count: servers })
      )
      setOpen(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not clear the caches"))
    }
  }
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <IconEraser aria-hidden />
        <span className="max-sm:hidden">{t("Clear build caches")}</span>
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("Clear every server's build cache?")}
        description={t(
          "Frees disk on all your servers: their build caches and leftover images go. The next build of each project starts from scratch, so it takes longer. Images of your releases stay, so rollbacks still work."
        )}
        confirmLabel={t("Clear build caches")}
        onConfirm={clear}
      />
    </>
  )
}
