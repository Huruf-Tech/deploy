import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type acmeChallenge$params = {
    token: string;
};
export type traefik$return = {
    [K in string]: unknown;
};
export type frp$body = {
    op?: string | undefined;
    content?: {
        [K in string]: unknown;
    } | undefined;
};
export type frp$return = {
    [K in string]: unknown;
};
export declare const ingressModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        acmeChallenge$params: acmeChallenge$params;
        traefik$return: traefik$return;
        frp$body: frp$body;
        frp$return: frp$return;
    };
    readonly acmeChallenge: (data: {
        params: acmeChallenge$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly traefik: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<traefik$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<traefik$return, any, {}, any>>;
        readonly data: Promise<traefik$return>;
        then: <TResult1 = traefik$return, TResult2 = never>(onfulfilled?: ((value: traefik$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<traefik$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<traefik$return>;
    };
    readonly frp: (data: {
        params?: undefined;
        query?: undefined;
        body: frp$body;
    } & TRequestOptions<frp$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<frp$return, any, {}, any>>;
        readonly data: Promise<frp$return>;
        then: <TResult1 = frp$return, TResult2 = never>(onfulfilled?: ((value: frp$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<frp$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<frp$return>;
    };
};
//# sourceMappingURL=ingress.d.ts.map