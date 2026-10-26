import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
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
export declare const rentalsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        catalog$return: catalog$return;
        quote$query: quote$query;
        quote$return: quote$return;
        list$return: list$return;
        request$body: request$body;
        request$return: request$return;
        withdraw$params: withdraw$params;
        resize$params: resize$params;
        resize$body: resize$body;
        cancel$params: cancel$params;
    };
    readonly catalog: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<catalog$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<catalog$return, any, {}, any>>;
        readonly data: Promise<catalog$return>;
        then: <TResult1 = catalog$return, TResult2 = never>(onfulfilled?: ((value: catalog$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<catalog$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<catalog$return>;
    };
    readonly quote: (data: {
        params?: undefined;
        query: quote$query;
        body?: undefined;
    } & TRequestOptions<quote$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<quote$return, any, {}, any>>;
        readonly data: Promise<quote$return>;
        then: <TResult1 = quote$return, TResult2 = never>(onfulfilled?: ((value: quote$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<quote$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<quote$return>;
    };
    readonly list: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<list$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<list$return, any, {}, any>>;
        readonly data: Promise<list$return>;
        then: <TResult1 = list$return, TResult2 = never>(onfulfilled?: ((value: list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<list$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<list$return>;
    };
    readonly request: (data: {
        params?: undefined;
        query?: undefined;
        body: request$body;
    } & TRequestOptions<request$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<request$return, any, {}, any>>;
        readonly data: Promise<request$return>;
        then: <TResult1 = request$return, TResult2 = never>(onfulfilled?: ((value: request$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<request$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<request$return>;
    };
    readonly withdraw: (data: {
        params: withdraw$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly resize: (data: {
        params: resize$params;
        query?: undefined;
        body: resize$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly cancel: (data: {
        params: cancel$params;
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
//# sourceMappingURL=rentals.d.ts.map