import type { 
    TRequestOptions,
    TFilterValue,
    TFilterExpression,
    TMultiFilters,
    TFilters,
    TPagination,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type subscriptions$query = {
    status?: ("active" | "pastDue" | "canceled") | undefined;
    limit?: number;
};
export type subscriptions$return = {
    status: "active" | "pastDue" | "canceled";
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd?: Date | undefined;
    lastError?: string | undefined;
    _id: string;
    tenant: string;
    tenantName?: string | undefined;
    planName?: string | undefined;
}[];
export type grant$body = {
    tenant?: string;
    plan?: string;
    days: number;
    /** Why, e.g. partner or trial */
    note: string;
};

export const billingAdminModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        subscriptions$query: subscriptions$query,
        subscriptions$return: subscriptions$return,
        grant$body: grant$body,
    };

    const methods = {
        type,
        subscriptions(data: {
        params?: undefined,
        query: subscriptions$query,
        body?: undefined,
    } & TRequestOptions<subscriptions$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("billingAdmin", "subscriptions");

            const method = "get";
            const toPath = compile("billingAdmin/api/subscriptions");
            const requestPayload = {
                method,
                url: toPath(data?.params),
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
        grant(data: {
        params?: undefined,
        query?: undefined,
        body: grant$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("billingAdmin", "grant");

            const method = "post";
            const toPath = compile("billingAdmin/api/grant");
            const requestPayload = {
                method,
                url: toPath(data?.params),
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

    (methods.subscriptions as any).__scope = "billingAdmin";
    (methods.grant as any).__scope = "billingAdmin";

    sdk["_moduleGroup"].set(methods, "Admin");


    return methods;
};