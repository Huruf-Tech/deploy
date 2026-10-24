import { ThunderSDK } from "thunder-sdk"

/**
 * Drops every SDK cache entry whose key mentions `id` (a deleted record).
 *
 * Invalidating a key refetches every registered entry under the same prefix
 * (e.g. ["projects"] reaches ["projects", id, "releases"]), and entries stay
 * registered after their page unmounts: a deleted record's would refetch and
 * 404. So its data is deleted and its registration removed.
 * ponytail: reads the SDK's protected `_useCachingMethods` map; use a public
 * unregister if thunder-sdk adds one.
 */
export async function forgetCache(id: string) {
  const registry = (
    ThunderSDK as unknown as {
      _useCachingMethods: Map<string, { del: () => Promise<unknown> }>
    }
  )._useCachingMethods
  for (const [key, methods] of [...registry]) {
    if (!key.includes(id)) continue
    await methods.del().catch(() => {})
    registry.delete(key)
  }
}
