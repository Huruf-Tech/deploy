import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type status$return = {
    enabled: boolean;
    limit: number;
    used: number;
};
export type draft$body = {
    description: string;
    repo?: {
        integration?: string;
        installation: number;
        repo: string;
        branch: string;
    } | undefined;
};
export type draft$return = {
    kind: "app" | "service";
    name: string;
    description: string;
    explanation: string;
    content: {
        dockerfile?: string | undefined;
        compose?: string | undefined;
        inputs: {
            key: string;
            label: string;
            description?: string | undefined;
            type: "string" | "number" | "boolean" | "select" | "secret";
            default?: (string | number | boolean) | undefined;
            required: boolean;
            options?: string[] | undefined;
            generate?: ("password") | undefined;
        }[];
        defaults: {
            port?: number | undefined;
            healthcheckPath?: string | undefined;
            startCommand?: string | undefined;
            buildCommand?: string | undefined;
            cpuLimit?: number | undefined;
            memLimitMb?: number | undefined;
        };
        cachePaths: string[];
        changelog?: string | undefined;
    };
};
export type fix$body = {
    deployment?: string;
    log?: string | undefined;
};
export type fix$return = {
    project: string;
    explanation: string;
    template?: string | undefined;
    baseVersion?: number | undefined;
    content?: {
        dockerfile?: string | undefined;
        compose?: string | undefined;
        inputs: {
            key: string;
            label: string;
            description?: string | undefined;
            type: "string" | "number" | "boolean" | "select" | "secret";
            default?: (string | number | boolean) | undefined;
            required: boolean;
            options?: string[] | undefined;
            generate?: ("password") | undefined;
        }[];
        defaults: {
            port?: number | undefined;
            healthcheckPath?: string | undefined;
            startCommand?: string | undefined;
            buildCommand?: string | undefined;
            cpuLimit?: number | undefined;
            memLimitMb?: number | undefined;
        };
        cachePaths: string[];
        changelog?: string | undefined;
    } | undefined;
};
export type applyAiFix$body = {
    project?: string;
    content: {
        dockerfile?: string | undefined;
        compose?: string | undefined;
        inputs?: {
            key: string;
            label: string;
            description?: string | undefined;
            type: "string" | "number" | "boolean" | "select" | "secret";
            default?: (string | number | boolean) | undefined;
            required?: boolean;
            options?: string[] | undefined;
            generate?: ("password") | undefined;
        }[];
        defaults?: {
            port?: number | undefined;
            healthcheckPath?: string | undefined;
            startCommand?: string | undefined;
            buildCommand?: string | undefined;
            cpuLimit?: number | undefined;
            memLimitMb?: number | undefined;
        };
        cachePaths?: string[];
        changelog?: string | undefined;
    };
};
export type applyAiFix$return = {
    template: string;
    version: number;
};

export const aiModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        status$return: status$return,
        draft$body: draft$body,
        draft$return: draft$return,
        fix$body: fix$body,
        fix$return: fix$return,
        applyAiFix$body: applyAiFix$body,
        applyAiFix$return: applyAiFix$return,
    };

    const methods = {
        type,
        status(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<status$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("ai", "status");

            const method = "get";
            const toPath = compile("ai/api/status");
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
        draft(data: {
        params?: undefined,
        query?: undefined,
        body: draft$body,
    } & TRequestOptions<draft$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("ai", "draft");

            const method = "post";
            const toPath = compile("ai/api/draft");
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
        fix(data: {
        params?: undefined,
        query?: undefined,
        body: fix$body,
    } & TRequestOptions<fix$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("ai", "fix");

            const method = "post";
            const toPath = compile("ai/api/fix");
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
        applyAiFix(data: {
        params?: undefined,
        query?: undefined,
        body: applyAiFix$body,
    } & TRequestOptions<applyAiFix$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("ai", "applyAiFix");

            const method = "post";
            const toPath = compile("ai/api/fix/apply");
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

    (methods.status as any).__scope = "ai";
    (methods.draft as any).__scope = "ai";
    (methods.fix as any).__scope = "ai";
    (methods.applyAiFix as any).__scope = "ai";

    sdk["_moduleGroup"].set(methods, "Build");


    return methods;
};