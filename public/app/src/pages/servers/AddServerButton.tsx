import * as React from "react"
import { useTranslation } from "react-i18next"
import { IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { AddServerDialog } from "./AddServerDialog"
import { notifyServersChanged } from "./events"

/** "Add server" with its dialog; used as the servers list action and in the empty state. */
export function AddServerButton() {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
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
