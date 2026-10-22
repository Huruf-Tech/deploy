import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type get$return = {
    primaryServer?: string | undefined;
    servers: {
        _id: string;
        name: string;
        enabled: boolean;
        meshIp: string;
        subnet: string;
        endpoint?: string | undefined;
        endpointOverride?: string | undefined;
        /** Its agent reported a WireGuard key */
        joined: boolean;
        online: boolean;
        error?: string | undefined;
        reportedAt?: string | undefined;
    }[];
    reachability: {
        from: string;
        to: string;
        /** null when either side is out of the mesh */
        reachable: boolean | null;
    }[];
};
export type updateMember$params = {
    id?: string;
};
export type updateMember$body = {
    enabled?: boolean | undefined;
    /** How peers reach this server; null returns to the detected address */
    endpoint?: (string | null) | undefined;
};
export type setPrimary$body = {
    server?: string | null;
};
export declare const networksModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        get$return: get$return;
        updateMember$params: updateMember$params;
        updateMember$body: updateMember$body;
        setPrimary$body: setPrimary$body;
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
    readonly updateMember: (data: {
        params: updateMember$params;
        query?: undefined;
        body: updateMember$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly setPrimary: (data: {
        params?: undefined;
        query?: undefined;
        body: setPrimary$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
};
