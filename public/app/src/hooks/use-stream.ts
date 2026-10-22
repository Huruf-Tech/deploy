import * as React from "react"
import { ThunderSDK } from "thunder-sdk"

import { usePolling } from "@/hooks/use-polling"

export type TStreamChunk = {
  seq: number
  data: string
  done?: boolean
  error?: string
}

/**
 * One live view (PLAN §3.6, §23.5): opens a stream session, reads new chunks
 * every second while the page is visible, and closes the session on unmount.
 * `open` must be stable (useCallback); pass null to stay closed. To view a
 * different stream, remount the component (`key`) so its state starts fresh.
 */
export function useStream(
  open: (() => Promise<string>) | null,
  onChunk: (chunk: TStreamChunk) => void,
  /** How often to read new output; terminals use ~300 ms. */
  intervalMs = 1_000,
  /** Open a new session when the server closed this one (e.g. idle while hidden). */
  reopen = true
) {
  const [status, setStatus] = React.useState<
    "idle" | "open" | "done" | "error"
  >("idle")
  const [error, setError] = React.useState<string>()
  const [generation, setGeneration] = React.useState(0)
  const session = React.useRef<string | undefined>(undefined)
  const after = React.useRef(0)
  const reading = React.useRef(false)
  const handler = React.useRef(onChunk)
  React.useEffect(() => {
    handler.current = onChunk
  })

  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    after.current = 0

    open()
      .then((id) => {
        if (cancelled) {
          ThunderSDK.streams.close({ params: { id } }).catch(() => {})
          return
        }
        session.current = id
        setStatus("open")
      })
      .catch((e: unknown) => {
        const data = (e as { response?: { data?: unknown } }).response?.data
        setError(typeof data === "string" ? data : "Could not open the stream")
        setStatus("error")
      })

    return () => {
      cancelled = true
      const id = session.current
      session.current = undefined
      if (id) ThunderSDK.streams.close({ params: { id } }).catch(() => {})
    }
  }, [open, generation])

  usePolling(() => {
    const id = session.current
    if (!id || reading.current || status !== "open") return
    reading.current = true

    ThunderSDK.streams
      .read({ params: { id }, query: { after: after.current } })
      .then(({ chunks, closed }) => {
        let ended = false
        for (const chunk of chunks) {
          after.current = chunk.seq
          handler.current(chunk)
          if (chunk.done) {
            ended = true
            setStatus(chunk.error ? "error" : "done")
            if (chunk.error) setError(chunk.error)
          }
        }
        if (closed && !ended && session.current === id) {
          if (reopen) {
            setStatus("idle")
            setGeneration((g) => g + 1)
          } else {
            setStatus("done")
            setError("Session ended")
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        reading.current = false
      })
  }, intervalMs)

  return { status, error }
}
