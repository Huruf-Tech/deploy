import type { 
    TRequestOptions,
    TFilters,
    TPagination,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type myPolicies$return = {
    role: string;
    subRoles: string[];
    policies: {
        /** The name of the access control policy */
        name: string;
        /** The permissions associated with the access control policy */
        permissions: string[];
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
    }[];
};
export type create$body = {
    /** The name of the access control policy */
    name: string;
    /** The permissions associated with the access control policy */
    permissions: string[];
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
        /** The name of the access control policy */
        name: string;
        /** The permissions associated with the access control policy */
        permissions: string[];
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
    permissions?: string[] | undefined;
};
export type del$params = {
    id: string;
};

export const accessControlPoliciesModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        myPolicies$return: myPolicies$return,
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
        myPolicies(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<myPolicies$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("accessControlPolicies", "myPolicies");

            const method = "get";
            const toPath = compile("accessControlPolicies/api/me");
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
        create(data: {
        params?: undefined,
        query?: undefined,
        body: create$body,
    } & TRequestOptions<create$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("accessControlPolicies", "create");

            const method = "post";
            const toPath = compile("accessControlPolicies/api/");
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
            sdk.checkPermission("accessControlPolicies", "count");

            const method = "get";
            const toPath = compile("accessControlPolicies/api/count");
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
            sdk.checkPermission("accessControlPolicies", "get");

            const method = "get";
            const toPath = compile("accessControlPolicies/api{/:id}");
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
            sdk.checkPermission("accessControlPolicies", "update");

            const method = "patch";
            const toPath = compile("accessControlPolicies/api/:id");
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
            sdk.checkPermission("accessControlPolicies", "del");

            const method = "delete";
            const toPath = compile("accessControlPolicies/api/:id");
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

    (methods.myPolicies as any).__scope = "accessControlPolicies";
    (methods.create as any).__scope = "accessControlPolicies";
    (methods.count as any).__scope = "accessControlPolicies";
    (methods.get as any).__scope = "accessControlPolicies";
    (methods.update as any).__scope = "accessControlPolicies";
    (methods.del as any).__scope = "accessControlPolicies";

    sdk["_moduleGroup"].set(methods, "IAM");

    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","maxLength":100,"description":"The name of the access control policy"},"permissions":{"type":"array","items":{"type":"string"},"description":"The permissions associated with the access control policy"},"createdAt":{"default":"2026-10-28T21:39:09.558Z","type":"string","format":"date-time"},"updatedAt":{"default":"2026-10-28T21:39:09.558Z","type":"string","format":"date-time"}},"required":["name","permissions","createdAt","updatedAt"],"additionalProperties":false},"insertSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","maxLength":100,"description":"The name of the access control policy"},"permissions":{"type":"array","items":{"type":"string"},"description":"The permissions associated with the access control policy"}},"required":["name","permissions"]}}});

    return methods;
};