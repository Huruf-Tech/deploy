import * as React from "react"

/**
 * Runs `callback` every `intervalMs` while the page is visible (PLAN §15.5),
 * and once immediately when it becomes visible again.
 */
export function usePolling(callback: () => void, intervalMs: number) {
  const latest = React.useRef(callback)
  React.useEffect(() => {
    latest.current = callback
  })

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined

    const start = () => {
      clearInterval(timer)
      if (document.visibilityState !== "visible") return
      latest.current()
      timer = setInterval(() => latest.current(), intervalMs)
    }

    start()
    document.addEventListener("visibilitychange", start)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", start)
    }
  }, [intervalMs])
}
