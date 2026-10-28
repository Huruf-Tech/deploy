import type { 
    TRequestOptions,
    TFilters,
    TPagination,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type count$query = {
    /** Client side filters */
    filters?: TFilters | undefined;
    /** Client side sub-filters (Just a second layer of filters) */
    subFilters?: TFilters | undefined;
};
export type count$return = {
    count: number;
};
export type get$params = {
    id?: string | undefined;
};
export type get$query = TPagination;
export type get$return = {
    results: {
        status: "initiated" | "pending" | "paid" | "processing" | "completed" | "failed";
        tenant: string;
        currency: string;
        amount: number;
        provider?: string | undefined;
        providerRef?: string | undefined;
        idempotencyKey?: string | undefined;
        transfer?: {
            fromTenant: string;
            toTenant: string;
            currency: string;
            amount: number;
            reference: string;
            idempotencyKey: string;
            user?: string | undefined;
            purpose?: string | undefined;
            description?: (string | {
                [K in string]: string;
            }) | undefined;
            foreignRefType?: string | undefined;
            foreignRef?: string | undefined;
            tags?: string[] | undefined;
            metadata?: {
                [K in string]: string | number | boolean;
            } | undefined;
            allowOverdraft?: boolean | undefined;
            overdraftLimit?: number | undefined;
        } | undefined;
        topupReference?: string | undefined;
        resumedReference?: string | undefined;
        error?: string | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
        _id: string;
    }[];
};

export const walletTopupsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        count$query: count$query,
        count$return: count$return,
        get$params: get$params,
        get$query: get$query,
        get$return: get$return,
    };

    const methods = {
        type,
        webhook(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("walletTopups", "webhook");

            const method = "post";
            const toPath = compile("walletTopups/api/webhook");
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
        count(data: {
        params?: undefined,
        query: count$query,
        body?: undefined,
    } & TRequestOptions<count$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("walletTopups", "count");

            const method = "get";
            const toPath = compile("walletTopups/api/count");
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
        get(data: {
        params: get$params,
        query: get$query,
        body?: undefined,
    } & TRequestOptions<get$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("walletTopups", "get");

            const method = "get";
            const toPath = compile("walletTopups/api{/:id}");
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

    (methods.webhook as any).__scope = "walletTopups";
    (methods.count as any).__scope = "walletTopups";
    (methods.get as any).__scope = "walletTopups";


    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"status":{"type":"string","enum":["initiated","pending","paid","processing","completed","failed"],"canFilter":true,"label":"Status"},"tenant":{"tsType":"string"},"currency":{"type":"string","minLength":3},"amount":{"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991,"canFilter":true,"label":"Amount"},"provider":{"canFilter":true,"label":"Provider","type":"string"},"providerRef":{"canFilter":true,"label":"Provider Ref","type":"string"},"idempotencyKey":{"type":"string"},"transfer":{"type":"object","properties":{"fromTenant":{"tsType":"string"},"toTenant":{"tsType":"string"},"currency":{"type":"string","minLength":3},"amount":{"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991},"reference":{"type":"string"},"idempotencyKey":{"type":"string"},"user":{"tsType":"string"},"purpose":{"type":"string"},"description":{"anyOf":[{"type":"string"},{"type":"object","propertyNames":{"type":"string"},"additionalProperties":{"type":"string"}}]},"foreignRefType":{"type":"string"},"foreignRef":{"type":"string"},"tags":{"type":"array","items":{"type":"string"}},"metadata":{"type":"object","propertyNames":{"type":"string"},"additionalProperties":{"type":["string","number","boolean"]}},"allowOverdraft":{"type":"boolean"},"overdraftLimit":{"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991}},"required":["fromTenant","toTenant","currency","amount","reference","idempotencyKey"],"additionalProperties":false},"topupReference":{"type":"string"},"resumedReference":{"type":"string"},"error":{"type":"string"},"createdAt":{"default":"2026-10-28T20:26:27.452Z","canFilter":true,"label":"Created At","type":"string","format":"date-time"},"updatedAt":{"default":"2026-10-28T20:26:27.452Z","type":"string","format":"date-time"}},"required":["status","tenant","currency","amount","createdAt","updatedAt"],"additionalProperties":false}}});

    return methods;
};