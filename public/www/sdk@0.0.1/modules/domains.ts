import type { 
    TRequestOptions,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type list$query = {
    project?: string;
};
export type list$return = {
    _id: string;
    project: string;
    hostname: string;
    status: "pending" | "checking" | "issuing" | "verifying" | "active" | "failed";
    checks?: {
        ownership: boolean;
        dns: boolean;
        checkedAt: string;
        detail?: string | undefined;
    } | undefined;
    checkUntil?: string | undefined;
    verifiedAt?: string | undefined;
    error?: string | undefined;
    certificate?: {
        notAfter: string;
        issuedAt: string;
    } | undefined;
    records: {
        ownership: {
            type: "TXT";
            name: string;
            value: string;
        };
        cname?: string | undefined;
        ipv4?: string[] | undefined;
    };
    createdAt: string;
}[];
export type create$body = {
    project?: string;
    hostname: string;
};
export type create$return = {
    _id: string;
};
export type check$params = {
    id?: string;
};
export type cloudflareConnection$return = {
    connected: boolean;
    zones?: number | undefined;
    connectedAt?: Date | undefined;
};
export type connectCloudflareToken$body = {
    token: string;
};
export type connectCloudflareToken$return = {
    zones: number;
};
export type setUpCloudflare$params = {
    id?: string;
};
export type setUpCloudflare$body = {
    /** Replace records pointing elsewhere (the owner only) */
    replace?: boolean | undefined;
};
export type setUpCloudflare$return = {
    applied: boolean;
    created?: string[] | undefined;
    zone?: string | undefined;
    conflicts?: {
        type: string;
        content: string;
        proxied: boolean;
    }[] | undefined;
};
export type del$params = {
    id?: string;
};

export const domainsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        list$query: list$query,
        list$return: list$return,
        create$body: create$body,
        create$return: create$return,
        check$params: check$params,
        cloudflareConnection$return: cloudflareConnection$return,
        connectCloudflareToken$body: connectCloudflareToken$body,
        connectCloudflareToken$return: connectCloudflareToken$return,
        setUpCloudflare$params: setUpCloudflare$params,
        setUpCloudflare$body: setUpCloudflare$body,
        setUpCloudflare$return: setUpCloudflare$return,
        del$params: del$params,
    };

    const methods = {
        type,
        list(data: {
        params?: undefined,
        query: list$query,
        body?: undefined,
    } & TRequestOptions<list$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("domains", "list");

            const method = "get";
            const toPath = compile("domains/api/");
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
            sdk.checkPermission("domains", "create");

            const method = "post";
            const toPath = compile("domains/api/");
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
        check(data: {
        params: check$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("domains", "check");

            const method = "post";
            const toPath = compile("domains/api/:id/check");
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
        cloudflareConnection(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<cloudflareConnection$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("domains", "cloudflareConnection");

            const method = "get";
            const toPath = compile("domains/api/cloudflare/connection");
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
        connectCloudflareToken(data: {
        params?: undefined,
        query?: undefined,
        body: connectCloudflareToken$body,
    } & TRequestOptions<connectCloudflareToken$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("domains", "connectCloudflareToken");

            const method = "put";
            const toPath = compile("domains/api/cloudflare/connection");
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
        disconnectCloudflare(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("domains", "disconnectCloudflare");

            const method = "delete";
            const toPath = compile("domains/api/cloudflare/connection");
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
        setUpCloudflare(data: {
        params: setUpCloudflare$params,
        query?: undefined,
        body: setUpCloudflare$body,
    } & TRequestOptions<setUpCloudflare$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("domains", "setUpCloudflare");

            const method = "post";
            const toPath = compile("domains/api/:id/cloudflare");
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
            sdk.checkPermission("domains", "del");

            const method = "delete";
            const toPath = compile("domains/api/:id");
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

    (methods.list as any).__scope = "domains";
    (methods.create as any).__scope = "domains";
    (methods.check as any).__scope = "domains";
    (methods.cloudflareConnection as any).__scope = "domains";
    (methods.connectCloudflareToken as any).__scope = "domains";
    (methods.disconnectCloudflare as any).__scope = "domains";
    (methods.setUpCloudflare as any).__scope = "domains";
    (methods.del as any).__scope = "domains";

    sdk["_moduleGroup"].set(methods, "Applications");


    return methods;
};