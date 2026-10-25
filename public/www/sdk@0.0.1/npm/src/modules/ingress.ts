import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type acmeChallenge$params = {
    token: string;
};
export type traefik$return = {
    [K in string]: unknown;
};

export const ingressModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        acmeChallenge$params: acmeChallenge$params,
        traefik$return: traefik$return,
    };

    const methods = {
        type,
        acmeChallenge(data: {
        params: acmeChallenge$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("ingress", "acmeChallenge");

            const method = "get";
            const toPath = compile("ingress/api/acme-challenge/:token");
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
        traefik(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<traefik$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("ingress", "traefik");

            const method = "get";
            const toPath = compile("ingress/api/traefik");
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

    (methods.acmeChallenge as any).__scope = "ingress";
    (methods.traefik as any).__scope = "ingress";

    sdk["_moduleGroup"].set(methods, "Ingress");


    return methods;
};