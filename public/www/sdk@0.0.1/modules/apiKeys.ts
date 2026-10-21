import type { 
    TRequestOptions,
    TFilterValue,
    TFilterExpression,
    TMultiFilters,
    TFilters,
    TPagination,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type create$body = {
    name: string;
    resourceGrant: Record<string, string[]>;
    secret: string;
    scopes?: string[] | undefined;
    expiresAt?: Date | undefined;
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
        resourceGrant: Record<string, string[]>;
        secret: string;
        scopes?: string[] | undefined;
        expiresAt?: Date | undefined;
        lastAccessAt?: Date | undefined;
        accessCount: number;
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
    resourceGrant?: Record<string, string[]> | undefined;
    secret?: string | undefined;
    scopes?: (string[] | undefined) | undefined;
    expiresAt?: (Date | undefined) | undefined;
};
export type del$params = {
    id: string;
};

export const apiKeysModule = (sdk: typeof BaseSDK) => {
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
            sdk.checkPermission("apiKeys", "create");

            const method = "post";
            const toPath = compile("apiKeys/api/");
            const requestPayload = {
                method,
                url: toPath(data?.params),
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
            sdk.checkPermission("apiKeys", "count");

            const method = "get";
            const toPath = compile("apiKeys/api/count");
            const requestPayload = {
                method,
                url: toPath(data?.params),
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
            sdk.checkPermission("apiKeys", "get");

            const method = "get";
            const toPath = compile("apiKeys/api{/:id}");
            const requestPayload = {
                method,
                url: toPath(data?.params),
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
            sdk.checkPermission("apiKeys", "update");

            const method = "patch";
            const toPath = compile("apiKeys/api/:id");
            const requestPayload = {
                method,
                url: toPath(data?.params),
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
            sdk.checkPermission("apiKeys", "del");

            const method = "delete";
            const toPath = compile("apiKeys/api/:id");
            const requestPayload = {
                method,
                url: toPath(data?.params),
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

    (methods.create as any).__scope = "apiKeys";
    (methods.count as any).__scope = "apiKeys";
    (methods.get as any).__scope = "apiKeys";
    (methods.update as any).__scope = "apiKeys";
    (methods.del as any).__scope = "apiKeys";

    sdk["_moduleGroup"].set(methods, "Developer");

    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":2,"maxLength":100},"resourceGrant":{"type":"object","propertyNames":{"type":"string"},"additionalProperties":{"type":"array","items":{"type":"string"}}},"secret":{},"scopes":{"type":"array","items":{"type":"string","maxLength":100}},"expiresAt":{"type":"string","format":"date-time"},"lastAccessAt":{"type":"string","format":"date-time"},"accessCount":{"default":0,"type":"number"},"createdBy":{"tsType":"string"},"createdAt":{"default":"2026-10-21T15:50:05.301Z","type":"string","format":"date-time"},"updatedAt":{"default":"2026-10-21T15:50:05.301Z","type":"string","format":"date-time"}},"required":["name","resourceGrant","secret","accessCount","createdBy","createdAt","updatedAt"],"additionalProperties":false},"insertSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":2,"maxLength":100},"resourceGrant":{"type":"object","propertyNames":{"type":"string"},"additionalProperties":{"type":"array","items":{"type":"string"}}},"secret":{"type":"string","minLength":8,"maxLength":100},"scopes":{"type":"array","items":{"type":"string","maxLength":100}},"expiresAt":{"type":"string","format":"date-time"}},"required":["name","resourceGrant","secret"]}}});

    return methods;
};