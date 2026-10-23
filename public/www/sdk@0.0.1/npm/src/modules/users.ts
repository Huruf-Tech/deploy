import type { 
    TRequestOptions,
    TFilters,
    TPagination,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type create$body = {
    email: string;
    password?: string | undefined;
    name: string;
    role?: string | undefined;
    metadata?: {
        [K in string]: any;
    } | undefined;
};
export type create$return = {
    _id: string;
};
export type update$params = {
    id?: string;
};
export type update$body = {
    email: string;
    name: string;
    role?: string | undefined;
    metadata?: {
        [K in string]: any;
    } | undefined;
};
export type ban$params = {
    id?: string;
};
export type ban$body = {
    reason: string;
    banExpiresInSeconds?: number | undefined;
};
export type addFcmToken$body = {
    token: string;
};
export type addFcmToken$return = {
    id: string;
};
export type getUserTenants$params = {
    id?: string;
};
export type getUserTenants$return = {
    _id: string;
    name: string;
}[];
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
        image?: string | undefined;
        email: string;
        fcmTokens?: string[] | undefined;
        emailVerified: boolean;
        phoneNumber?: string | undefined;
        phoneNumberVerified?: boolean | undefined;
        phoneNumberVerificationCode?: string | undefined;
        phoneNumberVerificationRequestAt?: Date | undefined;
        role: string;
        createdAt: Date;
        updatedAt: Date;
        _id: string;
    }[];
};

export const usersModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        create$body: create$body,
        create$return: create$return,
        update$params: update$params,
        update$body: update$body,
        ban$params: ban$params,
        ban$body: ban$body,
        addFcmToken$body: addFcmToken$body,
        addFcmToken$return: addFcmToken$return,
        getUserTenants$params: getUserTenants$params,
        getUserTenants$return: getUserTenants$return,
        count$query: count$query,
        count$return: count$return,
        get$params: get$params,
        get$query: get$query,
        get$return: get$return,
    };

    const methods = {
        type,
        create(data: {
        params?: undefined,
        query?: undefined,
        body: create$body,
    } & TRequestOptions<create$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("users", "create");

            const method = "post";
            const toPath = compile("users/api/");
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
            sdk.checkPermission("users", "update");

            const method = "patch";
            const toPath = compile("users/api/:id");
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
        ban(data: {
        params: ban$params,
        query?: undefined,
        body: ban$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("users", "ban");

            const method = "post";
            const toPath = compile("users/api/ban/:id");
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
        addFcmToken(data: {
        params?: undefined,
        query?: undefined,
        body: addFcmToken$body,
    } & TRequestOptions<addFcmToken$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("users", "addFcmToken");

            const method = "post";
            const toPath = compile("users/api/add/fcm-token");
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
        getUserTenants(data: {
        params: getUserTenants$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<getUserTenants$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("users", "getUserTenants");

            const method = "get";
            const toPath = compile("users/api/:id/tenants");
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
            sdk.checkPermission("users", "count");

            const method = "get";
            const toPath = compile("users/api/count");
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
            sdk.checkPermission("users", "get");

            const method = "get";
            const toPath = compile("users/api{/:id}");
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

    (methods.create as any).__scope = "users";
    (methods.update as any).__scope = "users";
    (methods.ban as any).__scope = "users";
    (methods.addFcmToken as any).__scope = "users";
    (methods.getUserTenants as any).__scope = "users";
    (methods.count as any).__scope = "users";
    (methods.get as any).__scope = "users";

    sdk["_moduleGroup"].set(methods, "Admin");

    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","canFilter":true,"label":"Name"},"image":{"type":"string","format":"uri"},"email":{"type":"string","format":"email","pattern":"^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$","canFilter":true,"label":"Email"},"fcmTokens":{"type":"array","items":{"type":"string"}},"emailVerified":{"type":"boolean","canFilter":true,"label":"Email Verified"},"phoneNumber":{"canFilter":true,"label":"Phone Number","type":"string","format":"e164","pattern":"^\\+[1-9]\\d{6,14}$"},"phoneNumberVerified":{"type":"boolean"},"phoneNumberVerificationCode":{"type":"string"},"phoneNumberVerificationRequestAt":{"type":"string","format":"date-time"},"role":{"type":"string","canFilter":true,"label":"Role"},"createdAt":{"canFilter":true,"label":"Created At","type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}},"required":["name","email","emailVerified","role","createdAt","updatedAt"],"additionalProperties":false},"insertSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"email":{"type":"string","format":"email","pattern":"^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"},"password":{"type":"string"},"name":{"type":"string"},"role":{"type":"string"},"metadata":{"type":"object","propertyNames":{"type":"string"},"additionalProperties":{}}},"required":["email","name"]}}});

    return methods;
};