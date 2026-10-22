import axios, { type AxiosInstance } from "axios"
import type { TNotification } from "../types"
import { triggersBaseUrl as defaultBaseUrl } from "../lib/constants"

export type NotificationFilters = {
  read?: boolean
}

export type TRequestOptions = {
  signal?: AbortSignal
}

/**
 * The triggers service lives on its own host, so it cannot share the SDK's axios
 * instance (that one is pinned to `VITE_API_BASE_URL`). One configured client per
 * base URL replaces the bare `axios` calls, which built URLs by string
 * concatenation — a `VITE_TRIGGERS_BASE_URL` with a trailing slash produced a
 * double slash — and could not be cancelled or time out.
 *
 * Note: these requests carry no credentials, matching the previous behaviour.
 * Turning that on requires the triggers service to allow it (CORS
 * `Access-Control-Allow-Credentials`), so it is left as-is deliberately.
 */
const clients = new Map<string, AxiosInstance>()

const clientFor = (baseUrl?: string) => {
  const url = (baseUrl || defaultBaseUrl || "").replace(/\/+$/, "")

  let client = clients.get(url)

  if (!client) {
    client = axios.create({ baseURL: url, timeout: 15_000 })

    clients.set(url, client)
  }

  return client
}

/** Ids reach these paths from route params, so they are escaped. */
const path = (...segments: string[]) =>
  segments.map((segment) => encodeURIComponent(segment)).join("/")

export const fetchUnreadCount = async (
  baseUrl: string,
  tenantId: string,
  userId: string,
  opts?: TRequestOptions
) => {
  const { data } = await clientFor(baseUrl).get<{ count: number }>(
    `/notifications/api/unread/count/${path(tenantId, userId)}`,
    { signal: opts?.signal }
  )

  return data.count ?? 0
}

export const fetchNotifications = async (
  baseUrl: string,
  tenantId: string,
  userId: string,
  page: number = 1,
  limit: number = 5,
  filters?: NotificationFilters,
  opts?: TRequestOptions
) => {
  const { data } = await clientFor(baseUrl).get<{ results: TNotification[] }>(
    `/notifications/api/me/${path(tenantId, userId)}`,
    {
      params: {
        page,
        limit,
        ...(filters?.read !== undefined ? { read: filters.read } : {}),
      },
      signal: opts?.signal,
    }
  )

  return data.results ?? []
}

export const markNotificationAsRead = async (
  baseUrl: string,
  tenantId: string,
  userId: string,
  notificationId: string,
  opts?: TRequestOptions
) => {
  const { data } = await clientFor(baseUrl).patch(
    `/notifications/api/read/${path(tenantId, userId, notificationId)}`,
    undefined,
    { signal: opts?.signal }
  )

  return data
}
