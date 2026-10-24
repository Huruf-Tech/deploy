import type { 
    TRequestOptions,
    TFilters,
    TPagination,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type create$body = {
    name: string;
    description?: string | undefined;
    logo?: string | undefined;
    type: "confidential" | "public";
    secret?: string | undefined;
    allowedScopes?: string[] | undefined;
    redirectUris?: string[] | undefined;
    disabled?: boolean | undefined;
};
export type create$return = {
    _id: string;
};
export type count$query = {
    /** Client side filters */
    filters?: TFilters | undefined;
    /** Client side sub-filters (Just a second layer of filters) */
    subFilters?: TFilters | undefined;
};
export type count$return = {
    count: number;
};
export type get$params = {
    id?: string | undefined;
};
export type get$query = TPagination;
export type get$return = {
    results: {
        name: string;
        description?: string | undefined;
        logo?: string | undefined;
        type: "confidential" | "public";
        secret?: string | undefined;
        allowedScopes: string[] | undefined;
        redirectUris: string[] | undefined;
        disabled?: boolean | undefined;
        createdBy: string;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
        _id: string;
    }[];
};
export type update$params = {
    id: string;
};
export type update$body = {
    name?: string | undefined;
    description?: (string | undefined) | undefined;
    logo?: (string | undefined) | undefined;
    type?: ("confidential" | "public") | undefined;
    secret?: (string | undefined) | undefined;
    allowedScopes?: (string[] | undefined) | undefined;
    redirectUris?: (string[] | undefined) | undefined;
    disabled?: (boolean | undefined) | undefined;
};
export type del$params = {
    id: string;
};

export const oauthClientsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        create$body: create$body,
        create$return: create$return,
        count$query: count$query,
        count$return: count$return,
        get$params: get$params,
        get$query: get$query,
        get$return: get$return,
        update$params: update$params,
        update$body: update$body,
        del$params: del$params,
    };

    const methods = {
        type,
        create(data: {
        params?: undefined,
        query?: undefined,
        body: create$body,
    } & TRequestOptions<create$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("oauthClients", "create");

            const method = "post";
            const toPath = compile("oauthClients/api/");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        count(data: {
        params?: undefined,
        query: count$query,
        body?: undefined,
    } & TRequestOptions<count$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("oauthClients", "count");

            const method = "get";
            const toPath = compile("oauthClients/api/count");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        get(data: {
        params: get$params,
        query: get$query,
        body?: undefined,
    } & TRequestOptions<get$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("oauthClients", "get");

            const method = "get";
            const toPath = compile("oauthClients/api{/:id}");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        update(data: {
        params: update$params,
        query?: undefined,
        body: update$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("oauthClients", "update");

            const method = "patch";
            const toPath = compile("oauthClients/api/:id");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        del(data: {
        params: del$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("oauthClients", "del");

            const method = "delete";
            const toPath = compile("oauthClients/api/:id");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
    } as const;

    (methods.create as any).__scope = "oauthClients";
    (methods.count as any).__scope = "oauthClients";
    (methods.get as any).__scope = "oauthClients";
    (methods.update as any).__scope = "oauthClients";
    (methods.del as any).__scope = "oauthClients";

    sdk["_moduleGroup"].set(methods, "OAuth");

    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":100},"description":{"type":"string","maxLength":300},"logo":{"type":"string","format":"uri"},"type":{"type":"string","enum":["confidential","public"]},"secret":{"type":"hidden"},"allowedScopes":{"default":[],"type":"array","items":{"type":"string","minLength":1,"maxLength":255}},"redirectUris":{"default":[],"type":"array","items":{"type":"string","format":"uri"}},"disabled":{"type":"boolean"},"createdBy":{"tsType":"string"},"createdAt":{"default":"2026-10-24T11:45:22.542Z","type":"string","format":"date-time"},"updatedAt":{"default":"2026-10-24T11:45:22.543Z","type":"string","format":"date-time"}},"required":["name","type","allowedScopes","redirectUris","createdBy","createdAt","updatedAt"],"additionalProperties":false},"insertSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":100},"description":{"type":"string","maxLength":300},"logo":{"type":"string","format":"uri"},"type":{"type":"string","enum":["confidential","public"]},"secret":{"type":"hidden"},"allowedScopes":{"default":[],"type":"array","items":{"type":"string","minLength":1,"maxLength":255}},"redirectUris":{"default":[],"type":"array","items":{"type":"string","format":"uri"}},"disabled":{"type":"boolean"}},"required":["name","type"]}}});

    return methods;
};