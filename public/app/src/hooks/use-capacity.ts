import { ThunderSDK } from "thunder-sdk"

import { use } from "@/core/hooks/use"
import type { TCapacityReport } from "@/lib/capacity"

const READ_EVERY_MS = 500
const GIVE_UP_MS = 20_000
/** Live views count against the plan's stream quota: a few servers at a time. */
const BATCH = 3

/** Asks one server for its footprints (a `capacity` stream with one chunk). */
async function readCapacity(server: string, signal?: AbortSignal) {
  const { session } = await ThunderSDK.streams.openCapacity({
    body: { server },
  })
  try {
    let text = ""
    let after = 0
    const until = Date.now() + GIVE_UP_MS
    while (Date.now() < until && !signal?.aborted) {
      await new Promise((r) => setTimeout(r, READ_EVERY_MS))
      const { chunks } = await ThunderSDK.streams.read({
        params: { id: session },
        query: { after },
      })
      for (const chunk of chunks) {
        after = chunk.seq
        text += chunk.data
        if (chunk.done) {
          if (chunk.error) throw new Error(chunk.error)
          return JSON.parse(text) as TCapacityReport
        }
      }
    }
    throw new Error("The server didn't answer")
  } finally {
    ThunderSDK.streams.close({ params: { id: session } }).catch(() => {})
  }
}

export type TCapacityResult =
  | { server: string; report: TCapacityReport }
  | { server: string; error: string }

/**
 * Capacity reports of these servers (PLAN §7.1), cached in the browser for
 * the session; `request.invalidate()` asks again.
 */
export function useCapacity(servers: string[]) {
  const request = ThunderSDK.useCaching(
    ["capacity", ...servers],
    async ({ signal }) => {
      const results: TCapacityResult[] = []
      for (let i = 0; i < servers.length; i += BATCH) {
        const batch = servers.slice(i, i + BATCH)
        const settled = await Promise.allSettled(
          batch.map((s) => readCapacity(s, signal))
        )
        settled.forEach((r, j) =>
          results.push(
            r.status === "fulfilled"
              ? { server: batch[j], report: r.value }
              : {
                  server: batch[j],
                  error: (r.reason as Error)?.message ?? "Unavailable",
                }
          )
        )
      }
      return results
    }
  )
  return { request, ...use(request) }
}
