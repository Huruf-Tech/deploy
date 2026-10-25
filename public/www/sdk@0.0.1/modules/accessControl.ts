import type { 
    TRequestOptions,
    TFilters,
    TPagination,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type create$body = {
    /** The name of the role */
    role: string;
    skipIntersection?: boolean | undefined;
    /** The policies associated with the role */
    policies: string[];
    subRoles?: string[] | undefined;
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
        /** The name of the role */
        role: string;
        skipIntersection?: boolean | undefined;
        /** The policies associated with the role */
        policies: string[];
        subRoles?: string[] | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
        _id: string;
    }[];
};
export type update$params = {
    id: string;
};
export type update$body = {
    role?: string | undefined;
    skipIntersection?: (boolean | undefined) | undefined;
    policies?: string[] | undefined;
    subRoles?: (string[] | undefined) | undefined;
};
export type del$params = {
    id: string;
};

export const accessControlModule = (sdk: typeof BaseSDK) => {
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
            sdk.checkPermission("accessControl", "create");

            const method = "post";
            const toPath = compile("accessControl/api/");
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
            sdk.checkPermission("accessControl", "count");

            const method = "get";
            const toPath = compile("accessControl/api/count");
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
            sdk.checkPermission("accessControl", "get");

            const method = "get";
            const toPath = compile("accessControl/api{/:id}");
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
            sdk.checkPermission("accessControl", "update");

            const method = "patch";
            const toPath = compile("accessControl/api/:id");
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
            sdk.checkPermission("accessControl", "del");

            const method = "delete";
            const toPath = compile("accessControl/api/:id");
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

    (methods.create as any).__scope = "accessControl";
    (methods.count as any).__scope = "accessControl";
    (methods.get as any).__scope = "accessControl";
    (methods.update as any).__scope = "accessControl";
    (methods.del as any).__scope = "accessControl";

    sdk["_moduleGroup"].set(methods, "IAM");

    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"role":{"type":"string","maxLength":100,"description":"The name of the role"},"skipIntersection":{"type":"boolean"},"policies":{"type":"array","items":{"tsType":"string","ref":"accessControlPolicies"},"description":"The policies associated with the role"},"subRoles":{"type":"array","items":{"type":"string","maxLength":100}},"createdAt":{"default":"2026-10-25T15:10:09.643Z","type":"string","format":"date-time"},"updatedAt":{"default":"2026-10-25T15:10:09.643Z","type":"string","format":"date-time"}},"required":["role","policies","createdAt","updatedAt"],"additionalProperties":false},"insertSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"role":{"type":"string","maxLength":100,"description":"The name of the role"},"skipIntersection":{"type":"boolean"},"policies":{"type":"array","items":{"tsType":"string","ref":"accessControlPolicies"},"description":"The policies associated with the role"},"subRoles":{"type":"array","items":{"type":"string","maxLength":100}}},"required":["role","policies"]}}});

    return methods;
};