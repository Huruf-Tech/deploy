import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type list$return = {
    _id: string;
    appSlug: string;
    appName: string;
    htmlUrl: string;
    account: {
        login: string;
        type: string;
    };
    installations: {
        id: number;
        account: {
            login: string;
            type: string;
        };
        repositorySelection?: ("all" | "selected") | undefined;
        suspended: boolean;
    }[];
    sharedWithTenant: boolean;
    isOwner: boolean;
    createdAt: string;
}[];
export type connect$body = {
    org?: string | undefined;
};
export type connect$return = {
    action: string;
    manifest: string;
};
export type update$params = {
    id?: string;
};
export type update$body = {
    sharedWithTenant: boolean;
};
export type del$params = {
    id?: string;
};
export type refresh$params = {
    id?: string;
};
export type refresh$return = {
    id: number;
    account: {
        login: string;
        type: string;
    };
    repositorySelection?: ("all" | "selected") | undefined;
    suspended: boolean;
}[];
export type repositories$params = {
    id?: string;
    installation: string;
};
export type repositories$query = {
    page?: number;
};
export type repositories$return = {
    repositories: {
        id: number;
        name: string;
        fullName: string;
        owner: string;
        private: boolean;
        defaultBranch: string;
        pushedAt?: string | undefined;
        description?: string | undefined;
    }[];
    hasMore: boolean;
};
export type branches$params = {
    id?: string;
    installation: string;
};
export type branches$query = {
    repo: string;
    page?: number;
};
export type branches$return = {
    branches: {
        name: string;
        sha: string;
    }[];
    hasMore: boolean;
};

export const gitIntegrationsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        list$return: list$return,
        connect$body: connect$body,
        connect$return: connect$return,
        update$params: update$params,
        update$body: update$body,
        del$params: del$params,
        refresh$params: refresh$params,
        refresh$return: refresh$return,
        repositories$params: repositories$params,
        repositories$query: repositories$query,
        repositories$return: repositories$return,
        branches$params: branches$params,
        branches$query: branches$query,
        branches$return: branches$return,
    };

    const methods = {
        type,
        list(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<list$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("gitIntegrations", "list");

            const method = "get";
            const toPath = compile("gitIntegrations/api/");
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
        connect(data: {
        params?: undefined,
        query?: undefined,
        body: connect$body,
    } & TRequestOptions<connect$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("gitIntegrations", "connect");

            const method = "post";
            const toPath = compile("gitIntegrations/api/connect");
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
            sdk.checkPermission("gitIntegrations", "update");

            const method = "patch";
            const toPath = compile("gitIntegrations/api/:id");
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
            sdk.checkPermission("gitIntegrations", "del");

            const method = "delete";
            const toPath = compile("gitIntegrations/api/:id");
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
        refresh(data: {
        params: refresh$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<refresh$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("gitIntegrations", "refresh");

            const method = "post";
            const toPath = compile("gitIntegrations/api/:id/refresh");
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
        repositories(data: {
        params: repositories$params,
        query: repositories$query,
        body?: undefined,
    } & TRequestOptions<repositories$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("gitIntegrations", "repositories");

            const method = "get";
            const toPath = compile("gitIntegrations/api/:id/installations/:installation/repositories");
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
        branches(data: {
        params: branches$params,
        query: branches$query,
        body?: undefined,
    } & TRequestOptions<branches$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("gitIntegrations", "branches");

            const method = "get";
            const toPath = compile("gitIntegrations/api/:id/installations/:installation/branches");
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

    (methods.list as any).__scope = "gitIntegrations";
    (methods.connect as any).__scope = "gitIntegrations";
    (methods.update as any).__scope = "gitIntegrations";
    (methods.del as any).__scope = "gitIntegrations";
    (methods.refresh as any).__scope = "gitIntegrations";
    (methods.repositories as any).__scope = "gitIntegrations";
    (methods.branches as any).__scope = "gitIntegrations";

    sdk["_moduleGroup"].set(methods, "Build");


    return methods;
};