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
        type: "credit" | "debit";
        description?: (string | Record<string, string>) | undefined;
        purpose?: string | undefined;
        foreignRefType?: string | undefined;
        foreignRef?: string | undefined;
        reference: string;
        isRefund?: boolean | undefined;
        /** Reference to the original transaction if this is a refund */
        refundedReference?: string | undefined;
        isRefunded?: boolean | undefined;
        /** Reference to the refund transaction if this transaction has been refunded */
        refundReference?: string | undefined;
        idempotencyKey: string;
        currency: string;
        amount: number;
        previousBalance: number;
        tenant: string;
        wallet: string;
        oppositeTenant: string;
        oppositeWallet: string;
        executorUser?: string | undefined;
        tags?: string[] | undefined;
        metadata?: Record<string, any> | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
        _id: string;
    }[];
};
export declare const walletLedgersModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        count$query: count$query;
        count$return: count$return;
        get$params: get$params;
        get$query: get$query;
        get$return: get$return;
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
