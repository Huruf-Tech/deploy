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

export type openLogs$body = {
    server?: string;
    container: string;
    tail?: number;
    /** e.g. 10m */
    since?: string | undefined;
};
export type openLogs$return = {
    session: string;
};
export type openMetrics$body = {
    server?: string;
};
export type openMetrics$return = {
    session: string;
};
export type openExec$body = {
    server?: string;
    container: string;
    command: string[];
};
export type openExec$return = {
    session: string;
};
export type read$params = {
    id?: string;
};
export type read$query = {
    after?: number;
};
export type read$return = {
    chunks: {
        seq: number;
        data: string;
        done?: boolean | undefined;
        error?: string | undefined;
    }[];
};
export type close$params = {
    id?: string;
};

export const streamsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        openLogs$body: openLogs$body,
        openLogs$return: openLogs$return,
        openMetrics$body: openMetrics$body,
        openMetrics$return: openMetrics$return,
        openExec$body: openExec$body,
        openExec$return: openExec$return,
        read$params: read$params,
        read$query: read$query,
        read$return: read$return,
        close$params: close$params,
    };

    const methods = {
        type,
        openLogs(data: {
        params?: undefined,
        query?: undefined,
        body: openLogs$body,
    } & TRequestOptions<openLogs$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("streams", "openLogs");

            const method = "post";
            const toPath = compile("streams/api/logs");
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
        openMetrics(data: {
        params?: undefined,
        query?: undefined,
        body: openMetrics$body,
    } & TRequestOptions<openMetrics$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("streams", "openMetrics");

            const method = "post";
            const toPath = compile("streams/api/metrics");
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
        openExec(data: {
        params?: undefined,
        query?: undefined,
        body: openExec$body,
    } & TRequestOptions<openExec$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("streams", "openExec");

            const method = "post";
            const toPath = compile("streams/api/exec");
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
        read(data: {
        params: read$params,
        query: read$query,
        body?: undefined,
    } & TRequestOptions<read$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("streams", "read");

            const method = "get";
            const toPath = compile("streams/api/:id/chunks");
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
        close(data: {
        params: close$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("streams", "close");

            const method = "post";
            const toPath = compile("streams/api/:id/close");
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

    (methods.openLogs as any).__scope = "streams";
    (methods.openMetrics as any).__scope = "streams";
    (methods.openExec as any).__scope = "streams";
    (methods.read as any).__scope = "streams";
    (methods.close as any).__scope = "streams";

    sdk["_moduleGroup"].set(methods, "Streams");


    return methods;
};