import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type branding$return = {
    name: string;
    description?: string | undefined;
    logo?: string | undefined;
    heroImage?: string | undefined;
    heroTitle?: string | undefined;
    homepageURL?: string | undefined;
    termsURL?: string | undefined;
    privacyURL?: string | undefined;
    theme: Record<string, string>;
    hidePoweredBy?: boolean | undefined;
};
export type capabilities$return = {
    capabilities: string[];
};
export type handleAuth$params = {
    endpoint?: string[] | undefined;
};
export type betterAuthUI$params = {
    endpoint?: string[] | undefined;
};
export declare const authModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        branding$return: branding$return;
        capabilities$return: capabilities$return;
        handleAuth$params: handleAuth$params;
        betterAuthUI$params: betterAuthUI$params;
    };
    readonly branding: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<branding$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<branding$return, any, {}, any>>;
        readonly data: Promise<branding$return>;
        then: <TResult1 = branding$return, TResult2 = never>(onfulfilled?: ((value: branding$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<branding$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<branding$return>;
    };
    readonly capabilities: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<capabilities$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<capabilities$return, any, {}, any>>;
        readonly data: Promise<capabilities$return>;
        then: <TResult1 = capabilities$return, TResult2 = never>(onfulfilled?: ((value: capabilities$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<capabilities$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<capabilities$return>;
    };
    readonly handleAuth: (data: {
        params: handleAuth$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly betterAuthUI: (data: {
        params: betterAuthUI$params;
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
