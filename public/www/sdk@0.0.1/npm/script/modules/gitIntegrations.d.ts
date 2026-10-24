import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
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
export declare const gitIntegrationsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        list$return: list$return;
        connect$body: connect$body;
        connect$return: connect$return;
        update$params: update$params;
        update$body: update$body;
        del$params: del$params;
        refresh$params: refresh$params;
        refresh$return: refresh$return;
        repositories$params: repositories$params;
        repositories$query: repositories$query;
        repositories$return: repositories$return;
        branches$params: branches$params;
        branches$query: branches$query;
        branches$return: branches$return;
    };
    readonly list: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<list$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<list$return, any, {}, any>>;
        readonly data: Promise<list$return>;
        then: <TResult1 = list$return, TResult2 = never>(onfulfilled?: ((value: list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<list$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<list$return>;
    };
    readonly connect: (data: {
        params?: undefined;
        query?: undefined;
        body: connect$body;
    } & TRequestOptions<connect$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<connect$return, any, {}, any>>;
        readonly data: Promise<connect$return>;
        then: <TResult1 = connect$return, TResult2 = never>(onfulfilled?: ((value: connect$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<connect$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<connect$return>;
    };
    readonly update: (data: {
        params: update$params;
        query?: undefined;
        body: update$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly del: (data: {
        params: del$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly refresh: (data: {
        params: refresh$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<refresh$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<refresh$return, any, {}, any>>;
        readonly data: Promise<refresh$return>;
        then: <TResult1 = refresh$return, TResult2 = never>(onfulfilled?: ((value: refresh$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<refresh$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<refresh$return>;
    };
    readonly repositories: (data: {
        params: repositories$params;
        query: repositories$query;
        body?: undefined;
    } & TRequestOptions<repositories$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<repositories$return, any, {}, any>>;
        readonly data: Promise<repositories$return>;
        then: <TResult1 = repositories$return, TResult2 = never>(onfulfilled?: ((value: repositories$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<repositories$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<repositories$return>;
    };
    readonly branches: (data: {
        params: branches$params;
        query: branches$query;
        body?: undefined;
    } & TRequestOptions<branches$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<branches$return, any, {}, any>>;
        readonly data: Promise<branches$return>;
        then: <TResult1 = branches$return, TResult2 = never>(onfulfilled?: ((value: branches$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<branches$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<branches$return>;
    };
};
//# sourceMappingURL=gitIntegrations.d.ts.map