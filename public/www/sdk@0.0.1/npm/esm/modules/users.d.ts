import type { TRequestOptions, TFilters, TPagination } from "../types.js";
import type { BaseSDK } from "../base.js";
export type create$body = {
    email: string;
    password?: string | undefined;
    name: string;
    role?: string | undefined;
    metadata?: {
        [K in string]: any;
    } | undefined;
};
export type create$return = {
    _id: string;
};
export type update$params = {
    id?: string;
};
export type update$body = {
    email: string;
    name: string;
    role?: string | undefined;
    metadata?: {
        [K in string]: any;
    } | undefined;
};
export type ban$params = {
    id?: string;
};
export type ban$body = {
    reason: string;
    banExpiresInSeconds?: number | undefined;
};
export type addFcmToken$body = {
    token: string;
};
export type addFcmToken$return = {
    id: string;
};
export type getUserTenants$params = {
    id?: string;
};
export type getUserTenants$return = {
    _id: string;
    name: string;
}[];
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
        image?: string | undefined;
        email: string;
        fcmTokens?: string[] | undefined;
        emailVerified: boolean;
        phoneNumber?: string | undefined;
        phoneNumberVerified?: boolean | undefined;
        phoneNumberVerificationCode?: string | undefined;
        phoneNumberVerificationRequestAt?: Date | undefined;
        role: string;
        createdAt: Date;
        updatedAt: Date;
        _id: string;
    }[];
};
export declare const usersModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        create$body: create$body;
        create$return: create$return;
        update$params: update$params;
        update$body: update$body;
        ban$params: ban$params;
        ban$body: ban$body;
        addFcmToken$body: addFcmToken$body;
        addFcmToken$return: addFcmToken$return;
        getUserTenants$params: getUserTenants$params;
        getUserTenants$return: getUserTenants$return;
        count$query: count$query;
        count$return: count$return;
        get$params: get$params;
        get$query: get$query;
        get$return: get$return;
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
    readonly ban: (data: {
        params: ban$params;
        query?: undefined;
        body: ban$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly addFcmToken: (data: {
        params?: undefined;
        query?: undefined;
        body: addFcmToken$body;
    } & TRequestOptions<addFcmToken$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<addFcmToken$return, any, {}, any>>;
        readonly data: Promise<addFcmToken$return>;
        then: <TResult1 = addFcmToken$return, TResult2 = never>(onfulfilled?: ((value: addFcmToken$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<addFcmToken$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<addFcmToken$return>;
    };
    readonly getUserTenants: (data: {
        params: getUserTenants$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<getUserTenants$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<getUserTenants$return, any, {}, any>>;
        readonly data: Promise<getUserTenants$return>;
        then: <TResult1 = getUserTenants$return, TResult2 = never>(onfulfilled?: ((value: getUserTenants$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<getUserTenants$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<getUserTenants$return>;
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
};
