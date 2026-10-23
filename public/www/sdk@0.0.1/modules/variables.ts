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
    scope: "global" | "tenant" | "project";
    /** Required for the project scope */
    project?: string | undefined;
};
export type list$return = {
    isSecret: boolean;
    kind: "env" | "file";
    stage: "build" | "runtime" | "both";
    description?: string | undefined;
    _id: string;
    key: string;
    value?: string | undefined;
    version: number;
    updatedAt: string;
}[];
export type create$body = {
    isSecret?: boolean;
    kind?: "env" | "file";
    stage?: "build" | "runtime" | "both";
    description?: string | undefined;
    scope: "global" | "tenant" | "project";
    /** Required for the project scope */
    project?: string | undefined;
    key: string;
    value: string;
};
export type create$return = {
    _id: string;
};
export type importEnv$body = {
    scope: "global" | "tenant" | "project";
    /** Required for the project scope */
    project?: string | undefined;
    variables: {
        key: string;
        value: string;
        isSecret?: boolean;
    }[];
    /** Replace the values of keys that already exist */
    overwrite?: boolean;
};
export type importEnv$return = {
    created: string[];
    updated: string[];
    /** Existing keys left as they were */
    skipped: string[];
};
export type update$params = {
    id?: string;
};
export type update$body = {
    isSecret?: boolean | undefined;
    kind?: ("env" | "file") | undefined;
    stage?: ("build" | "runtime" | "both") | undefined;
    description?: string | undefined;
    scope: "global" | "tenant" | "project";
    /** Required for the project scope */
    project?: string | undefined;
    value?: string | undefined;
};
export type del$params = {
    id?: string;
};
export type del$query = {
    scope: "global" | "tenant" | "project";
    /** Required for the project scope */
    project?: string | undefined;
};
export type reveal$params = {
    id?: string;
};
export type reveal$body = {
    scope: "global" | "tenant" | "project";
    /** Required for the project scope */
    project?: string | undefined;
};
export type reveal$return = {
    value: string;
};
export type resolve$query = {
    stage?: ("build" | "runtime") | undefined;
    /** A project's slug: include its variables (they win) */
    project?: string | undefined;
};
export type resolve$return = {
    env: Record<string, string>;
    files: Record<string, string>;
};

export const variablesModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        list$query: list$query,
        list$return: list$return,
        create$body: create$body,
        create$return: create$return,
        importEnv$body: importEnv$body,
        importEnv$return: importEnv$return,
        update$params: update$params,
        update$body: update$body,
        del$params: del$params,
        del$query: del$query,
        reveal$params: reveal$params,
        reveal$body: reveal$body,
        reveal$return: reveal$return,
        resolve$query: resolve$query,
        resolve$return: resolve$return,
    };

    const methods = {
        type,
        list(data: {
        params?: undefined,
        query: list$query,
        body?: undefined,
    } & TRequestOptions<list$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("variables", "list");

            const method = "get";
            const toPath = compile("variables/api/");
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
            sdk.checkPermission("variables", "create");

            const method = "post";
            const toPath = compile("variables/api/");
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
        importEnv(data: {
        params?: undefined,
        query?: undefined,
        body: importEnv$body,
    } & TRequestOptions<importEnv$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("variables", "importEnv");

            const method = "post";
            const toPath = compile("variables/api/import");
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
            sdk.checkPermission("variables", "update");

            const method = "patch";
            const toPath = compile("variables/api/:id");
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
        query: del$query,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("variables", "del");

            const method = "delete";
            const toPath = compile("variables/api/:id");
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
        reveal(data: {
        params: reveal$params,
        query?: undefined,
        body: reveal$body,
    } & TRequestOptions<reveal$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("variables", "reveal");

            const method = "post";
            const toPath = compile("variables/api/:id/reveal");
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
        resolve(data: {
        params?: undefined,
        query: resolve$query,
        body?: undefined,
    } & TRequestOptions<resolve$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("variables", "resolve");

            const method = "get";
            const toPath = compile("variables/api/resolve");
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

    (methods.list as any).__scope = "variables";
    (methods.create as any).__scope = "variables";
    (methods.importEnv as any).__scope = "variables";
    (methods.update as any).__scope = "variables";
    (methods.del as any).__scope = "variables";
    (methods.reveal as any).__scope = "variables";
    (methods.resolve as any).__scope = "variables";

    sdk["_moduleGroup"].set(methods, "Configuration");


    return methods;
};