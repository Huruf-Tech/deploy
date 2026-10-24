import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type get$return = {
    plan: {
        _id?: string | undefined;
        name: string;
    };
    source: "period" | "free";
    limits: {
        servers: number;
        projects: number;
        members: number;
        releasesKept: number;
        variablesPerScope: number;
        deploysPerHour: number;
        concurrentTerminals: number;
        concurrentStreams: number;
        variableApiReadsPerMinute: number;
        templates: number;
        alertRules: number;
        gitIntegrations: number;
        registries: number;
        managedServers: number;
    };
    features: {
        blueGreen: boolean;
        autoscale: boolean;
        privateNetwork: boolean;
        backups: boolean;
        managedServers: boolean;
    };
    period?: {
        periodStart: Date;
        periodEnd: Date;
        kind: "paid" | "complimentary";
    } | undefined;
    subscription?: {
        status: "active" | "pastDue" | "canceled";
        autoRenew: boolean;
        cancelAtPeriodEnd: boolean;
        currentPeriodEnd?: Date | undefined;
        nextRenewalAttemptAt?: Date | undefined;
        lastError?: string | undefined;
        nextPlan?: string | undefined;
    } | undefined;
    usage: {
        [K in string]: number;
    };
    overLimitSince?: Date | undefined;
    graceDays: number;
    wallets: {
        currency: string;
        balance: number;
    }[];
    isOwner: boolean;
    paymentsReady: boolean;
};
export type plans$return = {
    name: string;
    slug: string;
    description?: string | undefined;
    visibility: "public" | "private";
    price: {
        amount: number;
        currency: string;
        interval: "month" | "year";
    };
    limits: {
        servers: number;
        projects: number;
        members: number;
        releasesKept: number;
        variablesPerScope: number;
        deploysPerHour: number;
        concurrentTerminals: number;
        concurrentStreams: number;
        variableApiReadsPerMinute: number;
        templates: number;
        alertRules: number;
        gitIntegrations: number;
        registries: number;
        managedServers: number;
    };
    features: {
        blueGreen: boolean;
        autoscale: boolean;
        privateNetwork: boolean;
        backups: boolean;
        managedServers: boolean;
    };
    isFree: boolean;
    active: boolean;
    sortOrder: number;
    updatedAt: Date;
    _id: string;
}[];
export type periods$return = {
    periodStart: Date;
    periodEnd: Date;
    amount: number;
    currency: string;
    kind: "paid" | "complimentary";
    note?: string | undefined;
    ledgerReference?: string | undefined;
    _id: string;
    planName?: string | undefined;
}[];
export type subscribe$body = {
    plan?: string;
};
export type subscribe$return = {
    result: "active" | "scheduled" | "resumed";
    /** When a scheduled change applies */
    at?: Date | undefined;
};
export declare const billingModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        get$return: get$return;
        plans$return: plans$return;
        periods$return: periods$return;
        subscribe$body: subscribe$body;
        subscribe$return: subscribe$return;
    };
    readonly get: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<get$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<get$return, any, {}, any>>;
        readonly data: Promise<get$return>;
        then: <TResult1 = get$return, TResult2 = never>(onfulfilled?: ((value: get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<get$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<get$return>;
    };
    readonly plans: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<plans$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<plans$return, any, {}, any>>;
        readonly data: Promise<plans$return>;
        then: <TResult1 = plans$return, TResult2 = never>(onfulfilled?: ((value: plans$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<plans$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<plans$return>;
    };
    readonly periods: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<periods$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<periods$return, any, {}, any>>;
        readonly data: Promise<periods$return>;
        then: <TResult1 = periods$return, TResult2 = never>(onfulfilled?: ((value: periods$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<periods$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<periods$return>;
    };
    readonly subscribe: (data: {
        params?: undefined;
        query?: undefined;
        body: subscribe$body;
    } & TRequestOptions<subscribe$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<subscribe$return, any, {}, any>>;
        readonly data: Promise<subscribe$return>;
        then: <TResult1 = subscribe$return, TResult2 = never>(onfulfilled?: ((value: subscribe$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<subscribe$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<subscribe$return>;
    };
    readonly cancel: (data?: {
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
//# sourceMappingURL=billing.d.ts.map