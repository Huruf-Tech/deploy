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

export type list$return = {
    name: string;
    kind: "dockerhub" | "generic";
    /** Generic registries: host, e.g. ghcr.io */
    url?: string | undefined;
    /** Where images go, e.g. your Docker Hub user or ghcr.io/<org> */
    namespace: string;
    username: string;
    isDefault: boolean;
    createdAt: string;
    _id: string;
}[];
export type create$body = {
    name: string;
    kind: "dockerhub" | "generic";
    /** Generic registries: host, e.g. ghcr.io */
    url?: string | undefined;
    /** Where images go, e.g. your Docker Hub user or ghcr.io/<org> */
    namespace: string;
    username: string;
    isDefault?: boolean;
    password: string;
};
export type create$return = {
    _id: string;
};
export type makeDefault$params = {
    id?: string;
};
export type del$params = {
    id?: string;
};

export const registriesModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        list$return: list$return,
        create$body: create$body,
        create$return: create$return,
        makeDefault$params: makeDefault$params,
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
            sdk.checkPermission("registries", "list");

            const method = "get";
            const toPath = compile("registries/api/");
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
        create(data: {
        params?: undefined,
        query?: undefined,
        body: create$body,
    } & TRequestOptions<create$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("registries", "create");

            const method = "post";
            const toPath = compile("registries/api/");
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
        makeDefault(data: {
        params: makeDefault$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("registries", "makeDefault");

            const method = "post";
            const toPath = compile("registries/api/:id/default");
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
        del(data: {
        params: del$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("registries", "del");

            const method = "delete";
            const toPath = compile("registries/api/:id");
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

    (methods.list as any).__scope = "registries";
    (methods.create as any).__scope = "registries";
    (methods.makeDefault as any).__scope = "registries";
    (methods.del as any).__scope = "registries";

    sdk["_moduleGroup"].set(methods, "Infrastructure");


    return methods;
};