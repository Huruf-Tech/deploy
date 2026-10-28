import type { 
    TRequestOptions,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

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
        /** The source machine can be reached: its address, or the tunnel server */
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
        /** The owner's workspace */
        tenant: string;
        forRent: boolean;
        accepting: boolean;
        allocatable: {
            cpus: number;
            memMb: number;
            diskGb: number;
        };
        rentedMemMb: number;
        /** The owner's own partitions */
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
export type listDisputes$query = {
    status?: ("open" | "resolved") | undefined;
};
export type listDisputes$return = {
    _id: string;
    subscription: string;
    tenantName?: string | undefined;
    ownerName?: string | undefined;
    machine: string;
    machineName?: string | undefined;
    reason: string;
    status: string;
    evidence: {
        [K in string]: unknown;
    };
    /** Cents the machine's money can pay */
    held: number;
    decision?: {
        refund: number;
        note?: string | undefined;
        at: Date;
    } | undefined;
    createdAt: Date;
}[];
export type resolveDispute$params = {
    id?: string;
};
export type resolveDispute$body = {
    refund: number;
    note?: string | undefined;
};
export type listReverts$return = {
    _id: string;
    ownerName?: string | undefined;
    amount: number;
    /** The claim minus what was charged since */
    max: number;
    claimedAt?: Date | undefined;
    /** The wallet's movements since the claim */
    transactions: {
        type: string;
        amount: number;
        description?: unknown | undefined;
        createdAt?: Date | undefined;
    }[];
    createdAt: Date;
}[];
export type decideRevert$params = {
    id?: string;
};
export type decideRevert$body = {
    /** 0 refuses */
    amount: number;
    note?: string | undefined;
};
export type listReports$return = {
    _id: string;
    tenantName?: string | undefined;
    machine?: string | undefined;
    subscription?: string | undefined;
    text: string;
    createdAt: Date;
}[];
export type closeReport$params = {
    id?: string;
};

export const rentalsAdminModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
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
        listDisputes$query: listDisputes$query,
        listDisputes$return: listDisputes$return,
        resolveDispute$params: resolveDispute$params,
        resolveDispute$body: resolveDispute$body,
        listReverts$return: listReverts$return,
        decideRevert$params: decideRevert$params,
        decideRevert$body: decideRevert$body,
        listReports$return: listReports$return,
        closeReport$params: closeReport$params,
    };

    const methods = {
        type,
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
        listDisputes(data: {
        params?: undefined,
        query: listDisputes$query,
        body?: undefined,
    } & TRequestOptions<listDisputes$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "listDisputes");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/disputes");
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
        resolveDispute(data: {
        params: resolveDispute$params,
        query?: undefined,
        body: resolveDispute$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "resolveDispute");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/disputes/:id/resolve");
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
        listReverts(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<listReverts$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "listReverts");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/reverts");
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
        decideRevert(data: {
        params: decideRevert$params,
        query?: undefined,
        body: decideRevert$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "decideRevert");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/reverts/:id/decide");
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
        listReports(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<listReports$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "listReports");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/reports");
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
        closeReport(data: {
        params: closeReport$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "closeReport");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/reports/:id/close");
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
    (methods.listDisputes as any).__scope = "rentalsAdmin";
    (methods.resolveDispute as any).__scope = "rentalsAdmin";
    (methods.listReverts as any).__scope = "rentalsAdmin";
    (methods.decideRevert as any).__scope = "rentalsAdmin";
    (methods.listReports as any).__scope = "rentalsAdmin";
    (methods.closeReport as any).__scope = "rentalsAdmin";

    sdk["_moduleGroup"].set(methods, "Admin");


    return methods;
};