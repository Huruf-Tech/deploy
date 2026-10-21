import { IconServer2 } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/** Pool overview (PLAN §15.6). Capacity, deployments and alerts arrive with Phases 1, 6 and 8. */
export default function Overview() {
  const { t } = useTranslation()

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconServer2 />
        </EmptyMedia>
        <EmptyTitle>{t("Your server pool is empty")}</EmptyTitle>
        <EmptyDescription>
          {t(
            "Add a server to start deploying. Capacity, deployments and alerts will appear here."
          )}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
