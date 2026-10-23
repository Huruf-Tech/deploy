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

export type list$query = {
    open?: ("true" | "false") | undefined;
    limit?: number;
};
export type list$return = {
    rule: string;
    ruleName: string;
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed" | "cpCpu" | "cpMemory" | "cpPollLatency" | "cpErrorRate" | "cpPollsMissing";
    threshold: number;
    server?: string | undefined;
    project?: string | undefined;
    instance?: string | undefined;
    firedAt: Date;
    resolvedAt?: Date | undefined;
    value?: number | undefined;
    detail?: string | undefined;
    delivery: {
        notice: "fired" | "resolved";
        status: "pending" | "sent" | "failed";
        attempts: number;
        nextAttemptAt: Date;
        claimedUntil?: Date | undefined;
        error?: string | undefined;
    };
    _id: string;
    open: boolean;
    serverName?: string | undefined;
    projectName?: string | undefined;
}[];

export const alertEventsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        list$query: list$query,
        list$return: list$return,
    };

    const methods = {
        type,
        list(data: {
        params?: undefined,
        query: list$query,
        body?: undefined,
    } & TRequestOptions<list$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("alertEvents", "list");

            const method = "get";
            const toPath = compile("alertEvents/api/");
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

    (methods.list as any).__scope = "alertEvents";

    sdk["_moduleGroup"].set(methods, "Monitoring");


    return methods;
};