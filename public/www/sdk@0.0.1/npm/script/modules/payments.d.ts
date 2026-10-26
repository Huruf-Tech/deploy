import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type config$return = {
    configured: boolean;
    gateway: "stripe";
    publishableKey: string;
};
export type summary$return = {
    balance: number;
    currency: string;
    hasCard: boolean;
    isOwner: boolean;
};
export type statement$return = {
    balance: number;
    entries: {
        _id: string;
        type: string;
        amount: number;
        description?: string | undefined;
        purpose?: string | undefined;
        reference: string;
        createdAt?: Date | undefined;
    }[];
};
export type addFunds$body = {
    /** Cents */
    amount: number;
    nonce: string;
};
export type addFunds$return = {
    status: "completed" | "pending";
    topup: string;
    clientSecret?: string | undefined;
};
export type topupStatus$params = {
    id?: string;
};
export type topupStatus$return = {
    status: string;
    amount: number;
    error?: string | undefined;
};
export type flaggedCharge$return = {
    charge: {
        topup: string;
        amount: number;
        clientSecret: string;
        cardRef: string;
    } | null;
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
        summary$return: summary$return;
        statement$return: statement$return;
        addFunds$body: addFunds$body;
        addFunds$return: addFunds$return;
        topupStatus$params: topupStatus$params;
        topupStatus$return: topupStatus$return;
        flaggedCharge$return: flaggedCharge$return;
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
    readonly summary: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<summary$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<summary$return, any, {}, any>>;
        readonly data: Promise<summary$return>;
        then: <TResult1 = summary$return, TResult2 = never>(onfulfilled?: ((value: summary$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<summary$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<summary$return>;
    };
    readonly statement: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<statement$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<statement$return, any, {}, any>>;
        readonly data: Promise<statement$return>;
        then: <TResult1 = statement$return, TResult2 = never>(onfulfilled?: ((value: statement$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<statement$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<statement$return>;
    };
    readonly addFunds: (data: {
        params?: undefined;
        query?: undefined;
        body: addFunds$body;
    } & TRequestOptions<addFunds$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<addFunds$return, any, {}, any>>;
        readonly data: Promise<addFunds$return>;
        then: <TResult1 = addFunds$return, TResult2 = never>(onfulfilled?: ((value: addFunds$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<addFunds$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<addFunds$return>;
    };
    readonly topupStatus: (data: {
        params: topupStatus$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<topupStatus$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<topupStatus$return, any, {}, any>>;
        readonly data: Promise<topupStatus$return>;
        then: <TResult1 = topupStatus$return, TResult2 = never>(onfulfilled?: ((value: topupStatus$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<topupStatus$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<topupStatus$return>;
    };
    readonly flaggedCharge: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<flaggedCharge$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<flaggedCharge$return, any, {}, any>>;
        readonly data: Promise<flaggedCharge$return>;
        then: <TResult1 = flaggedCharge$return, TResult2 = never>(onfulfilled?: ((value: flaggedCharge$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<flaggedCharge$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<flaggedCharge$return>;
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