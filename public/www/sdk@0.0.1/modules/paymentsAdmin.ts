import type { 
    TRequestOptions,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type topups$query = {
    /** A status, or `stuck` for the rows Settle/Abandon apply to */
    status?: ("initiated" | "pending" | "paid" | "processing" | "completed" | "failed" | "stuck") | undefined;
    limit?: number;
};
export type topups$return = {
    _id: string;
    tenant: string;
    tenantName?: string | undefined;
    status: "initiated" | "pending" | "paid" | "processing" | "completed" | "failed";
    amount: number;
    currency: string;
    provider?: string | undefined;
    providerRef?: string | undefined;
    purpose?: string | undefined;
    error?: string | undefined;
    stuck: boolean;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}[];
export type settle$params = {
    id?: string;
};
export type settle$return = {
    outcome: "settled" | "waiting" | "owner" | "no_charge";
    status: string;
    error?: string | undefined;
};
export type abandon$params = {
    id?: string;
};
export type events$query = {
    limit?: number;
};
export type events$return = {
    _id: string;
    kind: "refund" | "dispute";
    tenant?: string | undefined;
    tenantName?: string | undefined;
    gateway: string;
    providerRef?: string | undefined;
    amount?: number | undefined;
    currency?: string | undefined;
    processedAt: Date;
    handledAt?: Date | undefined;
}[];
export type markHandled$params = {
    id?: string;
};

export const paymentsAdminModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        topups$query: topups$query,
        topups$return: topups$return,
        settle$params: settle$params,
        settle$return: settle$return,
        abandon$params: abandon$params,
        events$query: events$query,
        events$return: events$return,
        markHandled$params: markHandled$params,
    };

    const methods = {
        type,
        topups(data: {
        params?: undefined,
        query: topups$query,
        body?: undefined,
    } & TRequestOptions<topups$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("paymentsAdmin", "topups");

            const method = "get";
            const toPath = compile("paymentsAdmin/api/topups");
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
        settle(data: {
        params: settle$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<settle$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("paymentsAdmin", "settle");

            const method = "post";
            const toPath = compile("paymentsAdmin/api/topups/:id/settle");
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
        abandon(data: {
        params: abandon$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("paymentsAdmin", "abandon");

            const method = "post";
            const toPath = compile("paymentsAdmin/api/topups/:id/abandon");
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
        events(data: {
        params?: undefined,
        query: events$query,
        body?: undefined,
    } & TRequestOptions<events$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("paymentsAdmin", "events");

            const method = "get";
            const toPath = compile("paymentsAdmin/api/events");
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
        markHandled(data: {
        params: markHandled$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("paymentsAdmin", "markHandled");

            const method = "post";
            const toPath = compile("paymentsAdmin/api/events/:id/handled");
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

    (methods.topups as any).__scope = "paymentsAdmin";
    (methods.settle as any).__scope = "paymentsAdmin";
    (methods.abandon as any).__scope = "paymentsAdmin";
    (methods.events as any).__scope = "paymentsAdmin";
    (methods.markHandled as any).__scope = "paymentsAdmin";

    sdk["_moduleGroup"].set(methods, "Admin");


    return methods;
};