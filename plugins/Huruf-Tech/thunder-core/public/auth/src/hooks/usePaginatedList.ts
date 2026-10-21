import useSWRInfinite from "swr/infinite";

type TPageQuery = {
  offset: number;
  limit: number;
};

/**
 * Offset-paginated list on top of an SDK `get` call. Pass `key = null` to
 * pause fetching (e.g. while a required tenant id is missing).
 */
export function usePaginatedList<T>(
  key: readonly unknown[] | null,
  fetchPage: (query: TPageQuery) => Promise<{ results: T[] }>,
  pageSize = 20,
) {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(
      (index, previous: { results: T[] } | null) => {
        if (!key) return null;
        if (previous && previous.results.length < pageSize) return null;
        return [...key, index] as const;
      },
      (args) =>
        fetchPage({
          offset: (args[args.length - 1] as number) * pageSize,
          limit: pageSize,
        }),
      { revalidateFirstPage: true },
    );

  const items = data?.flatMap((page) => page.results) ?? [];
  const last = data?.[data.length - 1];

  return {
    items,
    error: error as Error | undefined,
    isLoading,
    isLoadingMore: isValidating && !!data && size > data.length,
    hasMore: !!last && last.results.length === pageSize,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}
