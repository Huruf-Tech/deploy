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


export const homeModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
    };

    const methods = {
        type,
        status(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("home", "status");

            const method = "get";
            const toPath = compile("home/api/");
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

    (methods.status as any).__scope = "home";

    sdk["_moduleGroup"].set(methods, "Default");


    return methods;
};