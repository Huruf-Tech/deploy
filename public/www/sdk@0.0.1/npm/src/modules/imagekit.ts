import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type auth$return = {
    token: string;
    expire: number;
    signature: string;
    publicKey: string;
};

export const imageKitModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        auth$return: auth$return,
    };

    const methods = {
        type,
        auth(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<auth$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("imageKit", "auth");

            const method = "get";
            const toPath = compile("imagekit/api/auth");
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

    (methods.auth as any).__scope = "imageKit";

    sdk["_moduleGroup"].set(methods, "Media");


    return methods;
};