import type { TRequestOptions, TFilters, TPagination } from "../types.js";
import type { BaseSDK } from "../base.js";
export type metadata$return = {
    defaultCurrency: string;
    availableCurrencies: string[];
};
export type signTransfer$query = {
    receiver: string;
    amount: number;
    description?: string | undefined;
    metadata?: Record<string, string | number | boolean> | undefined;
    currency?: string | undefined;
};
export type signTransfer$return = {
    sender: {
        tenant: string;
        user: string;
        name: string;
        image?: string | undefined;
    };
    receiver: {
        tenant: string;
        user: string;
        name: string;
        image?: string | undefined;
        tenantName: string;
        tenantLogo?: string | undefined;
    };
    transactionDetails: {
        type?: string | undefined;
        currency: string;
        amount: number;
        fee: number;
        feeStructure: {
            total: number;
            breakdown: {
                tenant: unknown;
                name: string;
                amount: number;
            }[];
        };
        description?: string | undefined;
        metadata?: Record<string, string | number | boolean> | undefined;
    };
    challenge: {
        token: string;
    };
};
export type transfer$body = {
    method?: string | undefined;
    token: string;
    tags?: string[] | undefined;
};
export type transfer$return = {
    transaction: {
        reference: string;
        idempotencyKey: string;
        debit: string;
        credit: string;
    };
};
export type updateOverdraftLimit$body = {
    userId: string;
    tenantId: string;
    limit: number;
};
export type getOverdraftLimit$query = {
    userId: string;
    tenantId: string;
};
export type getOverdraftLimit$return = {
    overdraftLimit: number;
};
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
        currency: string;
        balance: number;
        overdraftLimit: number;
        previousBalance: number;
        lastRef?: string | undefined;
        user: string;
        tenant: string;
        negativeAt?: (Date | null) | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
        _id: string;
    }[];
};
export declare const walletsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        metadata$return: metadata$return;
        signTransfer$query: signTransfer$query;
        signTransfer$return: signTransfer$return;
        transfer$body: transfer$body;
        transfer$return: transfer$return;
        updateOverdraftLimit$body: updateOverdraftLimit$body;
        getOverdraftLimit$query: getOverdraftLimit$query;
        getOverdraftLimit$return: getOverdraftLimit$return;
        count$query: count$query;
        count$return: count$return;
        get$params: get$params;
        get$query: get$query;
        get$return: get$return;
    };
    readonly metadata: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<metadata$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<metadata$return, any, {}, any>>;
        readonly data: Promise<metadata$return>;
        then: <TResult1 = metadata$return, TResult2 = never>(onfulfilled?: ((value: metadata$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<metadata$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<metadata$return>;
    };
    readonly signTransfer: (data: {
        params?: undefined;
        query: signTransfer$query;
        body?: undefined;
    } & TRequestOptions<signTransfer$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<signTransfer$return, any, {}, any>>;
        readonly data: Promise<signTransfer$return>;
        then: <TResult1 = signTransfer$return, TResult2 = never>(onfulfilled?: ((value: signTransfer$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<signTransfer$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<signTransfer$return>;
    };
    readonly transfer: (data: {
        params?: undefined;
        query?: undefined;
        body: transfer$body;
    } & TRequestOptions<transfer$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<transfer$return, any, {}, any>>;
        readonly data: Promise<transfer$return>;
        then: <TResult1 = transfer$return, TResult2 = never>(onfulfilled?: ((value: transfer$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<transfer$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<transfer$return>;
    };
    readonly updateOverdraftLimit: (data: {
        params?: undefined;
        query?: undefined;
        body: updateOverdraftLimit$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly getOverdraftLimit: (data: {
        params?: undefined;
        query: getOverdraftLimit$query;
        body?: undefined;
    } & TRequestOptions<getOverdraftLimit$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<getOverdraftLimit$return, any, {}, any>>;
        readonly data: Promise<getOverdraftLimit$return>;
        then: <TResult1 = getOverdraftLimit$return, TResult2 = never>(onfulfilled?: ((value: getOverdraftLimit$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<getOverdraftLimit$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<getOverdraftLimit$return>;
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
