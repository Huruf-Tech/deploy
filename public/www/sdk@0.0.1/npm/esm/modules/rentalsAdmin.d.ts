import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type queue$return = {
    _id: string;
    tenant: string;
    tenantName?: string | undefined;
    status: string;
    /** Plan name */
    plan?: string | undefined;
    size: {
        cpus: number;
        memMb: number;
        diskGb: number;
    };
    /** The size a resize asks for */
    resizeTo?: string | undefined;
    requestedAt: Date;
}[];
export type placement$params = {
    id?: string;
};
export type placement$return = {
    server: string;
    name: string;
    free: {
        memMb: number;
        diskGb: number;
    };
    cpuRoom: number;
    fits: boolean;
    remainderShort: boolean;
    remainderUsesMb?: number | undefined;
}[];
export type approve$params = {
    id?: string;
};
export type approve$body = {
    host?: string;
};
export type reject$params = {
    id?: string;
};
export type reject$body = {
    reason: string;
};
export type approveResize$params = {
    id?: string;
};
export type rejectResize$params = {
    id?: string;
};
export type rejectResize$body = {
    reason: string;
};
export type recreatePartition$params = {
    id?: string;
};
export type ensurePool$params = {
    id?: string;
};
export type ensurePool$body = {
    device?: string | undefined;
    loopSizeGb?: number | undefined;
};
export type updatePool$params = {
    id?: string;
};
export type updatePool$body = {
    class?: string | undefined;
    accepting?: boolean | undefined;
    monthlyCost?: number | undefined;
};
export type createRemainder$params = {
    id?: string;
};
export declare const rentalsAdminModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        queue$return: queue$return;
        placement$params: placement$params;
        placement$return: placement$return;
        approve$params: approve$params;
        approve$body: approve$body;
        reject$params: reject$params;
        reject$body: reject$body;
        approveResize$params: approveResize$params;
        rejectResize$params: rejectResize$params;
        rejectResize$body: rejectResize$body;
        recreatePartition$params: recreatePartition$params;
        ensurePool$params: ensurePool$params;
        ensurePool$body: ensurePool$body;
        updatePool$params: updatePool$params;
        updatePool$body: updatePool$body;
        createRemainder$params: createRemainder$params;
    };
    readonly queue: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<queue$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<queue$return, any, {}, any>>;
        readonly data: Promise<queue$return>;
        then: <TResult1 = queue$return, TResult2 = never>(onfulfilled?: ((value: queue$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<queue$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<queue$return>;
    };
    readonly placement: (data: {
        params: placement$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<placement$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<placement$return, any, {}, any>>;
        readonly data: Promise<placement$return>;
        then: <TResult1 = placement$return, TResult2 = never>(onfulfilled?: ((value: placement$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<placement$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<placement$return>;
    };
    readonly approve: (data: {
        params: approve$params;
        query?: undefined;
        body: approve$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly reject: (data: {
        params: reject$params;
        query?: undefined;
        body: reject$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly approveResize: (data: {
        params: approveResize$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly rejectResize: (data: {
        params: rejectResize$params;
        query?: undefined;
        body: rejectResize$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly recreatePartition: (data: {
        params: recreatePartition$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly ensurePool: (data: {
        params: ensurePool$params;
        query?: undefined;
        body: ensurePool$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly updatePool: (data: {
        params: updatePool$params;
        query?: undefined;
        body: updatePool$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly createRemainder: (data: {
        params: createRemainder$params;
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
//# sourceMappingURL=rentalsAdmin.d.ts.map