import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type topups$query = {
    /** A status, or `stuck` for the rows Settle/Abandon apply to */
    status?: ("initiated" | "pending" | "paid" | "processing" | "completed" | "failed" | "stuck") | undefined;
    limit?: number;
};
export type topups$return = {
    _id: string;
    tenant: string;
    tenantName?: string | undefined;
    status: "initiated" | "pending" | "paid" | "processing" | "completed" | "failed";
    amount: number;
    currency: string;
    provider?: string | undefined;
    providerRef?: string | undefined;
    purpose?: string | undefined;
    error?: string | undefined;
    stuck: boolean;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}[];
export type settle$params = {
    id?: string;
};
export type settle$return = {
    outcome: "settled" | "waiting" | "owner" | "no_charge";
    status: string;
    error?: string | undefined;
};
export type abandon$params = {
    id?: string;
};
export type events$query = {
    limit?: number;
};
export type events$return = {
    _id: string;
    kind: "refund" | "dispute";
    tenant?: string | undefined;
    tenantName?: string | undefined;
    gateway: string;
    providerRef?: string | undefined;
    amount?: number | undefined;
    currency?: string | undefined;
    processedAt: Date;
    handledAt?: Date | undefined;
}[];
export type markHandled$params = {
    id?: string;
};
export declare const paymentsAdminModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        topups$query: topups$query;
        topups$return: topups$return;
        settle$params: settle$params;
        settle$return: settle$return;
        abandon$params: abandon$params;
        events$query: events$query;
        events$return: events$return;
        markHandled$params: markHandled$params;
    };
    readonly topups: (data: {
        params?: undefined;
        query: topups$query;
        body?: undefined;
    } & TRequestOptions<topups$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<topups$return, any, {}, any>>;
        readonly data: Promise<topups$return>;
        then: <TResult1 = topups$return, TResult2 = never>(onfulfilled?: ((value: topups$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<topups$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<topups$return>;
    };
    readonly settle: (data: {
        params: settle$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<settle$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<settle$return, any, {}, any>>;
        readonly data: Promise<settle$return>;
        then: <TResult1 = settle$return, TResult2 = never>(onfulfilled?: ((value: settle$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<settle$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<settle$return>;
    };
    readonly abandon: (data: {
        params: abandon$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly events: (data: {
        params?: undefined;
        query: events$query;
        body?: undefined;
    } & TRequestOptions<events$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<events$return, any, {}, any>>;
        readonly data: Promise<events$return>;
        then: <TResult1 = events$return, TResult2 = never>(onfulfilled?: ((value: events$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<events$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<events$return>;
    };
    readonly markHandled: (data: {
        params: markHandled$params;
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
//# sourceMappingURL=paymentsAdmin.d.ts.map