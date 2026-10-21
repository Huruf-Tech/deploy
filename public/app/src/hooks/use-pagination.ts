import { useCallback } from "react"
import { useSearchParams } from "react-router"

export function usePagination() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Math.max(Number(searchParams.get("page") ?? 1) - 1, 0)
  const pageSize = Number(
    searchParams.get("pageSize") ??
      import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT ??
      100
  )

  const setPage = useCallback(
    (pageIndex: number) => {
      setSearchParams((params) => {
        const nextParams = new URLSearchParams(params)

        // Convert 0-based code value to 1-based URL value
        nextParams.set("page", String(pageIndex + 1))

        return nextParams
      })
    },
    [setSearchParams]
  )

  const setPageSize = useCallback(
    (pageSize: number) => {
      setSearchParams((params) => {
        const nextParams = new URLSearchParams(params)

        nextParams.set("pageSize", String(pageSize))
        nextParams.set("page", "1")

        return nextParams
      })
    },
    [setSearchParams]
  )

  return {
    page, // 0-based
    pageSize,
    setPage,
    setPageSize,
  }
}
