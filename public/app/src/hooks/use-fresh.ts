import * as React from "react"

/**
 * The SDK cache lives in localStorage with no expiry: cached data shows at
 * once, and this refetches it when the page mounts so it's never stale.
 */
export function useFresh(...requests: { invalidate: () => unknown }[]) {
  const latest = React.useRef(requests)
  React.useEffect(() => {
    for (const request of latest.current) request.invalidate()
  }, [])
}
