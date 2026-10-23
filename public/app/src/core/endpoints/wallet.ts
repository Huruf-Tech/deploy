import { ThunderSDK } from "thunder-sdk";
import { hash } from "ohash";

/** Stale time for wallet reads, in seconds. */
const cacheTTL = parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1");

export const getWallets = (query: Record<string, unknown> = {}) => {
    return ThunderSDK.useCaching(
        ["wallets.get", hash(query)],
        //! `query` used to be hashed into the cache key and then dropped from the
        //! request, so a filtered read returned unfiltered data under its own
        //! key.
        async ({ signal }) =>
            await ThunderSDK.wallets.get({ signal, params: {}, query }),
        { cacheTTL },
    );
};

export const getWalletLedgers = (query: Record<string, unknown> = {}) => {
    return ThunderSDK.useCaching(
        ["walletLedgers.get", hash(query)],
        async ({ signal }) =>
            await ThunderSDK.walletLedgers.get({ signal, params: {}, query }),
        { cacheTTL },
    );
};

/** Matches every wallet cache entry regardless of its query hash. */
const WALLET_CACHE = /(^|:)(wallets|walletLedgers)\.get(:|$)/;

/**
 * Refreshes every live wallet read.
 *
 * This used to call `getWallets()` / `getWalletLedgers()` with no arguments,
 * which invalidates only the entry keyed by `hash({})`. Any screen reading with
 * a real query — the transaction history, which filters and paginates — kept its
 * stale data after a transfer. Matching on the key covers every variant.
 */
export const invalidateWallets = async () => {
    await ThunderSDK.withCaching(
        async ({ invalidate }) => {
            await invalidate();
        },
        { matcher: WALLET_CACHE },
    );
};
