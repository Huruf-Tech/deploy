import { hash } from "ohash";
import { ThunderSDK } from "thunder-sdk";

const cacheTTL = parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1");

export const getUsers = (
    query: Record<string, unknown> = {},
) => ThunderSDK.useCaching(
    ["users.get", query && hash(query)],
    async ({ signal }) => {
        return await ThunderSDK.users.get({
            signal,
            params: {},
            query: query ? { ...query } : {}
        });
    },
    { cacheTTL },
);