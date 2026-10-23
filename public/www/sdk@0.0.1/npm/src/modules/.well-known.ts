import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type oauthServerMeta$params = {
    endpoint?: string[] | undefined;
};
export type openidConfig$params = {
    endpoint?: string[] | undefined;
};

export const wellKnownModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        oauthServerMeta$params: oauthServerMeta$params,
        openidConfig$params: openidConfig$params,
    };

    const methods = {
        type,
        oauthServerMeta(data: {
        params: oauthServerMeta$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("wellKnown", "oauthServerMeta");

            const method = "get";
            const toPath = compile(".well-known/oauth-authorization-server{/*endpoint}");
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
        openidConfig(data: {
        params: openidConfig$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("wellKnown", "openidConfig");

            const method = "get";
            const toPath = compile(".well-known/openid-configuration{/*endpoint}");
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

    (methods.oauthServerMeta as any).__scope = "wellKnown";
    (methods.openidConfig as any).__scope = "wellKnown";

    sdk["_moduleGroup"].set(methods, "Default");


    return methods;
};