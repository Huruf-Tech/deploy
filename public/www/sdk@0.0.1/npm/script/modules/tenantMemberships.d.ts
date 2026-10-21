import type { TRequestOptions, TPagination } from "../types.js";
import type { BaseSDK } from "../base.js";
export type get$params = {
    id?: string | undefined;
};
export type get$query = TPagination;
export type get$return = {
    results: {
        user: string;
        email?: string | undefined;
        role?: string | undefined;
        isOwner: boolean;
        expiresAt?: Date | undefined;
        createdBy: string;
        createdAt: Date | undefined;
        tenant: {
            name: string;
            logo?: string | undefined;
            createdBy: string;
            createdAt: Date | undefined;
            _id: string;
        };
        _id: string;
    }[];
};
export declare const tenantMembershipsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        get$params: get$params;
        get$query: get$query;
        get$return: get$return;
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
