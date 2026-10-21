import React from "react"

import { fetchUnreadCount } from "@/core/endpoints/notification"
import {
  triggersBaseUrl,
  triggersTenantId,
  unreadCountInterval,
} from "@/core/lib/constants"

/**
 * Polls the unread-notification count for a user.
 *
 * This logic existed twice — once in the mobile layout and once in the
 * notification popover — with separate state, separate intervals and separate
 * error handling, so B-14 had to be fixed in two places.
 *
 * Requests are aborted on unmount and before each new poll, so a slow response
 * cannot land after the component is gone or overwrite a newer one.
 */
export function useUnreadCount(userId?: string) {
  const [count, setCount] = React.useState(0)

  const controller = React.useRef<AbortController | null>(null)

  const refresh = React.useCallback(() => {
    if (!userId || !triggersTenantId || !triggersBaseUrl) return

    controller.current?.abort()

    const next = new AbortController()
    controller.current = next

    void fetchUnreadCount(triggersBaseUrl, triggersTenantId, userId, {
      signal: next.signal,
    })
      .then((value) => {
        if (!next.signal.aborted) setCount(value)
      })
      .catch(() => {
        // Non-critical: the badge keeps its last known value.
      })
  }, [userId])

  /** Drops the badge immediately when one item is marked read. */
  const decrement = React.useCallback(() => {
    setCount((current) => Math.max(0, current - 1))
  }, [])

  React.useEffect(() => {
    refresh()

    const interval = setInterval(refresh, unreadCountInterval)

    return () => {
      clearInterval(interval)
      controller.current?.abort()
    }
  }, [refresh])

  return { count, refresh, decrement, setCount }
}
