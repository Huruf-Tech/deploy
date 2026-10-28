import type { 
    TRequestOptions,
    TFilters,
    TPagination,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type create$body = {
    email: string;
    role: string;
    url: string;
    membershipExpiresAt?: Date | undefined;
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
        email: string;
        role: string;
        url: string;
        membershipExpiresAt?: Date | undefined;
        tenant: string;
        createdBy: string;
        createdAt: Date | undefined;
        _id: string;
    }[];
};
export type update$params = {
    id: string;
};
export type update$body = {
    email?: string | undefined;
    role?: string | undefined;
    url?: string | undefined;
    membershipExpiresAt?: (Date | undefined) | undefined;
};
export type del$params = {
    id: string;
};

export const tenantInvitesModule = (sdk: typeof BaseSDK) => {
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
            sdk.checkPermission("tenantInvites", "create");

            const method = "post";
            const toPath = compile("tenantInvites/api/");
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
            sdk.checkPermission("tenantInvites", "count");

            const method = "get";
            const toPath = compile("tenantInvites/api/count");
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
            sdk.checkPermission("tenantInvites", "get");

            const method = "get";
            const toPath = compile("tenantInvites/api{/:id}");
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
            sdk.checkPermission("tenantInvites", "update");

            const method = "patch";
            const toPath = compile("tenantInvites/api/:id");
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
            sdk.checkPermission("tenantInvites", "del");

            const method = "delete";
            const toPath = compile("tenantInvites/api/:id");
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

    (methods.create as any).__scope = "tenantInvites";
    (methods.count as any).__scope = "tenantInvites";
    (methods.get as any).__scope = "tenantInvites";
    (methods.update as any).__scope = "tenantInvites";
    (methods.del as any).__scope = "tenantInvites";

    sdk["_moduleGroup"].set(methods, "IAM");

    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"email":{"type":"string","format":"email","pattern":"^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"},"role":{"type":"string"},"url":{"type":"string","format":"uri"},"membershipExpiresAt":{"type":"string","format":"date-time"},"tenant":{"tsType":"string"},"createdBy":{"tsType":"string"},"createdAt":{"default":"2026-10-28T19:35:24.589Z","type":"string","format":"date-time"}},"required":["email","role","url","tenant","createdBy","createdAt"],"additionalProperties":false},"insertSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"email":{"type":"string","format":"email","pattern":"^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"},"role":{"type":"string"},"url":{"type":"string","format":"uri"},"membershipExpiresAt":{"type":"string","format":"date-time"}},"required":["email","role","url"]}}});

    return methods;
};