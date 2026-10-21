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

export type get$params = {
    id?: string | undefined;
};
export type get$query = TPagination;
export type get$return = {
    results: {
        user: string;
        email?: string | undefined;
        role?: string | undefined;
        isOwner: boolean;
        expiresAt?: Date | undefined;
        createdBy: string;
        createdAt: Date | undefined;
        tenant: {
            name: string;
            logo?: string | undefined;
            createdBy: string;
            createdAt: Date | undefined;
            _id: string;
        };
        _id: string;
    }[];
};

export const tenantMembershipsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        get$params: get$params,
        get$query: get$query,
        get$return: get$return,
    };

    const methods = {
        type,
        get(data: {
        params: get$params,
        query: get$query,
        body?: undefined,
    } & TRequestOptions<get$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("tenantMemberships", "get");

            const method = "get";
            const toPath = compile("tenantMemberships/api/");
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

    (methods.get as any).__scope = "tenantMemberships";



    return methods;
};