import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type list$query = {
    scope: "global" | "tenant";
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
    scope: "global" | "tenant";
    key: string;
    value: string;
};
export type create$return = {
    _id: string;
};
export type update$params = {
    id?: string;
};
export type update$body = {
    isSecret?: boolean | undefined;
    kind?: ("env" | "file") | undefined;
    stage?: ("build" | "runtime" | "both") | undefined;
    description?: string | undefined;
    scope: "global" | "tenant";
    value?: string | undefined;
};
export type del$params = {
    id?: string;
};
export type del$query = {
    scope: "global" | "tenant";
};
export type reveal$params = {
    id?: string;
};
export type reveal$body = {
    scope: "global" | "tenant";
};
export type reveal$return = {
    value: string;
};
export type resolve$query = {
    stage?: ("build" | "runtime") | undefined;
};
export type resolve$return = {
    env: Record<string, string>;
    files: Record<string, string>;
};
export declare const variablesModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        list$query: list$query;
        list$return: list$return;
        create$body: create$body;
        create$return: create$return;
        update$params: update$params;
        update$body: update$body;
        del$params: del$params;
        del$query: del$query;
        reveal$params: reveal$params;
        reveal$body: reveal$body;
        reveal$return: reveal$return;
        resolve$query: resolve$query;
        resolve$return: resolve$return;
    };
    readonly list: (data: {
        params?: undefined;
        query: list$query;
        body?: undefined;
    } & TRequestOptions<list$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<list$return, any, {}, any>>;
        readonly data: Promise<list$return>;
        then: <TResult1 = list$return, TResult2 = never>(onfulfilled?: ((value: list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<list$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<list$return>;
    };
    readonly create: (data: {
        params?: undefined;
        query?: undefined;
        body: create$body;
    } & TRequestOptions<create$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<create$return, any, {}, any>>;
        readonly data: Promise<create$return>;
        then: <TResult1 = create$return, TResult2 = never>(onfulfilled?: ((value: create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<create$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<create$return>;
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
        query: del$query;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly reveal: (data: {
        params: reveal$params;
        query?: undefined;
        body: reveal$body;
    } & TRequestOptions<reveal$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<reveal$return, any, {}, any>>;
        readonly data: Promise<reveal$return>;
        then: <TResult1 = reveal$return, TResult2 = never>(onfulfilled?: ((value: reveal$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<reveal$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<reveal$return>;
    };
    readonly resolve: (data: {
        params?: undefined;
        query: resolve$query;
        body?: undefined;
    } & TRequestOptions<resolve$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<resolve$return, any, {}, any>>;
        readonly data: Promise<resolve$return>;
        then: <TResult1 = resolve$return, TResult2 = never>(onfulfilled?: ((value: resolve$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<resolve$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<resolve$return>;
    };
};
