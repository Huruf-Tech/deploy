import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type list$return = {
    name: string;
    target: {
        kind: "server" | "project";
        /** Every server (or project) when absent */
        ref?: string | undefined;
    };
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed";
    /** Percent for cpu/memory/disk (above fires); MiB of room (below fires) */
    threshold: number;
    forSec: number;
    enabled: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    _id: string;
    channels: {
        type: string;
        target: string;
    }[];
}[];
export type create$body = {
    name: string;
    target: {
        kind: "server" | "project";
        ref?: string | undefined;
    };
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed";
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
export type create$return = {
    _id: string;
};
export type update$params = {
    id?: string;
};
export type update$body = {
    name: string;
    target: {
        kind: "server" | "project";
        ref?: string | undefined;
    };
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed";
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
export type del$params = {
    id?: string;
};
export declare const alertRulesModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        list$return: list$return;
        create$body: create$body;
        create$return: create$return;
        update$params: update$params;
        update$body: update$body;
        del$params: del$params;
    };
    readonly list: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<list$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<list$return, any, {}, any>>;
        readonly data: Promise<list$return>;
        then: <TResult1 = list$return, TResult2 = never>(onfulfilled?: ((value: list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<list$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<list$return>;
    };
    readonly create: (data: {
        params?: undefined;
        query?: undefined;
        body: create$body;
    } & TRequestOptions<create$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<create$return, any, {}, any>>;
        readonly data: Promise<create$return>;
        then: <TResult1 = create$return, TResult2 = never>(onfulfilled?: ((value: create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<create$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<create$return>;
    };
    readonly update: (data: {
        params: update$params;
        query?: undefined;
        body: update$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly del: (data: {
        params: del$params;
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
