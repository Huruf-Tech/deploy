import type { 
    TRequestOptions,
    TFilters,
    TPagination,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type metadata$return = {
    defaultCurrency: string;
    availableCurrencies: string[];
};
export type signTransfer$query = {
    receiver: string;
    amount: number;
    description?: string | undefined;
    metadata?: {
        [K in string]: string | number | boolean;
    } | undefined;
    currency?: string | undefined;
};
export type signTransfer$return = {
    sender: {
        tenant: string;
        user: string;
        name: string;
        image?: string | undefined;
    };
    receiver: {
        tenant: string;
        user: string;
        name: string;
        image?: string | undefined;
        tenantName: string;
        tenantLogo?: string | undefined;
    };
    transactionDetails: {
        type?: string | undefined;
        currency: string;
        amount: number;
        fee: number;
        feeStructure: {
            total: number;
            breakdown: {
                tenant: unknown;
                name: string;
                amount: number;
            }[];
        };
        description?: string | undefined;
        metadata?: {
            [K in string]: string | number | boolean;
        } | undefined;
    };
    challenge: {
        token: string;
    };
};
export type transfer$body = {
    method?: string | undefined;
    token: string;
    tags?: string[] | undefined;
};
export type transfer$return = {
    transaction: {
        reference: string;
        idempotencyKey: string;
        debit: string;
        credit: string;
    };
};
export type addBalance$body = {
    amount: number;
    currency?: string | undefined;
    idempotencyKey?: string | undefined;
};
export type addBalance$return = {
    status: string;
    balance: number;
    toppedUp: number;
    topup?: string | undefined;
};
export type updateOverdraftLimit$body = {
    userId?: string;
    tenantId?: string;
    limit: number;
};
export type getOverdraftLimit$query = {
    userId?: string;
    tenantId?: string;
};
export type getOverdraftLimit$return = {
    overdraftLimit: number;
};
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
        currency: string;
        balance: number;
        overdraftLimit: number;
        previousBalance: number;
        lastRef?: string | undefined;
        user: string;
        tenant: string;
        negativeAt?: (Date | null) | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
        _id: string;
    }[];
};

export const walletsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        metadata$return: metadata$return,
        signTransfer$query: signTransfer$query,
        signTransfer$return: signTransfer$return,
        transfer$body: transfer$body,
        transfer$return: transfer$return,
        addBalance$body: addBalance$body,
        addBalance$return: addBalance$return,
        updateOverdraftLimit$body: updateOverdraftLimit$body,
        getOverdraftLimit$query: getOverdraftLimit$query,
        getOverdraftLimit$return: getOverdraftLimit$return,
        count$query: count$query,
        count$return: count$return,
        get$params: get$params,
        get$query: get$query,
        get$return: get$return,
    };

    const methods = {
        type,
        metadata(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<metadata$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("wallets", "metadata");

            const method = "get";
            const toPath = compile("wallets/api/metadata");
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
        signTransfer(data: {
        params?: undefined,
        query: signTransfer$query,
        body?: undefined,
    } & TRequestOptions<signTransfer$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("wallets", "signTransfer");

            const method = "get";
            const toPath = compile("wallets/api/transfer/sign");
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
        transfer(data: {
        params?: undefined,
        query?: undefined,
        body: transfer$body,
    } & TRequestOptions<transfer$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("wallets", "transfer");

            const method = "post";
            const toPath = compile("wallets/api/transfer");
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
        addBalance(data: {
        params?: undefined,
        query?: undefined,
        body: addBalance$body,
    } & TRequestOptions<addBalance$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("wallets", "addBalance");

            const method = "post";
            const toPath = compile("wallets/api/add-balance");
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
        updateOverdraftLimit(data: {
        params?: undefined,
        query?: undefined,
        body: updateOverdraftLimit$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("wallets", "updateOverdraftLimit");

            const method = "post";
            const toPath = compile("wallets/api/update/overdraft-limit");
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
        getOverdraftLimit(data: {
        params?: undefined,
        query: getOverdraftLimit$query,
        body?: undefined,
    } & TRequestOptions<getOverdraftLimit$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("wallets", "getOverdraftLimit");

            const method = "get";
            const toPath = compile("wallets/api/overdraft-limit");
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
            sdk.checkPermission("wallets", "count");

            const method = "get";
            const toPath = compile("wallets/api/count");
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
            sdk.checkPermission("wallets", "get");

            const method = "get";
            const toPath = compile("wallets/api{/:id}");
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

    (methods.metadata as any).__scope = "wallets";
    (methods.signTransfer as any).__scope = "wallets";
    (methods.transfer as any).__scope = "wallets";
    (methods.addBalance as any).__scope = "wallets";
    (methods.updateOverdraftLimit as any).__scope = "wallets";
    (methods.getOverdraftLimit as any).__scope = "wallets";
    (methods.count as any).__scope = "wallets";
    (methods.get as any).__scope = "wallets";


    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"currency":{"type":"string","minLength":3},"balance":{"default":0,"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991},"overdraftLimit":{"default":0,"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991},"previousBalance":{"default":0,"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991},"lastRef":{"type":"string"},"user":{"tsType":"string"},"tenant":{"tsType":"string"},"negativeAt":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}]},"createdAt":{"default":"2026-10-26T22:46:57.867Z","type":"string","format":"date-time"},"updatedAt":{"default":"2026-10-26T22:46:57.867Z","type":"string","format":"date-time"}},"required":["currency","balance","overdraftLimit","previousBalance","user","tenant","createdAt","updatedAt"],"additionalProperties":false}}});

    return methods;
};