import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type overview$query = {
    range?: "1h" | "24h" | "7d";
};
export type createRuleHandler$body = {
    name: string;
    target: {
        kind: "controlPlane";
    };
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed" | "cpCpu" | "cpMemory" | "cpPollLatency" | "cpErrorRate" | "cpPollsMissing";
    /** Percent for cpu/memory/disk, MiB for room; a default when omitted */
    threshold?: number | undefined;
    forSec?: number | undefined;
    channels: {
        type: "email" | "webhook" | "slack";
        /** Email address or webhook URL; send a channel's masked URL back to keep it */
        target: string;
    }[];
    enabled?: boolean;
};
export type createRuleHandler$return = {
    _id: string;
};
export type updateRuleHandler$params = {
    id?: string;
};
export type updateRuleHandler$body = {
    name: string;
    target: {
        kind: "controlPlane";
    };
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed" | "cpCpu" | "cpMemory" | "cpPollLatency" | "cpErrorRate" | "cpPollsMissing";
    /** Percent for cpu/memory/disk, MiB for room; a default when omitted */
    threshold?: number | undefined;
    forSec?: number | undefined;
    channels: {
        type: "email" | "webhook" | "slack";
        /** Email address or webhook URL; send a channel's masked URL back to keep it */
        target: string;
    }[];
    enabled?: boolean;
};
export type deleteRuleHandler$params = {
    id?: string;
};
export type alerts$query = {
    open?: boolean | undefined;
    limit?: number;
};
export declare const controlPlaneModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        overview$query: overview$query;
        createRuleHandler$body: createRuleHandler$body;
        createRuleHandler$return: createRuleHandler$return;
        updateRuleHandler$params: updateRuleHandler$params;
        updateRuleHandler$body: updateRuleHandler$body;
        deleteRuleHandler$params: deleteRuleHandler$params;
        alerts$query: alerts$query;
    };
    readonly overview: (data: {
        params?: undefined;
        query: overview$query;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly rules: (data?: {
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
    readonly createRuleHandler: (data: {
        params?: undefined;
        query?: undefined;
        body: createRuleHandler$body;
    } & TRequestOptions<createRuleHandler$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<createRuleHandler$return, any, {}, any>>;
        readonly data: Promise<createRuleHandler$return>;
        then: <TResult1 = createRuleHandler$return, TResult2 = never>(onfulfilled?: ((value: createRuleHandler$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<createRuleHandler$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<createRuleHandler$return>;
    };
    readonly updateRuleHandler: (data: {
        params: updateRuleHandler$params;
        query?: undefined;
        body: updateRuleHandler$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly deleteRuleHandler: (data: {
        params: deleteRuleHandler$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly alerts: (data: {
        params?: undefined;
        query: alerts$query;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
};
//# sourceMappingURL=controlPlane.d.ts.map