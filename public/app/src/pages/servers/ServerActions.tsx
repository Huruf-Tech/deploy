import * as React from "react"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { IconFolderPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { queries } from "@/lib/queries"
import { FolderDialog } from "@/pages/projects/folders"
import { AddServerButton } from "./AddServerButton"
import { ClearCachesButton } from "./ClearCachesButton"
import { RentServerButton } from "@/pages/rentals/Rentals"

/** The servers list's actions: free disk, bring your own server, or rent one (PLAN §26.6). */
export function ServerActions() {
  return (
    <>
      <ClearCachesButton />
      <RentServerButton />
      <NewFolderButton />
      <AddServerButton />
    </>
  )
}

/** "New folder", as on the Projects page; the new folder opens. */
function NewFolderButton() {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [, setParams] = useSearchParams()
  if (!ThunderSDK.isPermitted("serverGroups", "create")) return null
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <IconFolderPlus aria-hidden /> {t("New folder")}
      </Button>
      <FolderDialog
        kind="servers"
        open={open}
        onOpenChange={setOpen}
        onSaved={(id) => {
          queries
            .serverFolders()
            .invalidate()
            .catch(() => {})
          setParams({ folder: id })
        }}
      />
    </>
  )
}
