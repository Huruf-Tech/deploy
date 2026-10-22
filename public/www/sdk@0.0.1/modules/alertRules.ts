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
    target: {
        kind: "server" | "project";
        /** Every server (or project) when absent */
        ref?: string | undefined;
    };
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed";
    /** Percent for cpu/memory/disk (above fires); MiB of room (below fires) */
    threshold: number;
    forSec: number;
    enabled: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    _id: string;
    channels: {
        type: string;
        target: string;
    }[];
}[];
export type create$body = {
    name: string;
    target: {
        kind: "server" | "project";
        ref?: string | undefined;
    };
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed";
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
export type create$return = {
    _id: string;
};
export type update$params = {
    id?: string;
};
export type update$body = {
    name: string;
    target: {
        kind: "server" | "project";
        ref?: string | undefined;
    };
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed";
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
export type del$params = {
    id?: string;
};

export const alertRulesModule = (sdk: typeof BaseSDK) => {
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
            sdk.checkPermission("alertRules", "list");

            const method = "get";
            const toPath = compile("alertRules/api/");
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
            sdk.checkPermission("alertRules", "create");

            const method = "post";
            const toPath = compile("alertRules/api/");
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
        update(data: {
        params: update$params,
        query?: undefined,
        body: update$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("alertRules", "update");

            const method = "patch";
            const toPath = compile("alertRules/api/:id");
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
            sdk.checkPermission("alertRules", "del");

            const method = "delete";
            const toPath = compile("alertRules/api/:id");
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

    (methods.list as any).__scope = "alertRules";
    (methods.create as any).__scope = "alertRules";
    (methods.update as any).__scope = "alertRules";
    (methods.del as any).__scope = "alertRules";

    sdk["_moduleGroup"].set(methods, "Monitoring");


    return methods;
};