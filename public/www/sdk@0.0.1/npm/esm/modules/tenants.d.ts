import type { TRequestOptions, TFilters, TPagination } from "../types.js";
import type { BaseSDK } from "../base.js";
export type count$query = {
    /** Client side filters */
    filters?: TFilters | undefined;
    /** Client side sub-filters (Just a second layer of filters) */
    subFilters?: TFilters | undefined;
};
export type count$return = {
    count: number;
};
export type get$params = {
    id?: string | undefined;
};
export type get$query = TPagination;
export type get$return = {
    results: {
        name: string;
        logo?: string | undefined;
        createdBy: string;
        createdAt: Date | undefined;
        _id: string;
    }[];
};
export type update$params = {
    id: string;
};
export type update$body = {
    name?: string | undefined;
    logo?: (string | undefined) | undefined;
};
export type del$params = {
    id: string;
};
export type create$body = {
    name: string;
    logo?: string | undefined;
};
export type create$return = {
    tenantId: unknown;
    memberId: unknown;
};
export declare const tenantsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        count$query: count$query;
        count$return: count$return;
        get$params: get$params;
        get$query: get$query;
        get$return: get$return;
        update$params: update$params;
        update$body: update$body;
        del$params: del$params;
        create$body: create$body;
        create$return: create$return;
    };
    readonly count: (data: {
        params?: undefined;
        query: count$query;
        body?: undefined;
    } & TRequestOptions<count$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<count$return, any, {}, any>>;
        readonly data: Promise<count$return>;
        then: <TResult1 = count$return, TResult2 = never>(onfulfilled?: ((value: count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<count$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<count$return>;
    };
    readonly get: (data: {
        params: get$params;
        query: get$query;
        body?: undefined;
    } & TRequestOptions<get$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<get$return, any, {}, any>>;
        readonly data: Promise<get$return>;
        then: <TResult1 = get$return, TResult2 = never>(onfulfilled?: ((value: get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<get$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<get$return>;
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
};
