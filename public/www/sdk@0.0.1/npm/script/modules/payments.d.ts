import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type config$return = {
    configured: boolean;
    gateway: "stripe";
    publishableKey: string;
};
export type cards$return = {
    autoPay: boolean;
    actionRequired?: {
        message: string;
        at: Date;
    } | undefined;
    cards: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
        isDefault: boolean;
        _id: string;
        expired: boolean;
    }[];
};
export type setupCard$return = {
    clientSecret: string;
    setupRef: string;
};
export type finishCard$body = {
    setupRef: string;
};
export type finishCard$return = {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
    _id: string;
    expired: boolean;
};
export type setDefaultCard$params = {
    id?: string;
};
export type removeCard$params = {
    id?: string;
};
export type updateAccount$body = {
    autoPay: boolean;
};
export declare const paymentsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        config$return: config$return;
        cards$return: cards$return;
        setupCard$return: setupCard$return;
        finishCard$body: finishCard$body;
        finishCard$return: finishCard$return;
        setDefaultCard$params: setDefaultCard$params;
        removeCard$params: removeCard$params;
        updateAccount$body: updateAccount$body;
    };
    readonly config: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<config$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<config$return, any, {}, any>>;
        readonly data: Promise<config$return>;
        then: <TResult1 = config$return, TResult2 = never>(onfulfilled?: ((value: config$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<config$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<config$return>;
    };
    readonly cards: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<cards$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<cards$return, any, {}, any>>;
        readonly data: Promise<cards$return>;
        then: <TResult1 = cards$return, TResult2 = never>(onfulfilled?: ((value: cards$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<cards$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<cards$return>;
    };
    readonly setupCard: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<setupCard$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<setupCard$return, any, {}, any>>;
        readonly data: Promise<setupCard$return>;
        then: <TResult1 = setupCard$return, TResult2 = never>(onfulfilled?: ((value: setupCard$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<setupCard$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<setupCard$return>;
    };
    readonly finishCard: (data: {
        params?: undefined;
        query?: undefined;
        body: finishCard$body;
    } & TRequestOptions<finishCard$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<finishCard$return, any, {}, any>>;
        readonly data: Promise<finishCard$return>;
        then: <TResult1 = finishCard$return, TResult2 = never>(onfulfilled?: ((value: finishCard$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<finishCard$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<finishCard$return>;
    };
    readonly setDefaultCard: (data: {
        params: setDefaultCard$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly removeCard: (data: {
        params: removeCard$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly updateAccount: (data: {
        params?: undefined;
        query?: undefined;
        body: updateAccount$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly webhook: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
};
//# sourceMappingURL=payments.d.ts.map