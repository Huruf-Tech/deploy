import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type list$return = {
    name: string;
    provider: "aws" | "cloudflare" | "minio" | "other";
    /** e.g. https://<account>.r2.cloudflarestorage.com; AWS needs none */
    endpoint?: string | undefined;
    region: string;
    bucket: string;
    accessKeyId: string;
    createdAt: string;
    _id: string;
}[];
export type create$body = {
    name: string;
    provider: "aws" | "cloudflare" | "minio" | "other";
    /** e.g. https://<account>.r2.cloudflarestorage.com; AWS needs none */
    endpoint?: string | undefined;
    region?: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
};
export type create$return = {
    _id: string;
};
export type update$params = {
    id?: string;
};
export type update$body = {
    name?: string | undefined;
    provider?: ("aws" | "cloudflare" | "minio" | "other") | undefined;
    endpoint?: (string | undefined) | undefined;
    region?: string | undefined;
    bucket?: string | undefined;
    accessKeyId?: string | undefined;
    /** Leave out to keep the current one */
    secretAccessKey?: string | undefined;
};
export type del$params = {
    id?: string;
};

export const storagesModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        list$return: list$return,
        create$body: create$body,
        create$return: create$return,
        update$params: update$params,
        update$body: update$body,
        del$params: del$params,
    };

    const methods = {
        type,
        list(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<list$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("storages", "list");

            const method = "get";
            const toPath = compile("storages/api/");
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
        create(data: {
        params?: undefined,
        query?: undefined,
        body: create$body,
    } & TRequestOptions<create$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("storages", "create");

            const method = "post";
            const toPath = compile("storages/api/");
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
        update(data: {
        params: update$params,
        query?: undefined,
        body: update$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("storages", "update");

            const method = "patch";
            const toPath = compile("storages/api/:id");
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
        del(data: {
        params: del$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("storages", "del");

            const method = "delete";
            const toPath = compile("storages/api/:id");
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

    (methods.list as any).__scope = "storages";
    (methods.create as any).__scope = "storages";
    (methods.update as any).__scope = "storages";
    (methods.del as any).__scope = "storages";

    sdk["_moduleGroup"].set(methods, "Infrastructure");


    return methods;
};