import * as React from "react"
import { useTranslation } from "react-i18next"
import { IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { AddServerDialog } from "./AddServerDialog"
import { notifyServersChanged, setAddServerOpen } from "./events"

/** "Add server" with its dialog; used as the servers list action and in the empty state. */
export function AddServerButton() {
  const { t } = useTranslation()
  const [open, setOpenState] = React.useState(false)
  const setOpen = (next: boolean) => {
    setOpenState(next)
    setAddServerOpen(next)
    if (!next) notifyServersChanged() // what was added meanwhile shows now
  }
  // Unmounted while open (navigation): don't keep the list from refreshing.
  React.useEffect(() => () => setAddServerOpen(false), [])

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <IconPlus aria-hidden /> {t("Add server")}
      </Button>
      <AddServerDialog
        open={open}
        onOpenChange={setOpen}
        onAdded={notifyServersChanged}
      />
    </>
  )
}
