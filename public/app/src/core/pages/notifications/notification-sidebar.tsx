import React from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  IconAlertCircle,
  IconBell,
  IconCash,
  IconCheck,
  IconInfoCircle,
  IconPackage,
  IconTruckDelivery,
} from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { triggersBaseUrl, triggersTenantId } from "@/core/lib/constants"
import {
  fetchNotifications,
  markNotificationAsRead,
} from "@/core/endpoints/notification"
import { useRegisterPushNotification } from "@/core/hooks/useRegisterPushNotification"
import { PushNotifications } from "@capacitor/push-notifications"
import { ThunderSDK } from "thunder-sdk"

export type NotificationType =
  "order" | "payment" | "delivery" | "alert" | "info"

export type TNotification = {
  id: string
  type: NotificationType
  title: string
  body: string
  time: string
  read: boolean
}

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: typeof IconBell
    bg: string
    color: string
    border: string
    label: string
  }
> = {
  order: {
    icon: IconPackage,
    bg: "bg-primary/10",
    color: "text-primary",
    border: "border-l-primary",
    label: "Orders",
  },
  payment: {
    icon: IconCash,
    bg: "bg-success/10",
    color: "text-success",
    border: "border-l-success",
    label: "Payments",
  },
  delivery: {
    icon: IconTruckDelivery,
    bg: "bg-blue-500/10",
    color: "text-blue-500",
    border: "border-l-blue-500",
    label: "Deliveries",
  },
  alert: {
    icon: IconAlertCircle,
    bg: "bg-destructive/10",
    color: "text-destructive",
    border: "border-l-destructive",
    label: "Alerts",
  },
  info: {
    icon: IconInfoCircle,
    bg: "bg-muted",
    color: "text-muted-foreground",
    border: "border-l-muted-foreground/40",
    label: "Info",
  },
}

const timeAgo = (dateStr: string) =>
  formatDistanceToNow(new Date(dateStr), { addSuffix: true })

type NotificationSidebarProps = {
  userId?: string
  unreadCount?: number
  onRefreshUnread?: () => void
  onItemMarkedRead?: () => void
}

export function NotificationSidebar({
  userId,
  unreadCount = 0,
  onRefreshUnread,
  onItemMarkedRead,
}: NotificationSidebarProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRtl = i18n.language === "ar"

  const [notifications, setNotifications] = React.useState<TNotification[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)

  const { registerPushNotification } = useRegisterPushNotification()

  React.useEffect(() => {
    let listenerHandle: Awaited<
      ReturnType<typeof PushNotifications.addListener>
    > | null = null

    const setup = async () => {
      listenerHandle = await PushNotifications.addListener(
        "registration",
        async (token) => {
          try {
            await ThunderSDK.users.addFcmToken({ body: { token: token.value } })
          } catch (err) {
            console.error("Failed to save FCM token", err)
          }
        }
      )

      await registerPushNotification()
    }

    setup()

    return () => {
      listenerHandle?.remove()
    }
  }, [])

  const markRead = async (id: string) => {
    if (!triggersTenantId || !userId) return

    const target = notifications.find((n) => n.id === id)
    if (target && !target.read) {
      // 1. تحديث قائمة الأشعارات الداخلية فوراً
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )

      // 2. تحديث العداد الرئيسي في الـ Layout فوراً (سيتحدّث الهيدر والـ MoreSheet لحظياً)
      if (onItemMarkedRead) {
        onItemMarkedRead()
      }
    }

    try {
      await markNotificationAsRead(
        triggersBaseUrl,
        triggersTenantId,
        userId,
        id
      )
      if (onRefreshUnread) onRefreshUnread()
    } catch (err) {
      console.error("Failed to mark notification as read", err)
    }
  }

  React.useEffect(() => {
    if (!open || !triggersTenantId || !userId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchNotifications(triggersBaseUrl, triggersTenantId, userId, 1, 5)
      .then((results) => {
        if (cancelled) return

        const mapped = results.map((doc) => ({
          id: doc._id,
          type: (doc.data?.type ?? "info") as NotificationType,
          title: doc.data?.title ?? "",
          body: doc.data?.body ?? doc.data?.message ?? "",
          time: timeAgo(doc.createdAt),
          read: doc.read ?? false,
        }))

        setNotifications(mapped)
      })
      .catch(() => {
        if (!cancelled) setError(t("Failed to load notifications"))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, userId, t])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 shrink-0"
            aria-label={t("Notifications")}
          />
        }
      >
        <IconBell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </SheetTrigger>

      <SheetContent
        side={isRtl ? "right" : "left"}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-sm"
      >
        {/* Header */}
        <SheetHeader className="flex-row items-center gap-2 space-y-0 border-b border-border p-4">
          <SheetTitle className="text-sm font-semibold text-foreground">
            {t("Notifications")}
          </SheetTitle>
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="h-5 rounded-full px-1.5 text-[10px] font-bold"
            >
              {unreadCount}
            </Badge>
          )}
        </SheetHeader>

        {/* List */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 p-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("Loading...")}
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <IconBell className="mb-2 size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {t("No notifications")}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info
                const Icon = cfg.icon
                return (
                  <Card
                    key={n.id}
                    className={cn(
                      "cursor-pointer border-l-[3px] p-2 shadow-none transition-all duration-150 hover:shadow-sm",
                      cfg.border,
                      !n.read && "bg-primary/3"
                    )}
                    onClick={() => markRead(n.id)}
                  >
                    <CardContent className="flex w-full items-start gap-2 p-0">
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          cfg.bg,
                          cfg.color
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h6
                            className={cn(
                              "line-clamp-1 truncate",
                              !n.read
                                ? "font-medium text-foreground"
                                : "text-foreground/80"
                            )}
                          >
                            {t(n.title)}
                          </h6>
                          {!n.read && (
                            <span className="size-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <small className="line-clamp-1 truncate text-xs text-muted-foreground">
                          {n.body}
                        </small>
                        <p className="mt-1 text-[11px] text-muted-foreground/60">
                          {n.time}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          markRead(n.id)
                        }}
                        aria-label={t("Mark as read")}
                      >
                        <IconCheck className="size-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setOpen(false)
              navigate(`./notifications`)
            }}
          >
            {t("View all notifications")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
