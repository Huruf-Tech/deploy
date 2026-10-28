import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type summary$return = {
    /** Cents claimable now */
    available: number;
    /** Released but frozen by an open dispute */
    frozen: number;
    /** Waiting its 14 days */
    held: number;
    /** Expected from the running months */
    pending: number;
    security: {
        machine: string;
        name?: string | undefined;
        amount: number;
    }[];
    entries: {
        _id: string;
        type: string;
        bucket: string;
        amount: number;
        machine?: string | undefined;
        availableAt: Date;
        createdAt: Date;
        revert?: ("done" | "pending" | "rejected") | undefined;
    }[];
};
export type claim$body = {
    amount: number;
};
export type claim$return = {
    claim: string;
};
export type revert$params = {
    id?: string;
};
export type revert$return = {
    result: "reverted" | "requested";
    /** Cents: taken back, or the most an admin can */
    amount: number;
};

export const earningsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        summary$return: summary$return,
        claim$body: claim$body,
        claim$return: claim$return,
        revert$params: revert$params,
        revert$return: revert$return,
    };

    const methods = {
        type,
        summary(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<summary$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("earnings", "summary");

            const method = "get";
            const toPath = compile("earnings/api/");
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
        claim(data: {
        params?: undefined,
        query?: undefined,
        body: claim$body,
    } & TRequestOptions<claim$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("earnings", "claim");

            const method = "post";
            const toPath = compile("earnings/api/claim");
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
        revert(data: {
        params: revert$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<revert$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("earnings", "revert");

            const method = "post";
            const toPath = compile("earnings/api/claims/:id/revert");
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

    (methods.summary as any).__scope = "earnings";
    (methods.claim as any).__scope = "earnings";
    (methods.revert as any).__scope = "earnings";

    sdk["_moduleGroup"].set(methods, "Billing");


    return methods;
};