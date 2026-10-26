import type { 
    TRequestOptions,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type config$return = {
    configured: boolean;
    gateway: "stripe";
    publishableKey: string;
};
export type summary$return = {
    balance: number;
    currency: string;
    hasCard: boolean;
    isOwner: boolean;
};
export type statement$return = {
    balance: number;
    entries: {
        _id: string;
        type: string;
        amount: number;
        description?: string | undefined;
        purpose?: string | undefined;
        reference: string;
        createdAt?: Date | undefined;
    }[];
};
export type addFunds$body = {
    /** Cents */
    amount: number;
    nonce: string;
};
export type addFunds$return = {
    status: "completed" | "pending";
    topup: string;
    clientSecret?: string | undefined;
};
export type topupStatus$params = {
    id?: string;
};
export type topupStatus$return = {
    status: string;
    amount: number;
    error?: string | undefined;
};
export type flaggedCharge$return = {
    charge: {
        topup: string;
        amount: number;
        clientSecret: string;
        cardRef: string;
    } | null;
};
export type cards$return = {
    autoPay: boolean;
    actionRequired?: {
        message: string;
        at: Date;
    } | undefined;
    cards: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
        isDefault: boolean;
        _id: string;
        expired: boolean;
    }[];
};
export type setupCard$return = {
    clientSecret: string;
    setupRef: string;
};
export type finishCard$body = {
    setupRef: string;
};
export type finishCard$return = {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
    _id: string;
    expired: boolean;
};
export type setDefaultCard$params = {
    id?: string;
};
export type removeCard$params = {
    id?: string;
};
export type updateAccount$body = {
    autoPay: boolean;
};

export const paymentsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        config$return: config$return,
        summary$return: summary$return,
        statement$return: statement$return,
        addFunds$body: addFunds$body,
        addFunds$return: addFunds$return,
        topupStatus$params: topupStatus$params,
        topupStatus$return: topupStatus$return,
        flaggedCharge$return: flaggedCharge$return,
        cards$return: cards$return,
        setupCard$return: setupCard$return,
        finishCard$body: finishCard$body,
        finishCard$return: finishCard$return,
        setDefaultCard$params: setDefaultCard$params,
        removeCard$params: removeCard$params,
        updateAccount$body: updateAccount$body,
    };

    const methods = {
        type,
        config(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<config$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "config");

            const method = "get";
            const toPath = compile("payments/api/config");
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
        summary(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<summary$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "summary");

            const method = "get";
            const toPath = compile("payments/api/summary");
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
        statement(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<statement$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "statement");

            const method = "get";
            const toPath = compile("payments/api/statement");
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
        addFunds(data: {
        params?: undefined,
        query?: undefined,
        body: addFunds$body,
    } & TRequestOptions<addFunds$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "addFunds");

            const method = "post";
            const toPath = compile("payments/api/add-funds");
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
        topupStatus(data: {
        params: topupStatus$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<topupStatus$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "topupStatus");

            const method = "get";
            const toPath = compile("payments/api/topups/:id");
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
        flaggedCharge(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<flaggedCharge$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "flaggedCharge");

            const method = "get";
            const toPath = compile("payments/api/flagged");
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
        cards(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<cards$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "cards");

            const method = "get";
            const toPath = compile("payments/api/cards");
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
        setupCard(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<setupCard$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "setupCard");

            const method = "post";
            const toPath = compile("payments/api/cards/setup");
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
        finishCard(data: {
        params?: undefined,
        query?: undefined,
        body: finishCard$body,
    } & TRequestOptions<finishCard$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "finishCard");

            const method = "post";
            const toPath = compile("payments/api/cards/finish");
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
        setDefaultCard(data: {
        params: setDefaultCard$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "setDefaultCard");

            const method = "post";
            const toPath = compile("payments/api/cards/:id/default");
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
        removeCard(data: {
        params: removeCard$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "removeCard");

            const method = "delete";
            const toPath = compile("payments/api/cards/:id");
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
        updateAccount(data: {
        params?: undefined,
        query?: undefined,
        body: updateAccount$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "updateAccount");

            const method = "patch";
            const toPath = compile("payments/api/account");
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
        webhook(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("payments", "webhook");

            const method = "post";
            const toPath = compile("payments/api/webhook/:gateway");
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

    (methods.config as any).__scope = "payments";
    (methods.summary as any).__scope = "payments";
    (methods.statement as any).__scope = "payments";
    (methods.addFunds as any).__scope = "payments";
    (methods.topupStatus as any).__scope = "payments";
    (methods.flaggedCharge as any).__scope = "payments";
    (methods.cards as any).__scope = "payments";
    (methods.setupCard as any).__scope = "payments";
    (methods.finishCard as any).__scope = "payments";
    (methods.setDefaultCard as any).__scope = "payments";
    (methods.removeCard as any).__scope = "payments";
    (methods.updateAccount as any).__scope = "payments";
    (methods.webhook as any).__scope = "payments";

    sdk["_moduleGroup"].set(methods, "Billing");


    return methods;
};