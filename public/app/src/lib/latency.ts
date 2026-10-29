import * as React from "react"
import { ThunderSDK } from "thunder-sdk"

let measured: Promise<number | undefined> | undefined

/**
 * This browser's round trip to the control plane: the fastest of four tiny
 * requests (the first pays for the connection). Once per session.
 */
export function platformRtt() {
  measured ??= (async () => {
    const samples: number[] = []
    for (let i = 0; i < 4; i++) {
      const at = performance.now()
      try {
        await ThunderSDK.home.status()
      } catch {
        return undefined
      }
      samples.push(performance.now() - at)
    }
    return Math.min(...samples)
  })()
  return measured
}

/** `platformRtt` for a component: undefined until measured (or if it failed). */
export function usePlatformRtt() {
  const [ms, setMs] = React.useState<number>()
  React.useEffect(() => {
    let alive = true
    platformRtt().then((v) => alive && setMs(v))
    return () => {
      alive = false
    }
  }, [])
  return ms
}
