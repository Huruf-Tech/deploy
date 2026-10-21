import React from "react"
import { useNavigate } from "react-router"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { IconBell, IconCheck, IconInfoCircle } from "@tabler/icons-react"
import { toast } from "sonner"
import { ThunderSDK } from "thunder-sdk"
import { Capacitor } from "@capacitor/core"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  fetchNotifications,
  markNotificationAsRead,
} from "@/core/endpoints/notification"
import { Card, CardContent } from "@/components/ui/card"
import type { TNotification } from "@/core/types"
import { timeAgo } from "@/core/lib/utils"
import { triggersBaseUrl, triggersTenantId } from "@/core/lib/constants"
import { useUnreadCount } from "@/core/hooks/useUnreadCount"
import { SkeletonRepeater } from "@/core/custom/SkeletonRepeater"
import { Skeleton } from "@/components/ui/skeleton"
import { PushNotifications } from "@capacitor/push-notifications"
import { useRegisterPushNotification } from "@/core/hooks/useRegisterPushNotification"

function NotificationSkeletonCard() {
  return (
    <Card className="p-2 shadow-none">
      <CardContent className="flex w-full items-center gap-2 p-0">
        <Skeleton className="mt-0.5 size-8 rounded-full" />
        <div className="flex w-full items-center justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-24 rounded sm:w-32" />
            <Skeleton className="h-2.5 w-32 rounded sm:w-40" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-2.5 w-10 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type NotificationPopoverProps = {
  userId?: string
}

export function NotificationPopover({ userId }: NotificationPopoverProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [notifications, setNotifications] = React.useState<TNotification[]>([])
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  //! `useRegisterPushNotification` and `useEffect` used to sit inside
  //! `if (Capacitor.getPlatform() !== "web")`. The platform never changes at
  //! runtime so it did not crash in practice, but it is a hook-order violation
  //! that any refactor could turn into one. The hook itself holds no state, so
  //! calling it unconditionally is free; the platform check moved into the
  //! effect body. Found by restoring eslint — see B-01.
  const { registerPushNotification } = useRegisterPushNotification()

  React.useEffect(() => {
    if (Capacitor.getPlatform() === "web") return

    let listenerHandle: Awaited<
      ReturnType<typeof PushNotifications.addListener>
    > | null = null

    const setup = async () => {
      listenerHandle = await PushNotifications.addListener(
        "registration",
        async (token) => {
          try {
            await ThunderSDK.users.addFcmToken({
              body: { token: token.value },
            })
          } catch (err) {
            console.error("Failed to save FCM token", err)
          }
        }
      )

      await registerPushNotification()
    }

    void setup()

    return () => {
      void listenerHandle?.remove()
    }
  }, [registerPushNotification])

  const { count: unreadCount, refresh: refreshUnreadCount } =
    useUnreadCount(userId)

  /*
  const markAllRead = () => {
    // Implement API batch logic here later
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }
  */

  const markRead = async (id: string) => {
    if (!triggersTenantId || !userId) return

    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    )

    try {
      await markNotificationAsRead(
        triggersBaseUrl,
        triggersTenantId,
        userId,
        id
      )
      refreshUnreadCount()
    } catch (err) {
      console.error(err)
    }
  }

  React.useEffect(() => {
    if (!open || !triggersTenantId || !userId) return

    let cancelled = false
    setLoading(true)

    fetchNotifications(triggersBaseUrl, triggersTenantId, userId, 1, 5)
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
        }))

        setNotifications(mapped)
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          t(`${err} || ${err?.message}  || ${err?.response?.data?.message}`) ||
          t("Failed to load notifications")
        toast.error(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, userId, t])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label={t("Notifications")}>
            <IconBell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -inset-e-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-90 gap-0 p-0 sm:w-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {t("Notifications")}
            </h3>
            {unreadCount > 0 && (
              <Badge
                variant="default"
                className="h-5 rounded-full px-1.5 text-[10px] font-bold"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          {/* {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllRead}
            >
              <IconCheck className="me-1 size-3" />
              {t("Mark all read")}
            </Button>
          )} */}
        </div>

        <Separator />

        {/* List */}
        <ScrollArea className="h-auto">
          <div className="flex flex-col gap-3 p-2">
            {loading ? (
              <SkeletonRepeater count={5}>
                <NotificationSkeletonCard />
              </SkeletonRepeater>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <IconBell className="mb-2 size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {t("No notifications")}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                return (
                  <Card
                    key={n._id}
                    className={cn(
                      "cursor-pointer border-l-[3px] p-2 shadow-none transition-all duration-150 hover:shadow-sm",
                      !n.read && "bg-primary/3"
                    )}
                    onClick={() => markRead(n._id)}
                  >
                    <CardContent className="flex w-full items-center gap-2 p-0">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                        )}
                      >
                        <IconInfoCircle className="size-4" />
                      </span>
                      <div className="flex w-full items-center justify-between">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h6
                              className={cn(
                                "line-clamp-1 max-w-36 truncate sm:max-w-48",
                                !n.read
                                  ? "font-medium text-foreground"
                                  : "text-foreground/80"
                              )}
                            >
                              {t(n.data.title)}
                            </h6>
                            {!n.read && (
                              <span className="size-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <small className="line-clamp-1 w-full max-w-36 truncate text-xs text-muted-foreground sm:max-w-48">
                            {n.data.body}
                          </small>
                        </div>
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              markRead(n._id)
                            }}
                          >
                            <IconCheck className="me-1 size-3" />
                            {t("Mark as read")}
                          </Button>
                          <p className="p-1 text-end text-[11px] text-muted-foreground/60">
                            {n.createdAt}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="p-2">
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
      </PopoverContent>
    </Popover>
  )
}
