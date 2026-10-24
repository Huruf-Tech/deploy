import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type subscriptions$query = {
    status?: ("active" | "pastDue" | "canceled") | undefined;
    limit?: number;
};
export type subscriptions$return = {
    status: "active" | "pastDue" | "canceled";
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd?: Date | undefined;
    lastError?: string | undefined;
    _id: string;
    tenant: string;
    tenantName?: string | undefined;
    planName?: string | undefined;
}[];
export type grant$body = {
    tenant?: string;
    plan?: string;
    days: number;
    /** Why, e.g. partner or trial */
    note: string;
};
export declare const billingAdminModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        subscriptions$query: subscriptions$query;
        subscriptions$return: subscriptions$return;
        grant$body: grant$body;
    };
    readonly subscriptions: (data: {
        params?: undefined;
        query: subscriptions$query;
        body?: undefined;
    } & TRequestOptions<subscriptions$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<subscriptions$return, any, {}, any>>;
        readonly data: Promise<subscriptions$return>;
        then: <TResult1 = subscriptions$return, TResult2 = never>(onfulfilled?: ((value: subscriptions$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<subscriptions$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<subscriptions$return>;
    };
    readonly grant: (data: {
        params?: undefined;
        query?: undefined;
        body: grant$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
};
//# sourceMappingURL=billingAdmin.d.ts.map