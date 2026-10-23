import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type branding$return = {
    name: string;
    description?: string | undefined;
    logo?: string | undefined;
    heroImage?: string | undefined;
    heroTitle?: string | undefined;
    homepageURL?: string | undefined;
    termsURL?: string | undefined;
    privacyURL?: string | undefined;
    theme: {
        [K in string]: string;
    };
    hidePoweredBy?: boolean | undefined;
};
export type capabilities$return = {
    capabilities: string[];
};
export type handleAuth$params = {
    endpoint?: string[] | undefined;
};
export type betterAuthUI$params = {
    endpoint?: string[] | undefined;
};

export const authModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        branding$return: branding$return,
        capabilities$return: capabilities$return,
        handleAuth$params: handleAuth$params,
        betterAuthUI$params: betterAuthUI$params,
    };

    const methods = {
        type,
        branding(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<branding$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("auth", "branding");

            const method = "get";
            const toPath = compile("auth/branding");
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
        capabilities(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<capabilities$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("auth", "capabilities");

            const method = "get";
            const toPath = compile("auth/api/capabilities");
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
        handleAuth(data: {
        params: handleAuth$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("auth", "handleAuth");

            const method = "all";
            const toPath = compile("auth/api{/*endpoint}");
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
        betterAuthUI(data: {
        params: betterAuthUI$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("auth", "betterAuthUI");

            const method = "get";
            const toPath = compile("auth{/*endpoint}");
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

    (methods.branding as any).__scope = "auth";
    (methods.capabilities as any).__scope = "auth";
    (methods.handleAuth as any).__scope = "auth";
    (methods.betterAuthUI as any).__scope = "auth";

    sdk["_moduleGroup"].set(methods, "Auth");


    return methods;
};