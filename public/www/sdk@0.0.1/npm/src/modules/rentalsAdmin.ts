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
export type suspend$params = {
    id?: string;
};
export type suspend$body = {
    reason?: string | undefined;
};
export type resume$params = {
    id?: string;
};
export type terminate$params = {
    id?: string;
};
export type terminate$body = {
    reason?: string | undefined;
};
export type moveTargets$params = {
    id?: string;
};
export type moveTargets$return = {
    from?: string | undefined;
    moving: boolean;
    /** Rough: a minute plus copying */
    downtimeSec: number;
    targets: {
        server: string;
        name: string;
        free: {
            memMb: number;
            diskGb: number;
        };
        cpuRoom: number;
        fits: boolean;
        /** The source machine has an address to move from */
        reachable: boolean;
    }[];
};
export type move$params = {
    id?: string;
};
export type move$body = {
    to?: string;
};
export type cancelMove$params = {
    id?: string;
};
export type capacity$return = {
    machines: {
        _id: string;
        name: string;
        class?: string | undefined;
        accepting: boolean;
        allocatable: {
            cpus: number;
            memMb: number;
            diskGb: number;
        };
        rentedMemMb: number;
        /** The platform's own partitions */
        ownMemMb: number;
        freeMemMb: number;
        rentals: number;
        /** Cents per month */
        revenue: number;
        /** Cents per month */
        cost: number;
    }[];
};
export type waiting$return = {
    _id: string;
    tenantName?: string | undefined;
    plan?: string | undefined;
    size: {
        cpus: number;
        memMb: number;
        diskGb: number;
    };
    /** The machine's name */
    host?: string | undefined;
    since: Date;
    /** Why it's stuck; absent while it's being set up */
    error?: string | undefined;
}[];
export type recreatePartition$params = {
    id?: string;
};
export type recreatePartition$body = {
    host?: string | undefined;
};
export type refund$params = {
    id?: string;
};
export type refund$body = {
    reason?: string | undefined;
};
export type refund$return = {
    /** Cents refunded */
    amount: number;
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
        /** Suspended by an admin */
        held?: boolean | undefined;
        /** This period so far, percent */
        uptime?: number | undefined;
        /** Bytes used, when more than its size */
        overDisk?: number | undefined;
        moving?: {
            to: string;
            toName?: string | undefined;
            startedAt: Date;
        } | undefined;
        lastMove?: {
            from: string;
            to: string;
            at: Date;
            error?: string | undefined;
        } | undefined;
    }[];
    /** Cents per month from live rentals */
    revenue: number;
};
export type updatePool$params = {
    id?: string;
};
export type updatePool$body = {
    /** null: not for rent */
    class?: (string | null) | undefined;
    accepting?: boolean | undefined;
    monthlyCost?: number | undefined;
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
        suspend$params: suspend$params,
        suspend$body: suspend$body,
        resume$params: resume$params,
        terminate$params: terminate$params,
        terminate$body: terminate$body,
        moveTargets$params: moveTargets$params,
        moveTargets$return: moveTargets$return,
        move$params: move$params,
        move$body: move$body,
        cancelMove$params: cancelMove$params,
        capacity$return: capacity$return,
        waiting$return: waiting$return,
        recreatePartition$params: recreatePartition$params,
        recreatePartition$body: recreatePartition$body,
        refund$params: refund$params,
        refund$body: refund$body,
        refund$return: refund$return,
        pool$params: pool$params,
        pool$return: pool$return,
        updatePool$params: updatePool$params,
        updatePool$body: updatePool$body,
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
        suspend(data: {
        params: suspend$params,
        query?: undefined,
        body: suspend$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "suspend");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/suspend");
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
        resume(data: {
        params: resume$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "resume");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/resume");
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
        terminate(data: {
        params: terminate$params,
        query?: undefined,
        body: terminate$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "terminate");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/terminate");
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
        moveTargets(data: {
        params: moveTargets$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<moveTargets$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "moveTargets");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/:id/move");
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
        move(data: {
        params: move$params,
        query?: undefined,
        body: move$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "move");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/move");
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
        cancelMove(data: {
        params: cancelMove$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "cancelMove");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/move/cancel");
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
        capacity(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<capacity$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "capacity");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/capacity");
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
        waiting(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<waiting$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "waiting");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/waiting");
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
        body: recreatePartition$body,
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
        refund(data: {
        params: refund$params,
        query?: undefined,
        body: refund$body,
    } & TRequestOptions<refund$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "refund");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/refund");
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
    } as const;

    (methods.queue as any).__scope = "rentalsAdmin";
    (methods.placement as any).__scope = "rentalsAdmin";
    (methods.approve as any).__scope = "rentalsAdmin";
    (methods.reject as any).__scope = "rentalsAdmin";
    (methods.approveResize as any).__scope = "rentalsAdmin";
    (methods.rejectResize as any).__scope = "rentalsAdmin";
    (methods.suspend as any).__scope = "rentalsAdmin";
    (methods.resume as any).__scope = "rentalsAdmin";
    (methods.terminate as any).__scope = "rentalsAdmin";
    (methods.moveTargets as any).__scope = "rentalsAdmin";
    (methods.move as any).__scope = "rentalsAdmin";
    (methods.cancelMove as any).__scope = "rentalsAdmin";
    (methods.capacity as any).__scope = "rentalsAdmin";
    (methods.waiting as any).__scope = "rentalsAdmin";
    (methods.recreatePartition as any).__scope = "rentalsAdmin";
    (methods.refund as any).__scope = "rentalsAdmin";
    (methods.pool as any).__scope = "rentalsAdmin";
    (methods.updatePool as any).__scope = "rentalsAdmin";

    sdk["_moduleGroup"].set(methods, "Admin");


    return methods;
};