import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
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
        pastDueSince?: Date | undefined;
        lastError?: string | undefined;
        held?: boolean | undefined;
        uptime?: number | undefined;
        overDisk?: number | undefined;
        term?: {
            months: number;
            until?: Date | undefined;
        } | undefined;
        endAt?: Date | undefined;
        /** What starts at the renewal: a smaller size */
        nextSize?: {
            plan: string;
            price: number;
            at: Date;
        } | undefined;
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
        /** Fits on its machine now; else move it to one with room first */
        fits: boolean;
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
export type acceptResize$return = {
    /** active: applied now; scheduled: a smaller size, from the renewal */
    result: "active" | "scheduled" | "resumed";
    /** When a scheduled size starts */
    at?: Date | undefined;
};
export type declineResize$params = {
    id?: string;
};
export type declineResize$body = {
    reason: string;
};
export type retryRenewal$params = {
    id?: string;
};
export type retryRenewal$return = {
    status: string;
    lastError?: string | undefined;
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
export declare const hostingModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        machine$params: machine$params;
        machine$return: machine$return;
        updateMachine$params: updateMachine$params;
        updateMachine$body: updateMachine$body;
        requests$return: requests$return;
        accept$params: accept$params;
        decline$params: decline$params;
        decline$body: decline$body;
        acceptResize$params: acceptResize$params;
        acceptResize$return: acceptResize$return;
        declineResize$params: declineResize$params;
        declineResize$body: declineResize$body;
        retryRenewal$params: retryRenewal$params;
        retryRenewal$return: retryRenewal$return;
        end$params: end$params;
        end$return: end$return;
        moveTargets$params: moveTargets$params;
        moveTargets$return: moveTargets$return;
        propose$params: propose$params;
        propose$body: propose$body;
        capacity$return: capacity$return;
    };
    readonly machine: (data: {
        params: machine$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<machine$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<machine$return, any, {}, any>>;
        readonly data: Promise<machine$return>;
        then: <TResult1 = machine$return, TResult2 = never>(onfulfilled?: ((value: machine$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<machine$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<machine$return>;
    };
    readonly updateMachine: (data: {
        params: updateMachine$params;
        query?: undefined;
        body: updateMachine$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly requests: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<requests$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<requests$return, any, {}, any>>;
        readonly data: Promise<requests$return>;
        then: <TResult1 = requests$return, TResult2 = never>(onfulfilled?: ((value: requests$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<requests$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<requests$return>;
    };
    readonly accept: (data: {
        params: accept$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly decline: (data: {
        params: decline$params;
        query?: undefined;
        body: decline$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly acceptResize: (data: {
        params: acceptResize$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<acceptResize$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<acceptResize$return, any, {}, any>>;
        readonly data: Promise<acceptResize$return>;
        then: <TResult1 = acceptResize$return, TResult2 = never>(onfulfilled?: ((value: acceptResize$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<acceptResize$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<acceptResize$return>;
    };
    readonly declineResize: (data: {
        params: declineResize$params;
        query?: undefined;
        body: declineResize$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly retryRenewal: (data: {
        params: retryRenewal$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<retryRenewal$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<retryRenewal$return, any, {}, any>>;
        readonly data: Promise<retryRenewal$return>;
        then: <TResult1 = retryRenewal$return, TResult2 = never>(onfulfilled?: ((value: retryRenewal$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<retryRenewal$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<retryRenewal$return>;
    };
    readonly end: (data: {
        params: end$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<end$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<end$return, any, {}, any>>;
        readonly data: Promise<end$return>;
        then: <TResult1 = end$return, TResult2 = never>(onfulfilled?: ((value: end$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<end$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<end$return>;
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
    readonly propose: (data: {
        params: propose$params;
        query?: undefined;
        body: propose$body;
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
};
//# sourceMappingURL=hosting.d.ts.map