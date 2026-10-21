import React from "react"
import {
  IconBell,
  IconBellOff,
  IconAlertCircle,
  IconInfoCircle,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { Container } from "@/core/custom/Container"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ThunderSDK } from "thunder-sdk"
import { use } from "@/core/hooks/use"
import { toast } from "sonner"
import { fetchNotifications, markNotificationAsRead } from "@/core/endpoints/notification"
import type { TNotification } from "@/core/types"
import { SkeletonRepeater } from "@/core/custom/SkeletonRepeater"
import { getDateGroup, timeAgo } from "@/core/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { triggersBaseUrl, triggersTenantId } from "@/core/lib/constants"

function NotificationCardSkeleton() {
  return (
    <Card className="overflow-hidden border-l-[3px] border-l-muted-foreground/20 py-0 shadow-none">
      <CardContent className="flex w-full items-center gap-3 px-3 py-3">
        <Skeleton className="size-9 shrink-0 rounded-full sm:size-10" />
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <Skeleton className="h-3 w-28 rounded sm:w-40" />
          <Skeleton className="h-2.5 w-40 rounded sm:w-56" />
        </div>
        <Skeleton className="h-2.5 w-12 shrink-0 rounded" />
      </CardContent>
    </Card>
  )
}

export default function Notifications() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = React.useState<TNotification[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("all")

  const { page, pageSize, setPage } = usePagination()

  const _me = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return await ThunderSDK.me.get({ signal })
    },
    []
  )

  const { data: me } = use(_me)

  const userId = me?._id
  const tenant = triggersTenantId

  const unreadCount = notifications.filter((n: any) => !n.read).length

  React.useEffect(() => {
    if (!tenant || !userId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    const filters = activeTab === "unread" ? { read: false } : undefined

    fetchNotifications(triggersBaseUrl, tenant, userId, 1, 50, filters)
      .then((results) => {
        if (cancelled) return

        const mapped = results.map((doc) => ({
          _id: doc._id,
          receiver: doc.receiver,
          data: {
            imageUrl: doc.data?.imageUrl ?? "",
            title: doc.data?.title ?? "",
            body: doc.data?.body ?? "",
            html: doc.data?.html ?? "",
          },
          tenant: doc.tenant,
          read: doc.read ?? false,
          createdAt: timeAgo(doc.createdAt),
          updatedAt: timeAgo(doc.updatedAt),
          dateGroup: getDateGroup(doc.createdAt),
        }))

        const scoped =
          activeTab === "unread" ? mapped.filter((n) => !n.read) : mapped

        setNotifications(scoped)
      })
      .catch(() => {
        if (cancelled) return
        const message = t("Failed to load notifications")
        setError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenant, userId, triggersBaseUrl, activeTab, t])

  const filteredNotifications = notifications

  React.useEffect(() => {
    setPage(0)
  }, [activeTab])

  const totalCount = filteredNotifications.length

  const paginated = React.useMemo(
    () => filteredNotifications.slice(page * pageSize, page * pageSize + pageSize),
    [filteredNotifications, page, pageSize]
  )


  const grouped = React.useMemo(() => {
    const groups: Record<string, TNotification[]> = {}
    for (const n of paginated) {
      // `groups[n?.dateGroup!]` keyed everything undated under the literal
      // string "undefined"; skip those instead.
      const group = n?.dateGroup

      if (!group) continue

      ;(groups[group] ??= []).push(n)
    }
    return Object.entries(groups)
  }, [paginated])

  {/*
    const markAllRead = () =>
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  */}

  const markRead = async (id: string) => {
    if (!tenant || !userId) return;

    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    )

    try {
      await markNotificationAsRead(triggersBaseUrl, tenant, userId, id)
    } catch (err) {
      console.error("Failed to mark as read", err)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto mask-y-from-98%">
      <Container className="relative flex flex-col gap-4 max-w-3xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <IconBell className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {t("Notifications")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? t("{{count}} unread notifications", { count: unreadCount })
                  : t("You're all caught up")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/*
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={markAllRead}
                >
                  <IconChecks className="size-3.5" />
                  {t("Mark all read")}
                </Button>
              )}
            */}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0">
            {[
              { value: "all", label: t("All") },
              { value: "unread", label: t("Unread"), count: unreadCount },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-transparent! px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all data-active:border-border data-active:bg-foreground data-active:text-background data-active:hover:text-white data-active:shadow-sm"
              >
                {tab.label}
                {"count" in tab && tab.count! > 0 && (
                  <Badge
                    variant="default"
                    className="size-3 rounded-full text-xs p-2.5"
                  >
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading && (
          <div className="flex flex-col gap-2">
            <SkeletonRepeater count={5} className="gap-3">
              <NotificationCardSkeleton />
            </SkeletonRepeater>
          </div>
        )}

        {!loading && error && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertCircle className="size-7 text-destructive" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {t("Something went wrong")}
              </h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && filteredNotifications.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <IconBellOff className="size-7 text-muted-foreground/50" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {t("No notifications")}
              </h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {activeTab === "unread"
                  ? t("You have no unread notifications.")
                  : t("There are no notifications to display.")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Grouped notifications */}
        {!loading && !error && grouped.map(([date, items]) => (
          <div key={date} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(date)}
              </h2>
              <Separator className="flex-1" />
            </div>

            <div className="flex flex-col gap-3">
              {items.map((n) => {
                return (
                  <Card
                    key={n._id}
                    className={cn(
                      "overflow-hidden border-l-[3px] py-0 shadow-none transition-all duration-150 hover:shadow-sm",
                      !n.read && "bg-primary/3"
                    )}
                  >
                    <Accordion
                      onValueChange={(value) => value && !n.read && markRead(n._id)}
                    >
                      <AccordionItem value={n._id} className="border-none">
                        <AccordionTrigger className="group w-full px-3 py-3 hover:no-underline">
                          <CardContent className="flex w-full items-center gap-3 p-0">
                            <span
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-full sm:size-10 bg-muted text-muted-foreground"
                              )}
                            >
                              <IconInfoCircle className="size-4 sm:size-5" />
                            </span>

                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <p
                                  className={cn(
                                    "truncate text-xs sm:text-sm",
                                    !n.read
                                      ? "font-semibold text-foreground"
                                      : "font-medium text-foreground/80"
                                  )}
                                >
                                  {t(n.data.title)}
                                </p>
                                {!n.read && (
                                  <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-xs max-w-48 sm:max-w-72 lg:max-w-full text-muted-foreground">
                                {n.data.body}
                              </p>
                            </div>

                            <small className="flex shrink-0 items-center self-stretch pr-2 text-muted-foreground h-full">
                              {n.createdAt}
                            </small>
                          </CardContent>
                        </AccordionTrigger>

                        <AccordionContent className="px-3 pb-3">
                          <div className="ml-12 rounded-lg border border-border/60 bg-muted/40 p-3 sm:ml-13">
                            <p className="text-xs leading-relaxed text-foreground/80">
                              {n.data.body}
                            </p>

                            {/* <div className="mt-3 flex flex-wrap items-center gap-2">
                              {n.data.actions?.map((action, i) => (
                                <Button
                                  key={i}
                                  size="sm"
                                  variant={action.type === "button" ? "default" : "outline"}
                                  className="text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (action.type === "redirect" && action.url) {
                                      window.open(action.url, "_blank")
                                    } else {
                                      action.onAction?.()
                                    }
                                  }}
                                >
                                  {action.type === "redirect" && (
                                    <IconExternalLink className="size-3.5" />
                                  )}
                                  {t(action.label ?? (action.type === "button" ? "View details" : "Open link"))}
                                </Button>
                              ))}
                            </div> */}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

        {/* Pagination */}
        {!loading && !error && totalCount > pageSize && (
          <div className="py-2">
            <Pagination
              total={totalCount}
              limit={pageSize}
              active={page}
              onChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </Container>
    </div>
  )
}