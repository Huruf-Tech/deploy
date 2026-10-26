import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type queue$return = {
    _id: string;
    tenant: string;
    tenantName?: string | undefined;
    status: string;
    /** Plan name */
    plan?: string | undefined;
    size: {
        cpus: number;
        memMb: number;
        diskGb: number;
    };
    /** The size a resize asks for */
    resizeTo?: string | undefined;
    requestedAt: Date;
}[];
export type placement$params = {
    id?: string;
};
export type placement$return = {
    server: string;
    name: string;
    free: {
        memMb: number;
        diskGb: number;
    };
    cpuRoom: number;
    fits: boolean;
    remainderShort: boolean;
    remainderUsesMb?: number | undefined;
}[];
export type approve$params = {
    id?: string;
};
export type approve$body = {
    host?: string;
};
export type reject$params = {
    id?: string;
};
export type reject$body = {
    reason: string;
};
export type approveResize$params = {
    id?: string;
};
export type rejectResize$params = {
    id?: string;
};
export type rejectResize$body = {
    reason: string;
};
export type recreatePartition$params = {
    id?: string;
};
export type pool$params = {
    id?: string;
};
export type pool$return = {
    platform: boolean;
    rentals: {
        _id: string;
        partition?: string | undefined;
        tenantName?: string | undefined;
        plan?: string | undefined;
        /** Cents per month */
        price: number;
        status: string;
    }[];
    /** Cents per month from live rentals */
    revenue: number;
};
export type updatePool$params = {
    id?: string;
};
export type updatePool$body = {
    class?: string | undefined;
    accepting?: boolean | undefined;
    monthlyCost?: number | undefined;
};
export type ensurePool$params = {
    id?: string;
};
export type ensurePool$body = {
    device?: string | undefined;
    loopSizeGb?: number | undefined;
};
export type createRemainder$params = {
    id?: string;
};

export const rentalsAdminModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        queue$return: queue$return,
        placement$params: placement$params,
        placement$return: placement$return,
        approve$params: approve$params,
        approve$body: approve$body,
        reject$params: reject$params,
        reject$body: reject$body,
        approveResize$params: approveResize$params,
        rejectResize$params: rejectResize$params,
        rejectResize$body: rejectResize$body,
        recreatePartition$params: recreatePartition$params,
        pool$params: pool$params,
        pool$return: pool$return,
        updatePool$params: updatePool$params,
        updatePool$body: updatePool$body,
        ensurePool$params: ensurePool$params,
        ensurePool$body: ensurePool$body,
        createRemainder$params: createRemainder$params,
    };

    const methods = {
        type,
        queue(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<queue$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "queue");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/queue");
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
        placement(data: {
        params: placement$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<placement$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "placement");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/:id/placement");
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
        approve(data: {
        params: approve$params,
        query?: undefined,
        body: approve$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "approve");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/approve");
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
        reject(data: {
        params: reject$params,
        query?: undefined,
        body: reject$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "reject");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/reject");
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
        approveResize(data: {
        params: approveResize$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "approveResize");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/resize/approve");
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
        rejectResize(data: {
        params: rejectResize$params,
        query?: undefined,
        body: rejectResize$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "rejectResize");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/resize/reject");
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
        recreatePartition(data: {
        params: recreatePartition$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "recreatePartition");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/partition");
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
        pool(data: {
        params: pool$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<pool$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "pool");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/pool/:id");
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
        updatePool(data: {
        params: updatePool$params,
        query?: undefined,
        body: updatePool$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "updatePool");

            const method = "patch";
            const toPath = compile("rentalsAdmin/api/pool/:id");
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
        ensurePool(data: {
        params: ensurePool$params,
        query?: undefined,
        body: ensurePool$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "ensurePool");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/pool/:id/ensure");
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
        createRemainder(data: {
        params: createRemainder$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "createRemainder");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/pool/:id/remainder");
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

    (methods.queue as any).__scope = "rentalsAdmin";
    (methods.placement as any).__scope = "rentalsAdmin";
    (methods.approve as any).__scope = "rentalsAdmin";
    (methods.reject as any).__scope = "rentalsAdmin";
    (methods.approveResize as any).__scope = "rentalsAdmin";
    (methods.rejectResize as any).__scope = "rentalsAdmin";
    (methods.recreatePartition as any).__scope = "rentalsAdmin";
    (methods.pool as any).__scope = "rentalsAdmin";
    (methods.updatePool as any).__scope = "rentalsAdmin";
    (methods.ensurePool as any).__scope = "rentalsAdmin";
    (methods.createRemainder as any).__scope = "rentalsAdmin";

    sdk["_moduleGroup"].set(methods, "Admin");


    return methods;
};