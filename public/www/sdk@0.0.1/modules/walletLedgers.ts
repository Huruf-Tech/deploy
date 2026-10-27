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
        type: "credit" | "debit";
        description?: (string | {
            [K in string]: string;
        }) | undefined;
        purpose?: string | undefined;
        foreignRefType?: string | undefined;
        foreignRef?: string | undefined;
        reference: string;
        isRefund?: boolean | undefined;
        /** Reference to the original transaction if this is a refund */
        refundedReference?: string | undefined;
        isRefunded?: boolean | undefined;
        /** Reference to the refund transaction if this transaction has been refunded */
        refundReference?: string | undefined;
        idempotencyKey: string;
        currency: string;
        amount: number;
        previousBalance: number;
        tenant: string;
        wallet: string;
        oppositeTenant: string;
        oppositeWallet: string;
        executorUser?: string | undefined;
        tags?: string[] | undefined;
        metadata?: {
            [K in string]: any;
        } | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
        _id: string;
    }[];
};

export const walletLedgersModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        count$query: count$query,
        count$return: count$return,
        get$params: get$params,
        get$query: get$query,
        get$return: get$return,
    };

    const methods = {
        type,
        count(data: {
        params?: undefined,
        query: count$query,
        body?: undefined,
    } & TRequestOptions<count$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("walletLedgers", "count");

            const method = "get";
            const toPath = compile("walletLedgers/api/count");
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
            sdk.checkPermission("walletLedgers", "get");

            const method = "get";
            const toPath = compile("walletLedgers/api{/:id}");
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

    (methods.count as any).__scope = "walletLedgers";
    (methods.get as any).__scope = "walletLedgers";


    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"type":{"type":"string","enum":["credit","debit"],"canFilter":true,"label":"Type"},"description":{"anyOf":[{"type":"string"},{"type":"object","propertyNames":{"type":"string"},"additionalProperties":{"type":"string"}}]},"purpose":{"type":"string"},"foreignRefType":{"type":"string"},"foreignRef":{"type":"string"},"reference":{"type":"string","canFilter":true,"label":"Reference"},"isRefund":{"type":"boolean"},"refundedReference":{"description":"Reference to the original transaction if this is a refund","type":"string"},"isRefunded":{"type":"boolean"},"refundReference":{"description":"Reference to the refund transaction if this transaction has been refunded","type":"string"},"idempotencyKey":{"type":"string"},"currency":{"type":"string","minLength":3},"amount":{"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991,"canFilter":true,"label":"Amount"},"previousBalance":{"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991},"tenant":{"tsType":"string"},"wallet":{"tsType":"string"},"oppositeTenant":{"tsType":"string"},"oppositeWallet":{"tsType":"string"},"executorUser":{"tsType":"string"},"tags":{"type":"array","items":{"type":"string"}},"metadata":{"type":"object","propertyNames":{"type":"string"},"additionalProperties":{}},"createdAt":{"default":"2026-10-27T15:09:38.620Z","canFilter":true,"label":"Created At","type":"string","format":"date-time"},"updatedAt":{"default":"2026-10-27T15:09:38.620Z","canFilter":true,"label":"Updated At","type":"string","format":"date-time"}},"required":["type","reference","idempotencyKey","currency","amount","previousBalance","tenant","wallet","oppositeTenant","oppositeWallet","createdAt","updatedAt"],"additionalProperties":false}}});

    return methods;
};