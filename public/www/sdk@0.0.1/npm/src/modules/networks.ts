import type { 
    TRequestOptions,
    TFilterValue,
    TFilterExpression,
    TMultiFilters,
    TFilters,
    TPagination,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type get$return = {
    primaryServer?: string | undefined;
    servers: {
        _id: string;
        name: string;
        enabled: boolean;
        meshIp: string;
        subnet: string;
        endpoint?: string | undefined;
        endpointOverride?: string | undefined;
        /** Its agent reported a WireGuard key */
        joined: boolean;
        online: boolean;
        error?: string | undefined;
        reportedAt?: string | undefined;
    }[];
    reachability: {
        from: string;
        to: string;
        /** null when either side is out of the mesh */
        reachable: boolean | null;
    }[];
};
export type updateMember$params = {
    id?: string;
};
export type updateMember$body = {
    enabled?: boolean | undefined;
    /** How peers reach this server; null returns to the detected address */
    endpoint?: (string | null) | undefined;
};
export type setPrimary$body = {
    server?: string | null;
};

export const networksModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        get$return: get$return,
        updateMember$params: updateMember$params,
        updateMember$body: updateMember$body,
        setPrimary$body: setPrimary$body,
    };

    const methods = {
        type,
        get(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<get$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("networks", "get");

            const method = "get";
            const toPath = compile("networks/api/");
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
        updateMember(data: {
        params: updateMember$params,
        query?: undefined,
        body: updateMember$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("networks", "updateMember");

            const method = "patch";
            const toPath = compile("networks/api/servers/:id");
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
        setPrimary(data: {
        params?: undefined,
        query?: undefined,
        body: setPrimary$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("networks", "setPrimary");

            const method = "post";
            const toPath = compile("networks/api/primary");
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

    (methods.get as any).__scope = "networks";
    (methods.updateMember as any).__scope = "networks";
    (methods.setPrimary as any).__scope = "networks";

    sdk["_moduleGroup"].set(methods, "Infrastructure");


    return methods;
};