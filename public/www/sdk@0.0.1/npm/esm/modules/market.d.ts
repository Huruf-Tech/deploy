import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type machines$query = {
    country?: string | undefined;
    source?: ("official" | "community") | undefined;
    dedicated?: ("true" | "false") | undefined;
    newArrivals?: ("true" | "false") | undefined;
    tier?: ("Basic" | "Standard" | "Performance") | undefined;
    disk?: ("NVMe" | "SSD" | "HDD") | undefined;
    minRating?: number | undefined;
    maxRttMs?: number | undefined;
    minUptime?: number | undefined;
    minVcpu?: number | undefined;
    minMemMb?: number | undefined;
    minDiskGb?: number | undefined;
    sort?: ("price" | "rating" | "uptime" | "latency") | undefined;
};
export type machines$return = {
    _id: string;
    name: string;
    /** Huruf's own machine */
    official: boolean;
    /** The owner's workspace */
    owner?: string | undefined;
    yours: boolean;
    /** Measured for less than 6 months */
    newArrival: boolean;
    measuredDays: number;
    country?: string | undefined;
    free: {
        cpus: number;
        memMb: number;
        diskGb: number;
    };
    total: {
        cpus: number;
        memMb: number;
        diskGb: number;
    };
    prices: {
        /** Cents per hour; traffic: cents per GB over */
        hourly: {
            vcpu: number;
            memGb: number;
            diskGb: number;
            whole?: number | undefined;
            trafficGb: number;
        };
        /** Cents per month (730 hours) */
        monthly: {
            vcpu: number;
            memGb: number;
            diskGb: number;
            whole?: number | undefined;
        };
        trafficGb: number;
    };
    trafficPerVcpuGb: number;
    /** Added to every partition, at the memory price */
    overheadMb: number;
    autoAccept: boolean;
    rating?: number | undefined;
    tier?: ("Basic" | "Standard" | "Performance") | undefined;
    disk?: ("NVMe" | "SSD" | "HDD") | undefined;
    rttMs?: number | undefined;
    uptime30d?: number | undefined;
    uptime90d?: number | undefined;
    steal?: number | undefined;
    virtualization?: string | undefined;
    /** Can be rented whole now */
    dedicated: boolean;
    /** From memory per vCPU */
    family: "General purpose" | "Compute optimized" | "Memory optimized";
    /** Its host takes CPU from it at times */
    burstable: boolean;
    renters?: {
        stars: number;
        count: number;
    } | undefined;
}[];
export type quote$query = {
    machine?: string;
    rental?: string | undefined;
    whole?: ("true" | "false") | undefined;
    vcpu?: number | undefined;
    memMb?: number | undefined;
    diskGb?: number | undefined;
};
export type quote$return = {
    /** Cents per month */
    price: number;
    /** Cents per hour */
    hourly: number;
    /** Included per month */
    trafficGb: number;
    trafficRatePerGb: number;
    overheadMb: number;
    fits: boolean;
    resources: {
        vcpu: number;
        memMb: number;
        diskGb: number;
    };
};
export declare const marketModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        machines$query: machines$query;
        machines$return: machines$return;
        quote$query: quote$query;
        quote$return: quote$return;
    };
    readonly machines: (data: {
        params?: undefined;
        query: machines$query;
        body?: undefined;
    } & TRequestOptions<machines$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<machines$return, any, {}, any>>;
        readonly data: Promise<machines$return>;
        then: <TResult1 = machines$return, TResult2 = never>(onfulfilled?: ((value: machines$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<machines$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<machines$return>;
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
};
//# sourceMappingURL=market.d.ts.map