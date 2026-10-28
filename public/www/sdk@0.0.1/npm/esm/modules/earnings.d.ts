import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type summary$return = {
    /** Cents claimable now */
    available: number;
    /** Released but frozen by an open dispute */
    frozen: number;
    /** Waiting its 14 days */
    held: number;
    /** Expected from the running months */
    pending: number;
    security: {
        machine: string;
        name?: string | undefined;
        amount: number;
    }[];
    entries: {
        _id: string;
        type: string;
        bucket: string;
        amount: number;
        machine?: string | undefined;
        availableAt: Date;
        createdAt: Date;
        revert?: ("done" | "pending" | "rejected") | undefined;
    }[];
};
export type claim$body = {
    amount: number;
};
export type claim$return = {
    claim: string;
};
export type revert$params = {
    id?: string;
};
export type revert$return = {
    result: "reverted" | "requested";
    /** Cents: taken back, or the most an admin can */
    amount: number;
};
export declare const earningsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        summary$return: summary$return;
        claim$body: claim$body;
        claim$return: claim$return;
        revert$params: revert$params;
        revert$return: revert$return;
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
    readonly claim: (data: {
        params?: undefined;
        query?: undefined;
        body: claim$body;
    } & TRequestOptions<claim$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<claim$return, any, {}, any>>;
        readonly data: Promise<claim$return>;
        then: <TResult1 = claim$return, TResult2 = never>(onfulfilled?: ((value: claim$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<claim$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<claim$return>;
    };
    readonly revert: (data: {
        params: revert$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<revert$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<revert$return, any, {}, any>>;
        readonly data: Promise<revert$return>;
        then: <TResult1 = revert$return, TResult2 = never>(onfulfilled?: ((value: revert$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<revert$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<revert$return>;
    };
};
//# sourceMappingURL=earnings.d.ts.map