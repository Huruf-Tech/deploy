import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
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
export declare const rentalsAdminModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        queue$return: queue$return;
        placement$params: placement$params;
        placement$return: placement$return;
        approve$params: approve$params;
        approve$body: approve$body;
        reject$params: reject$params;
        reject$body: reject$body;
        approveResize$params: approveResize$params;
        rejectResize$params: rejectResize$params;
        rejectResize$body: rejectResize$body;
        suspend$params: suspend$params;
        suspend$body: suspend$body;
        resume$params: resume$params;
        terminate$params: terminate$params;
        terminate$body: terminate$body;
        moveTargets$params: moveTargets$params;
        moveTargets$return: moveTargets$return;
        move$params: move$params;
        move$body: move$body;
        cancelMove$params: cancelMove$params;
        capacity$return: capacity$return;
        waiting$return: waiting$return;
        recreatePartition$params: recreatePartition$params;
        recreatePartition$body: recreatePartition$body;
        refund$params: refund$params;
        refund$body: refund$body;
        refund$return: refund$return;
        pool$params: pool$params;
        pool$return: pool$return;
        updatePool$params: updatePool$params;
        updatePool$body: updatePool$body;
    };
    readonly queue: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<queue$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<queue$return, any, {}, any>>;
        readonly data: Promise<queue$return>;
        then: <TResult1 = queue$return, TResult2 = never>(onfulfilled?: ((value: queue$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<queue$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<queue$return>;
    };
    readonly placement: (data: {
        params: placement$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<placement$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<placement$return, any, {}, any>>;
        readonly data: Promise<placement$return>;
        then: <TResult1 = placement$return, TResult2 = never>(onfulfilled?: ((value: placement$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<placement$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<placement$return>;
    };
    readonly approve: (data: {
        params: approve$params;
        query?: undefined;
        body: approve$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly reject: (data: {
        params: reject$params;
        query?: undefined;
        body: reject$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly approveResize: (data: {
        params: approveResize$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly rejectResize: (data: {
        params: rejectResize$params;
        query?: undefined;
        body: rejectResize$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly suspend: (data: {
        params: suspend$params;
        query?: undefined;
        body: suspend$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly resume: (data: {
        params: resume$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly terminate: (data: {
        params: terminate$params;
        query?: undefined;
        body: terminate$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly moveTargets: (data: {
        params: moveTargets$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<moveTargets$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<moveTargets$return, any, {}, any>>;
        readonly data: Promise<moveTargets$return>;
        then: <TResult1 = moveTargets$return, TResult2 = never>(onfulfilled?: ((value: moveTargets$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<moveTargets$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<moveTargets$return>;
    };
    readonly move: (data: {
        params: move$params;
        query?: undefined;
        body: move$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly cancelMove: (data: {
        params: cancelMove$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly capacity: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<capacity$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<capacity$return, any, {}, any>>;
        readonly data: Promise<capacity$return>;
        then: <TResult1 = capacity$return, TResult2 = never>(onfulfilled?: ((value: capacity$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<capacity$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<capacity$return>;
    };
    readonly waiting: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<waiting$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<waiting$return, any, {}, any>>;
        readonly data: Promise<waiting$return>;
        then: <TResult1 = waiting$return, TResult2 = never>(onfulfilled?: ((value: waiting$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<waiting$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<waiting$return>;
    };
    readonly recreatePartition: (data: {
        params: recreatePartition$params;
        query?: undefined;
        body: recreatePartition$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly refund: (data: {
        params: refund$params;
        query?: undefined;
        body: refund$body;
    } & TRequestOptions<refund$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<refund$return, any, {}, any>>;
        readonly data: Promise<refund$return>;
        then: <TResult1 = refund$return, TResult2 = never>(onfulfilled?: ((value: refund$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<refund$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<refund$return>;
    };
    readonly pool: (data: {
        params: pool$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<pool$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<pool$return, any, {}, any>>;
        readonly data: Promise<pool$return>;
        then: <TResult1 = pool$return, TResult2 = never>(onfulfilled?: ((value: pool$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<pool$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<pool$return>;
    };
    readonly updatePool: (data: {
        params: updatePool$params;
        query?: undefined;
        body: updatePool$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
};
//# sourceMappingURL=rentalsAdmin.d.ts.map