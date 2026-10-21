/**
 * The auth app is driven by query parameters (OAuth `client_id`/`redirect_uri`,
 * `redirect`, `tenant`, `theme`, `lng`, ...). Every in-app navigation must carry
 * them along, otherwise an OAuth flow silently breaks half way through.
 */
export function withSearch(
  path: string,
  options: {
    search?: string;
    omit?: string[];
    set?: Record<string, string | null | undefined>;
  } = {},
) {
  const params = new URLSearchParams(options.search ?? window.location.search);

  for (const key of options.omit ?? []) params.delete(key);
  for (const [key, value] of Object.entries(options.set ?? {})) {
    if (value === null || value === undefined) params.delete(key);
    else params.set(key, value);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** Query params that only make sense on the page that received them. */
export const TRANSIENT_PARAMS = ["token", "error", "addAccount", "email"];
