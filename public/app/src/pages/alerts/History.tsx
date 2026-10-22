import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { IconAlertCircle, IconCircleCheck } from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { Page } from "@/components/page"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePolling } from "@/hooks/use-polling"
import { METRICS } from "./metrics"

const when = (at: string | Date) => new Date(at).toLocaleString()

/** Monitoring → Alert history (PLAN §13): episodes and their delivery. */
export default function AlertHistory() {
  const { t } = useTranslation()
  const request = ThunderSDK.useCaching(
    ["alertEvents"],
    async ({ signal }) =>
      await ThunderSDK.alertEvents.list({ query: { limit: 100 }, signal })
  )
  const { data } = use(request)
  usePolling(() => request.invalidate(), 30_000)

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-xl font-semibold">{t("Alert history")}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("The latest 100 alerts. Failed notices are retried with backoff.")}
        </p>
      </div>
      {!data ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : !data.length ? (
        <p className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("No alerts yet.")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Alert")}</TableHead>
                <TableHead>{t("Where")}</TableHead>
                <TableHead>{t("Fired")}</TableHead>
                <TableHead>{t("Resolved")}</TableHead>
                <TableHead>{t("Notice")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((e) => (
                <TableRow key={e._id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {e.open ? (
                        <IconAlertCircle
                          className="size-4 text-destructive"
                          aria-label={t("Open")}
                        />
                      ) : (
                        <IconCircleCheck
                          className="size-4 text-success"
                          aria-label={t("Resolved")}
                        />
                      )}
                      {e.ruleName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t(METRICS[e.metric].label)}
                      {e.value !== undefined &&
                        ` · ${e.value}${METRICS[e.metric].unit === "%" ? "%" : " MiB"}`}
                    </div>
                    {e.detail && (
                      <div
                        className="max-w-80 truncate text-xs text-muted-foreground"
                        title={e.detail}
                      >
                        {e.detail}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {[e.projectName, e.serverName]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {when(e.firedAt)}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {e.resolvedAt ? when(e.resolvedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        e.delivery.status === "failed"
                          ? "destructive"
                          : e.delivery.status === "pending"
                            ? "outline"
                            : "secondary"
                      }
                      title={e.delivery.error}
                    >
                      {e.delivery.notice === "resolved"
                        ? t("Resolve notice")
                        : t("Alert notice")}
                      :{" "}
                      {e.delivery.status === "sent"
                        ? t("sent")
                        : e.delivery.status === "failed"
                          ? t("failed")
                          : e.delivery.attempts
                            ? t("retrying")
                            : t("sending")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Page>
  )
}
