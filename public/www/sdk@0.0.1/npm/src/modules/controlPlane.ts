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

export type overview$query = {
    range?: "1h" | "24h" | "7d";
};

export const controlPlaneModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        overview$query: overview$query,
    };

    const methods = {
        type,
        overview(data: {
        params?: undefined,
        query: overview$query,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("controlPlane", "overview");

            const method = "get";
            const toPath = compile("controlPlane/api/overview");
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

    (methods.overview as any).__scope = "controlPlane";

    sdk["_moduleGroup"].set(methods, "Admin");


    return methods;
};