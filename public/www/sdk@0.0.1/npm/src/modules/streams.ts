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
export type openBuild$body = {
    server?: string;
    deployment: string;
};
export type openBuild$return = {
    session: string;
};
export type openMetrics$body = {
    server?: string;
};
export type openMetrics$return = {
    session: string;
};
export type openCapacity$body = {
    server?: string;
};
export type openCapacity$return = {
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
export type openTerminal$body = {
    server?: string;
    container: string;
    cols?: number;
    rows?: number;
};
export type openTerminal$return = {
    session: string;
};
export type openHostTerminal$body = {
    server?: string;
    cols?: number;
    rows?: number;
};
export type openHostTerminal$return = {
    session: string;
};
export type input$params = {
    id?: string;
};
export type input$body = {
    items: {
        seq: number;
        data?: string | undefined;
        cols?: number | undefined;
        rows?: number | undefined;
    }[];
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
    /** The server closed this session (e.g. idle while the tab was hidden): reopen */
    closed?: boolean | undefined;
};
export type close$params = {
    id?: string;
};

export const streamsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        openLogs$body: openLogs$body,
        openLogs$return: openLogs$return,
        openBuild$body: openBuild$body,
        openBuild$return: openBuild$return,
        openMetrics$body: openMetrics$body,
        openMetrics$return: openMetrics$return,
        openCapacity$body: openCapacity$body,
        openCapacity$return: openCapacity$return,
        openExec$body: openExec$body,
        openExec$return: openExec$return,
        openTerminal$body: openTerminal$body,
        openTerminal$return: openTerminal$return,
        openHostTerminal$body: openHostTerminal$body,
        openHostTerminal$return: openHostTerminal$return,
        input$params: input$params,
        input$body: input$body,
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
        openBuild(data: {
        params?: undefined,
        query?: undefined,
        body: openBuild$body,
    } & TRequestOptions<openBuild$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("streams", "openBuild");

            const method = "post";
            const toPath = compile("streams/api/build");
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
        openCapacity(data: {
        params?: undefined,
        query?: undefined,
        body: openCapacity$body,
    } & TRequestOptions<openCapacity$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("streams", "openCapacity");

            const method = "post";
            const toPath = compile("streams/api/capacity");
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
        openTerminal(data: {
        params?: undefined,
        query?: undefined,
        body: openTerminal$body,
    } & TRequestOptions<openTerminal$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("streams", "openTerminal");

            const method = "post";
            const toPath = compile("streams/api/terminal");
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
        openHostTerminal(data: {
        params?: undefined,
        query?: undefined,
        body: openHostTerminal$body,
    } & TRequestOptions<openHostTerminal$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("streams", "openHostTerminal");

            const method = "post";
            const toPath = compile("streams/api/terminal/host");
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
        input(data: {
        params: input$params,
        query?: undefined,
        body: input$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("streams", "input");

            const method = "post";
            const toPath = compile("streams/api/:id/input");
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
    (methods.openBuild as any).__scope = "streams";
    (methods.openMetrics as any).__scope = "streams";
    (methods.openCapacity as any).__scope = "streams";
    (methods.openExec as any).__scope = "streams";
    (methods.openTerminal as any).__scope = "streams";
    (methods.openHostTerminal as any).__scope = "streams";
    (methods.input as any).__scope = "streams";
    (methods.read as any).__scope = "streams";
    (methods.close as any).__scope = "streams";

    sdk["_moduleGroup"].set(methods, "Streams");


    return methods;
};