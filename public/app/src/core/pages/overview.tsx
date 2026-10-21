import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import Logo from "/logo.png"
import { appName } from "@/core/lib/utils"
import { useTranslation } from "react-i18next"

export default function Overview() {
  const { t } = useTranslation()

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <img src={Logo} alt="Logo" className="h-5 w-auto shrink-0" />
        </EmptyMedia>
        <EmptyTitle>
          {t("Welcome to")}{" "}
          <span className="text-base font-semibold capitalize">{appName()}</span>
        </EmptyTitle>
        <EmptyDescription>
          {t(
            "You can customize this page to display relevant information about your application."
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button>{t("Get Started")}</Button>
      </EmptyContent>
    </Empty>
  )
}
