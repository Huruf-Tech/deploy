import React from "react"

type TRequestCallback<T> = (opts: { signal: AbortSignal }) => Promise<T>

type TRequester<T> = {
  get: TRequestCallback<T>
  onInvalidate: (callback: (data: T) => void) => void
  offInvalidate: (callback: (data: T) => void) => void
  onExpire: (callback: () => void) => void
  offExpire: (callback: () => void) => void
}

type TUseOpts = {
  disabled?: boolean
  maxRetries?: number
  triggerTarget?: string
  manualTrigger?: boolean
}

type RefetchResult = {
  controller: AbortController
}

type RefetchFn = (opts?: {
  controller: AbortController
}) => Promise<RefetchResult>

export function use<T>(
  req?: TRequestCallback<T> | TRequester<T>,
  options?: TUseOpts
) {
  const request = React.useMemo(() => {
    if (!req) return () => Promise.resolve(null as T)

    return req
  }, [req])

  const _request = typeof request === "function" ? request : request.get
  const _onInvalidate =
    typeof request === "object" ? request.onInvalidate : undefined
  const _offInvalidate =
    typeof request === "object" ? request.offInvalidate : undefined
  const _onExpire = typeof request === "object" ? request.onExpire : undefined
  const _offExpire = typeof request === "object" ? request.offExpire : undefined

  const [can, setCan] = React.useState(!options?.triggerTarget)
  const [isLoading, setLoading] = React.useState(!options?.disabled)
  const [count, setCount] = React.useState(0)
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<Error | null>(null)

  const SendRequest = React.useCallback(
    async (opts: { signal: AbortSignal }) => {
      if (!can) return

      setLoading(true)

      for (let attempt = 0; attempt <= (options?.maxRetries ?? 0); attempt++) {
        try {
          const Response = await _request(opts)

          setData(Response)
          //! Without this the error state survived a successful refetch, so the
          //! error UI stayed on screen forever.
          setError(null)
          setLoading(false)

          return
        } catch (err) {
          if (!options?.maxRetries || attempt === options.maxRetries) {
            setError(err instanceof Error ? err : new Error(`${err}`))
            setLoading(false)

            return
          }
        }
      }
    },
    [_request, can, options?.maxRetries]
  )

  const triggerElement =
    options?.triggerTarget && document.getElementById(options.triggerTarget)

  React.useEffect(() => {
    if (options?.manualTrigger || options?.disabled) return

    if (triggerElement) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setCan(true)
          }
        },
        {
          root: null,
          threshold: 0.2,
        }
      )

      observer.observe(triggerElement)

      return () => {
        observer.disconnect()
      }
    }
  }, [SendRequest, options?.manualTrigger, options?.disabled, triggerElement])

  React.useEffect(() => {
    const controller = new AbortController()

    const handleChange = () => {
      if (options?.manualTrigger || options?.disabled) return

      SendRequest({ signal: controller.signal })
    }

    window.addEventListener("online", handleChange)

    _onInvalidate?.(setData)

    const handleExpire = () => {
      setCount((_) => _ + 1)
    }

    _onExpire?.(handleExpire)

    return () => {
      controller.abort()

      window.removeEventListener("online", handleChange)

      _offInvalidate?.(setData)
      _offExpire?.(handleExpire)
    }
  }, [
    SendRequest,
    _onInvalidate,
    _offInvalidate,
    _onExpire,
    _offExpire,
    options?.manualTrigger,
    options?.disabled,
  ])

  React.useEffect(() => {
    if (options?.manualTrigger || options?.disabled) return

    const controller = new AbortController()

    SendRequest({ signal: controller.signal })

    return () => {
      controller.abort()
    }
  }, [count, SendRequest, options?.manualTrigger, options?.disabled])

  const refetch = React.useCallback(
    async (opts?: { controller: AbortController }) => {
      const controller = opts?.controller ?? new AbortController()

      await SendRequest({ signal: controller.signal })

      return {
        controller,
      }
    },
    [SendRequest]
  )

  /**
   * Deliberately memoised with empty deps and then mutated in place.
   *
   * Consumers get **one stable object reference** for the lifetime of the hook,
   * while its properties always hold the latest values. That keeps the returned
   * value out of dependency arrays and prop comparisons, so a consumer does not
   * re-render just because the result object was recreated.
   *
   * Do not "fix" this into a normal memo with real dependencies — that would
   * reintroduce the churn it exists to avoid.
   *
   * Consequence to be aware of: because the object is mutated rather than
   * replaced, anything relying on referential change will not see updates — a
   * `React.memo` child receiving it as a prop, or a `useEffect` with it in the
   * dependency array. Depend on the individual fields instead
   * (`[data]`, `[isLoading]`), not on the object.
   */
  const results = React.useMemo(
    () =>
      ({
        isLoading,
        data,
        error,
        refetch,
      }) as
        | {
            isLoading: true
            data: null
            error: null
            refetch: RefetchFn
          }
        | {
            isLoading: false
            data: T
            error: null
            refetch: RefetchFn
          }
        | {
            isLoading: false
            data: null
            error: Error
            refetch: RefetchFn
          },
    // Empty on purpose — see the note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Latest values onto the stable reference — see the note above.
  results.isLoading = isLoading
  results.data = data
  results.error = error
  results.refetch = refetch

  return results
}
