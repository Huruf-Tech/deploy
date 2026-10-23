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

export type overview$query = {
    range?: "1h" | "24h" | "7d";
};
export type createRuleHandler$body = {
    name: string;
    target: {
        kind: "controlPlane";
    };
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed" | "cpCpu" | "cpMemory" | "cpPollLatency" | "cpErrorRate" | "cpPollsMissing";
    /** Percent for cpu/memory/disk, MiB for room; a default when omitted */
    threshold?: number | undefined;
    forSec?: number | undefined;
    channels: {
        type: "email" | "webhook" | "slack";
        /** Email address or webhook URL; send a channel's masked URL back to keep it */
        target: string;
    }[];
    enabled?: boolean;
};
export type createRuleHandler$return = {
    _id: string;
};
export type updateRuleHandler$params = {
    id?: string;
};
export type updateRuleHandler$body = {
    name: string;
    target: {
        kind: "controlPlane";
    };
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed" | "cpCpu" | "cpMemory" | "cpPollLatency" | "cpErrorRate" | "cpPollsMissing";
    /** Percent for cpu/memory/disk, MiB for room; a default when omitted */
    threshold?: number | undefined;
    forSec?: number | undefined;
    channels: {
        type: "email" | "webhook" | "slack";
        /** Email address or webhook URL; send a channel's masked URL back to keep it */
        target: string;
    }[];
    enabled?: boolean;
};
export type deleteRuleHandler$params = {
    id?: string;
};
export type alerts$query = {
    open?: boolean | undefined;
    limit?: number;
};

export const controlPlaneModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        overview$query: overview$query,
        createRuleHandler$body: createRuleHandler$body,
        createRuleHandler$return: createRuleHandler$return,
        updateRuleHandler$params: updateRuleHandler$params,
        updateRuleHandler$body: updateRuleHandler$body,
        deleteRuleHandler$params: deleteRuleHandler$params,
        alerts$query: alerts$query,
    };

    const methods = {
        type,
        overview(data: {
        params?: undefined,
        query: overview$query,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("controlPlane", "overview");

            const method = "get";
            const toPath = compile("controlPlane/api/overview");
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
        rules(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("controlPlane", "rules");

            const method = "get";
            const toPath = compile("controlPlane/api/rules");
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
        createRuleHandler(data: {
        params?: undefined,
        query?: undefined,
        body: createRuleHandler$body,
    } & TRequestOptions<createRuleHandler$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("controlPlane", "createRuleHandler");

            const method = "post";
            const toPath = compile("controlPlane/api/rules");
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
        updateRuleHandler(data: {
        params: updateRuleHandler$params,
        query?: undefined,
        body: updateRuleHandler$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("controlPlane", "updateRuleHandler");

            const method = "patch";
            const toPath = compile("controlPlane/api/rules/:id");
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
        deleteRuleHandler(data: {
        params: deleteRuleHandler$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("controlPlane", "deleteRuleHandler");

            const method = "delete";
            const toPath = compile("controlPlane/api/rules/:id");
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
        alerts(data: {
        params?: undefined,
        query: alerts$query,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("controlPlane", "alerts");

            const method = "get";
            const toPath = compile("controlPlane/api/alerts");
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

    (methods.overview as any).__scope = "controlPlane";
    (methods.rules as any).__scope = "controlPlane";
    (methods.createRuleHandler as any).__scope = "controlPlane";
    (methods.updateRuleHandler as any).__scope = "controlPlane";
    (methods.deleteRuleHandler as any).__scope = "controlPlane";
    (methods.alerts as any).__scope = "controlPlane";

    sdk["_moduleGroup"].set(methods, "Admin");


    return methods;
};