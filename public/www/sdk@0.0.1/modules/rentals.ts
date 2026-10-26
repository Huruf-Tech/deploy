import type { 
    TRequestOptions,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type catalog$return = {
    classes: {
        name: string;
        description?: string | undefined;
        rates: {
            vcpu: number;
            memGb: number;
            diskGb: number;
            trafficGb: number;
            fixed: number;
        };
        includedTrafficPerVcpu: number;
        cpuOvercommit: number;
        maxPerRental: {
            vcpu: number;
            memMb: number;
            diskGb: number;
        };
        active: boolean;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
        _id: string;
    }[];
    sizes: {
        _id: string;
        name: string;
        description?: string | undefined;
        class: string;
        resources: {
            vcpu: number;
            memMb: number;
            diskGb: number;
            trafficGb: number;
        };
        price: {
            amount: number;
            currency: string;
            interval: string;
        };
    }[];
    /** Added to every partition, at the memory rate */
    overheadMb: number;
};
export type quote$query = {
    class?: string;
    vcpu: number;
    memMb: number;
    diskGb: number;
};
export type quote$return = {
    /** Cents per month */
    price: number;
    /** Included per month */
    trafficGb: number;
    overheadMb: number;
};
export type list$return = {
    status: "requested" | "rejected" | "active" | "pastDue" | "suspended" | "released" | "canceled";
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd?: Date | undefined;
    lastError?: string | undefined;
    startedAt: Date;
    _id: string;
    server?: string | undefined;
    plan?: {
        _id: string;
        name: string;
    } | undefined;
    size: {
        cpus: number;
        memMb: number;
        diskGb: number;
    };
    /** The plan a resize waits for */
    pendingChange?: string | undefined;
    rejectedReason?: string | undefined;
    suspendedAt?: Date | undefined;
    /** This period so far, percent */
    uptime?: number | undefined;
    /** Huruf moves it to another machine */
    moving?: boolean | undefined;
}[];
export type request$body = {
    plan?: string | undefined;
    custom?: {
        class?: string;
        vcpu: number;
        memMb: number;
        diskGb: number;
    } | undefined;
};
export type request$return = {
    result: "requested" | "pending";
    rental: string;
    topup?: string | undefined;
    clientSecret?: string | undefined;
};
export type withdraw$params = {
    id?: string;
};
export type resize$params = {
    id?: string;
};
export type resize$body = {
    plan?: string | undefined;
    custom?: {
        class?: string;
        vcpu: number;
        memMb: number;
        diskGb: number;
    } | undefined;
};
export type cancel$params = {
    id?: string;
};

export const rentalsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        catalog$return: catalog$return,
        quote$query: quote$query,
        quote$return: quote$return,
        list$return: list$return,
        request$body: request$body,
        request$return: request$return,
        withdraw$params: withdraw$params,
        resize$params: resize$params,
        resize$body: resize$body,
        cancel$params: cancel$params,
    };

    const methods = {
        type,
        catalog(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<catalog$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "catalog");

            const method = "get";
            const toPath = compile("rentals/api/catalog");
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
        quote(data: {
        params?: undefined,
        query: quote$query,
        body?: undefined,
    } & TRequestOptions<quote$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "quote");

            const method = "get";
            const toPath = compile("rentals/api/quote");
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
        list(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<list$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "list");

            const method = "get";
            const toPath = compile("rentals/api/");
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
        request(data: {
        params?: undefined,
        query?: undefined,
        body: request$body,
    } & TRequestOptions<request$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "request");

            const method = "post";
            const toPath = compile("rentals/api/request");
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
        withdraw(data: {
        params: withdraw$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "withdraw");

            const method = "post";
            const toPath = compile("rentals/api/:id/withdraw");
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
        resize(data: {
        params: resize$params,
        query?: undefined,
        body: resize$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "resize");

            const method = "post";
            const toPath = compile("rentals/api/:id/resize");
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
        cancel(data: {
        params: cancel$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "cancel");

            const method = "post";
            const toPath = compile("rentals/api/:id/cancel");
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

    (methods.catalog as any).__scope = "rentals";
    (methods.quote as any).__scope = "rentals";
    (methods.list as any).__scope = "rentals";
    (methods.request as any).__scope = "rentals";
    (methods.withdraw as any).__scope = "rentals";
    (methods.resize as any).__scope = "rentals";
    (methods.cancel as any).__scope = "rentals";

    sdk["_moduleGroup"].set(methods, "Billing");


    return methods;
};