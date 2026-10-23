import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type app$params = {
    endpoint?: string[] | undefined;
};
export type index$params = {
    endpoint?: string[] | undefined;
};

export const indexModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        app$params: app$params,
        index$params: index$params,
    };

    const methods = {
        type,
        app(data: {
        params: app$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("index", "app");

            const method = "get";
            const toPath = compile("index/app{/*endpoint}");
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
        index(data: {
        params: index$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("index", "index");

            const method = "get";
            const toPath = compile("index{/*endpoint}");
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

    (methods.app as any).__scope = "index";
    (methods.index as any).__scope = "index";

    sdk["_moduleGroup"].set(methods, "Default");


    return methods;
};