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
    description?: string | undefined;
    icon?: string | undefined;
    scope: "system" | "tenant";
    kind: "app" | "service";
    slug: string;
    latestVersion: number;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    _id: string;
    clonedFrom?: {
        template: string;
        version: number;
    } | undefined;
}[];
export type create$body = {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    kind: "app" | "service";
    slug: string;
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
export type create$return = {
    _id: string;
};
export type get$params = {
    id?: string;
};
export type get$query = {
    version?: number | undefined;
};
export type get$return = {
    template: {
        name: string;
        description?: string | undefined;
        icon?: string | undefined;
        scope: "system" | "tenant";
        kind: "app" | "service";
        slug: string;
        latestVersion: number;
        isPublished: boolean;
        createdAt: string;
        updatedAt: string;
        _id: string;
        clonedFrom?: {
            template: string;
            version: number;
        } | undefined;
    };
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
        version: number;
        createdAt: string;
    };
};
export type update$params = {
    id?: string;
};
export type update$body = {
    name?: string | undefined;
    description?: (string | undefined) | undefined;
    icon?: (string | undefined) | undefined;
};
export type del$params = {
    id?: string;
};
export type versions$params = {
    id?: string;
};
export type versions$return = {
    version: number;
    changelog?: string | undefined;
    createdAt: string;
}[];
export type saveTemplateVersion$params = {
    id?: string;
};
export type saveTemplateVersion$body = {
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
export type saveTemplateVersion$return = {
    version: number;
};
export type clone$params = {
    id?: string;
};
export type clone$body = {
    name: string;
    slug: string;
};
export type clone$return = {
    _id: string;
};
export type render$params = {
    id?: string;
};
export type render$body = {
    version?: number | undefined;
    inputs?: Record<string, unknown>;
};
export type render$return = {
    files: Record<string, string>;
    generated: string[];
};

export const templatesModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        list$return: list$return,
        create$body: create$body,
        create$return: create$return,
        get$params: get$params,
        get$query: get$query,
        get$return: get$return,
        update$params: update$params,
        update$body: update$body,
        del$params: del$params,
        versions$params: versions$params,
        versions$return: versions$return,
        saveTemplateVersion$params: saveTemplateVersion$params,
        saveTemplateVersion$body: saveTemplateVersion$body,
        saveTemplateVersion$return: saveTemplateVersion$return,
        clone$params: clone$params,
        clone$body: clone$body,
        clone$return: clone$return,
        render$params: render$params,
        render$body: render$body,
        render$return: render$return,
    };

    const methods = {
        type,
        list(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<list$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("templates", "list");

            const method = "get";
            const toPath = compile("templates/api/");
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
            sdk.checkPermission("templates", "create");

            const method = "post";
            const toPath = compile("templates/api/");
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
        get(data: {
        params: get$params,
        query: get$query,
        body?: undefined,
    } & TRequestOptions<get$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("templates", "get");

            const method = "get";
            const toPath = compile("templates/api/:id");
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
            sdk.checkPermission("templates", "update");

            const method = "patch";
            const toPath = compile("templates/api/:id");
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
            sdk.checkPermission("templates", "del");

            const method = "delete";
            const toPath = compile("templates/api/:id");
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
        versions(data: {
        params: versions$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<versions$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("templates", "versions");

            const method = "get";
            const toPath = compile("templates/api/:id/versions");
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
        saveTemplateVersion(data: {
        params: saveTemplateVersion$params,
        query?: undefined,
        body: saveTemplateVersion$body,
    } & TRequestOptions<saveTemplateVersion$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("templates", "saveTemplateVersion");

            const method = "post";
            const toPath = compile("templates/api/:id/versions");
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
        clone(data: {
        params: clone$params,
        query?: undefined,
        body: clone$body,
    } & TRequestOptions<clone$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("templates", "clone");

            const method = "post";
            const toPath = compile("templates/api/:id/clone");
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
        render(data: {
        params: render$params,
        query?: undefined,
        body: render$body,
    } & TRequestOptions<render$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("templates", "render");

            const method = "post";
            const toPath = compile("templates/api/:id/render");
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

    (methods.list as any).__scope = "templates";
    (methods.create as any).__scope = "templates";
    (methods.get as any).__scope = "templates";
    (methods.update as any).__scope = "templates";
    (methods.del as any).__scope = "templates";
    (methods.versions as any).__scope = "templates";
    (methods.saveTemplateVersion as any).__scope = "templates";
    (methods.clone as any).__scope = "templates";
    (methods.render as any).__scope = "templates";

    sdk["_moduleGroup"].set(methods, "Build");


    return methods;
};