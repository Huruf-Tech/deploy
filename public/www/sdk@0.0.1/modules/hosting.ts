import type { 
    TRequestOptions,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type machine$params = {
    id?: string;
};
export type machine$return = {
    rent?: {
        enabled: boolean;
        autoAccept: boolean;
        prices: {
            vcpu: number;
            memGb: number;
            diskGb: number;
            whole?: number | undefined;
            trafficGb: number;
        };
    } | undefined;
    accepting: boolean;
    monthlyCost?: number | undefined;
    security: {
        /** Cents held for this machine */
        amount: number;
        /** Its whole monthly price, minus commission */
        cap: number;
    };
    /** Percent, from the workspace plan */
    commission: number;
    rentals: {
        _id: string;
        partition?: string | undefined;
        tenantName?: string | undefined;
        plan?: string | undefined;
        /** Cents per month */
        price: number;
        size: {
            cpus: number;
            memMb: number;
            diskGb: number;
        };
        whole?: boolean | undefined;
        status: string;
        held?: boolean | undefined;
        uptime?: number | undefined;
        overDisk?: number | undefined;
        term?: {
            months: number;
            until?: Date | undefined;
        } | undefined;
        endAt?: Date | undefined;
        currentPeriodEnd?: Date | undefined;
        moving?: {
            to: string;
            toName?: string | undefined;
            startedAt: Date;
        } | undefined;
        proposal?: {
            to: string;
            toName?: string | undefined;
            expiresAt: Date;
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
export type updateMachine$params = {
    id?: string;
};
export type updateMachine$body = {
    rent?: {
        enabled: boolean;
        autoAccept: boolean;
        prices: {
            vcpu: number;
            memGb: number;
            diskGb: number;
            whole?: number | undefined;
            trafficGb?: number;
        };
    } | undefined;
    accepting?: boolean | undefined;
    monthlyCost?: number | undefined;
};
export type requests$return = {
    _id: string;
    tenantName?: string | undefined;
    status: string;
    machine?: string | undefined;
    machineName?: string | undefined;
    plan?: string | undefined;
    /** Cents per month */
    price: number;
    size: {
        cpus: number;
        memMb: number;
        diskGb: number;
    };
    whole?: boolean | undefined;
    termMonths?: number | undefined;
    /** A resize asks for this */
    resizeTo?: {
        plan: string;
        price: number;
    } | undefined;
    requestedAt: Date;
    /** Why it didn't start at once, on a machine that accepts at once */
    autoAcceptError?: string | undefined;
}[];
export type accept$params = {
    id?: string;
};
export type decline$params = {
    id?: string;
};
export type decline$body = {
    reason: string;
};
export type acceptResize$params = {
    id?: string;
};
export type declineResize$params = {
    id?: string;
};
export type declineResize$body = {
    reason: string;
};
export type end$params = {
    id?: string;
};
export type end$return = {
    endAt: Date;
};
export type moveTargets$params = {
    id?: string;
};
export type moveTargets$return = {
    from?: string | undefined;
    moving: boolean;
    downtimeSec: number;
    targets: {
        server: string;
        name: string;
        fits: boolean;
        /** Cents per month there */
        price: number;
        own: boolean;
        reachable: boolean;
    }[];
};
export type propose$params = {
    id?: string;
};
export type propose$body = {
    to?: string;
    reason?: string | undefined;
};
export type capacity$return = {
    machines: {
        _id: string;
        name: string;
        forRent: boolean;
        accepting: boolean;
        allocatable: {
            cpus: number;
            memMb: number;
            diskGb: number;
        };
        rentedMemMb: number;
        ownMemMb: number;
        freeMemMb: number;
        rentals: number;
        revenue: number;
        cost: number;
    }[];
};

export const hostingModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        machine$params: machine$params,
        machine$return: machine$return,
        updateMachine$params: updateMachine$params,
        updateMachine$body: updateMachine$body,
        requests$return: requests$return,
        accept$params: accept$params,
        decline$params: decline$params,
        decline$body: decline$body,
        acceptResize$params: acceptResize$params,
        declineResize$params: declineResize$params,
        declineResize$body: declineResize$body,
        end$params: end$params,
        end$return: end$return,
        moveTargets$params: moveTargets$params,
        moveTargets$return: moveTargets$return,
        propose$params: propose$params,
        propose$body: propose$body,
        capacity$return: capacity$return,
    };

    const methods = {
        type,
        machine(data: {
        params: machine$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<machine$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("hosting", "machine");

            const method = "get";
            const toPath = compile("hosting/api/machines/:id");
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
        updateMachine(data: {
        params: updateMachine$params,
        query?: undefined,
        body: updateMachine$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("hosting", "updateMachine");

            const method = "patch";
            const toPath = compile("hosting/api/machines/:id");
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
        requests(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<requests$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("hosting", "requests");

            const method = "get";
            const toPath = compile("hosting/api/requests");
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
        accept(data: {
        params: accept$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("hosting", "accept");

            const method = "post";
            const toPath = compile("hosting/api/:id/accept");
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
        decline(data: {
        params: decline$params,
        query?: undefined,
        body: decline$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("hosting", "decline");

            const method = "post";
            const toPath = compile("hosting/api/:id/decline");
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
        acceptResize(data: {
        params: acceptResize$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("hosting", "acceptResize");

            const method = "post";
            const toPath = compile("hosting/api/:id/resize/accept");
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
        declineResize(data: {
        params: declineResize$params,
        query?: undefined,
        body: declineResize$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("hosting", "declineResize");

            const method = "post";
            const toPath = compile("hosting/api/:id/resize/decline");
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
        end(data: {
        params: end$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<end$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("hosting", "end");

            const method = "post";
            const toPath = compile("hosting/api/:id/end");
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
            sdk.checkPermission("hosting", "moveTargets");

            const method = "get";
            const toPath = compile("hosting/api/:id/move");
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
        propose(data: {
        params: propose$params,
        query?: undefined,
        body: propose$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("hosting", "propose");

            const method = "post";
            const toPath = compile("hosting/api/:id/propose");
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
            sdk.checkPermission("hosting", "capacity");

            const method = "get";
            const toPath = compile("hosting/api/capacity");
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

    (methods.machine as any).__scope = "hosting";
    (methods.updateMachine as any).__scope = "hosting";
    (methods.requests as any).__scope = "hosting";
    (methods.accept as any).__scope = "hosting";
    (methods.decline as any).__scope = "hosting";
    (methods.acceptResize as any).__scope = "hosting";
    (methods.declineResize as any).__scope = "hosting";
    (methods.end as any).__scope = "hosting";
    (methods.moveTargets as any).__scope = "hosting";
    (methods.propose as any).__scope = "hosting";
    (methods.capacity as any).__scope = "hosting";

    sdk["_moduleGroup"].set(methods, "Billing");


    return methods;
};