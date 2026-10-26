import type { 
    TRequestOptions,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type get$return = {
    plan: {
        _id?: string | undefined;
        name: string;
    };
    source: "period" | "free";
    limits: {
        servers: number;
        projects: number;
        members: number;
        releasesKept: number;
        variablesPerScope: number;
        deploysPerHour: number;
        concurrentTerminals: number;
        concurrentStreams: number;
        variableApiReadsPerMinute: number;
        templates: number;
        alertRules: number;
        gitIntegrations: number;
        registries: number;
        domains: number;
        aiRequestsPerMonth: number;
    };
    features: {
        blueGreen: boolean;
        autoscale: boolean;
        privateNetwork: boolean;
        backups: boolean;
        aiAssistant: boolean;
    };
    period?: {
        periodStart: Date;
        periodEnd: Date;
        kind: "paid" | "complimentary";
    } | undefined;
    subscription?: {
        status: "requested" | "rejected" | "active" | "pastDue" | "suspended" | "released" | "canceled";
        autoRenew: boolean;
        cancelAtPeriodEnd: boolean;
        currentPeriodEnd?: Date | undefined;
        nextRenewalAttemptAt?: Date | undefined;
        lastError?: string | undefined;
        nextPlan?: string | undefined;
    } | undefined;
    usage: {
        [K in string]: number;
    };
    overLimitSince?: Date | undefined;
    graceDays: number;
    wallets: {
        currency: string;
        balance: number;
    }[];
    isOwner: boolean;
    paymentsReady: boolean;
};
export type plans$return = {
    name: string;
    kind: "workspace" | "server";
    resources?: {
        vcpu: number;
        memMb: number;
        diskGb: number;
        trafficGb: number;
    } | undefined;
    custom?: boolean | undefined;
    class?: string | undefined;
    slug: string;
    description?: string | undefined;
    visibility: "public" | "private";
    price: {
        amount: number;
        currency: string;
        interval: "month" | "year";
    };
    limits: {
        servers: number;
        projects: number;
        members: number;
        releasesKept: number;
        variablesPerScope: number;
        deploysPerHour: number;
        concurrentTerminals: number;
        concurrentStreams: number;
        variableApiReadsPerMinute: number;
        templates: number;
        alertRules: number;
        gitIntegrations: number;
        registries: number;
        domains: number;
        aiRequestsPerMonth: number;
    };
    features: {
        blueGreen: boolean;
        autoscale: boolean;
        privateNetwork: boolean;
        backups: boolean;
        aiAssistant: boolean;
    };
    isFree: boolean;
    active: boolean;
    sortOrder: number;
    updatedAt: Date;
    _id: string;
}[];
export type periods$return = {
    periodStart: Date;
    periodEnd: Date;
    amount: number;
    currency: string;
    kind: "paid" | "complimentary";
    note?: string | undefined;
    ledgerReference?: string | undefined;
    scope?: ("workspace" | "server") | undefined;
    _id: string;
    planName?: string | undefined;
}[];
export type quote$query = {
    plan?: string;
};
export type quote$return = {
    change: "now" | "scheduled";
    price: number;
    currency: string;
    /** Unused time of the current period */
    credit: number;
    /** Charged now */
    due: number;
    /** Credit beyond the price, back to the wallet */
    refund: number;
};
export type subscribe$body = {
    plan?: string;
};
export type subscribe$return = {
    result: "active" | "scheduled" | "resumed" | "pending";
    /** When a scheduled change applies */
    at?: Date | undefined;
    topup?: string | undefined;
    clientSecret?: string | undefined;
};

export const billingModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        get$return: get$return,
        plans$return: plans$return,
        periods$return: periods$return,
        quote$query: quote$query,
        quote$return: quote$return,
        subscribe$body: subscribe$body,
        subscribe$return: subscribe$return,
    };

    const methods = {
        type,
        get(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<get$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("billing", "get");

            const method = "get";
            const toPath = compile("billing/api/");
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
        plans(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<plans$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("billing", "plans");

            const method = "get";
            const toPath = compile("billing/api/plans");
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
        periods(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<periods$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("billing", "periods");

            const method = "get";
            const toPath = compile("billing/api/periods");
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
            sdk.checkPermission("billing", "quote");

            const method = "get";
            const toPath = compile("billing/api/quote");
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
        subscribe(data: {
        params?: undefined,
        query?: undefined,
        body: subscribe$body,
    } & TRequestOptions<subscribe$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("billing", "subscribe");

            const method = "post";
            const toPath = compile("billing/api/subscribe");
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
        cancel(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("billing", "cancel");

            const method = "post";
            const toPath = compile("billing/api/cancel");
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

    (methods.get as any).__scope = "billing";
    (methods.plans as any).__scope = "billing";
    (methods.periods as any).__scope = "billing";
    (methods.quote as any).__scope = "billing";
    (methods.subscribe as any).__scope = "billing";
    (methods.cancel as any).__scope = "billing";

    sdk["_moduleGroup"].set(methods, "Billing");


    return methods;
};