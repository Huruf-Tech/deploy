import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

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

export const marketModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        machines$query: machines$query,
        machines$return: machines$return,
        quote$query: quote$query,
        quote$return: quote$return,
    };

    const methods = {
        type,
        machines(data: {
        params?: undefined,
        query: machines$query,
        body?: undefined,
    } & TRequestOptions<machines$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("market", "machines");

            const method = "get";
            const toPath = compile("market/api/machines");
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
            sdk.checkPermission("market", "quote");

            const method = "get";
            const toPath = compile("market/api/quote");
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

    (methods.machines as any).__scope = "market";
    (methods.quote as any).__scope = "market";

    sdk["_moduleGroup"].set(methods, "Billing");


    return methods;
};