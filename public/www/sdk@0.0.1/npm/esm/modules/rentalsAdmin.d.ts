import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
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
export declare const rentalsAdminModule: (sdk: typeof BaseSDK) => {
    readonly type: {
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
        listDisputes$query: listDisputes$query;
        listDisputes$return: listDisputes$return;
        resolveDispute$params: resolveDispute$params;
        resolveDispute$body: resolveDispute$body;
        listReverts$return: listReverts$return;
        decideRevert$params: decideRevert$params;
        decideRevert$body: decideRevert$body;
        listReports$return: listReports$return;
        closeReport$params: closeReport$params;
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
    readonly listDisputes: (data: {
        params?: undefined;
        query: listDisputes$query;
        body?: undefined;
    } & TRequestOptions<listDisputes$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<listDisputes$return, any, {}, any>>;
        readonly data: Promise<listDisputes$return>;
        then: <TResult1 = listDisputes$return, TResult2 = never>(onfulfilled?: ((value: listDisputes$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<listDisputes$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<listDisputes$return>;
    };
    readonly resolveDispute: (data: {
        params: resolveDispute$params;
        query?: undefined;
        body: resolveDispute$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly listReverts: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<listReverts$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<listReverts$return, any, {}, any>>;
        readonly data: Promise<listReverts$return>;
        then: <TResult1 = listReverts$return, TResult2 = never>(onfulfilled?: ((value: listReverts$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<listReverts$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<listReverts$return>;
    };
    readonly decideRevert: (data: {
        params: decideRevert$params;
        query?: undefined;
        body: decideRevert$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly listReports: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<listReports$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<listReports$return, any, {}, any>>;
        readonly data: Promise<listReports$return>;
        then: <TResult1 = listReports$return, TResult2 = never>(onfulfilled?: ((value: listReports$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<listReports$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<listReports$return>;
    };
    readonly closeReport: (data: {
        params: closeReport$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
};
//# sourceMappingURL=rentalsAdmin.d.ts.map