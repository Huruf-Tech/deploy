import type { 
    TRequestOptions,
    TFilterValue,
    TFilterExpression,
    TMultiFilters,
    TFilters,
    TPagination,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

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
        tenant: string;
        user: string;
        email?: string | undefined;
        role?: string | undefined;
        isOwner: boolean;
        expiresAt?: Date | undefined;
        createdBy: string;
        createdAt: Date | undefined;
        _id: string;
    }[];
};
export type update$params = {
    id: string;
};
export type update$body = {
    role?: (string | undefined) | undefined;
    expiresAt?: (Date | undefined) | undefined;
};
export type del$params = {
    id: string;
};
export type create$body = {
    invite?: string;
};
export type create$return = {
    _id: string;
};

export const tenantMembersModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        count$query: count$query,
        count$return: count$return,
        get$params: get$params,
        get$query: get$query,
        get$return: get$return,
        update$params: update$params,
        update$body: update$body,
        del$params: del$params,
        create$body: create$body,
        create$return: create$return,
    };

    const methods = {
        type,
        count(data: {
        params?: undefined,
        query: count$query,
        body?: undefined,
    } & TRequestOptions<count$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("tenantMembers", "count");

            const method = "get";
            const toPath = compile("tenantMembers/api/count");
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
            sdk.checkPermission("tenantMembers", "get");

            const method = "get";
            const toPath = compile("tenantMembers/api{/:id}");
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
            sdk.checkPermission("tenantMembers", "update");

            const method = "patch";
            const toPath = compile("tenantMembers/api/:id");
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
            sdk.checkPermission("tenantMembers", "del");

            const method = "delete";
            const toPath = compile("tenantMembers/api/:id");
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
        create(data: {
        params?: undefined,
        query?: undefined,
        body: create$body,
    } & TRequestOptions<create$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("tenantMembers", "create");

            const method = "post";
            const toPath = compile("tenantMembers/api/");
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

    (methods.count as any).__scope = "tenantMembers";
    (methods.get as any).__scope = "tenantMembers";
    (methods.update as any).__scope = "tenantMembers";
    (methods.del as any).__scope = "tenantMembers";
    (methods.create as any).__scope = "tenantMembers";

    sdk["_moduleGroup"].set(methods, "IAM");

    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"tenant":{"tsType":"string"},"user":{"tsType":"string"},"email":{"type":"string"},"role":{"type":"string"},"isOwner":{"type":"boolean"},"expiresAt":{"type":"string","format":"date-time"},"createdBy":{"tsType":"string"},"createdAt":{"default":"2026-10-22T12:45:53.702Z","type":"string","format":"date-time"}},"required":["tenant","user","isOwner","createdBy","createdAt"],"additionalProperties":false},"insertSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"invite":{"tsType":"string"}},"required":["invite"]},"updateSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"role":{"type":"string"},"expiresAt":{"type":"string","format":"date-time"}}}}});

    return methods;
};