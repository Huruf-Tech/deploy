import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type list$query = {
    project?: string;
};
export type list$return = {
    _id: string;
    project: string;
    hostname: string;
    status: "pending" | "checking" | "issuing" | "verifying" | "active" | "failed";
    /** A free test domain */
    appDomain?: boolean | undefined;
    checks?: {
        ownership: boolean;
        dns: boolean;
        checkedAt: string;
        detail?: string | undefined;
    } | undefined;
    checkUntil?: string | undefined;
    verifiedAt?: string | undefined;
    error?: string | undefined;
    certificate?: {
        notAfter: string;
        issuedAt: string;
    } | undefined;
    records: {
        ownership: {
            type: "TXT";
            name: string;
            value: string;
        };
        cname?: string | undefined;
        ipv4?: string[] | undefined;
    };
    createdAt: string;
}[];
export type create$body = {
    project?: string;
    hostname: string;
};
export type create$return = {
    _id: string;
};
export type appDomainInfo$return = {
    domain?: string | undefined;
};
export type addTestDomain$body = {
    project?: string;
};
export type addTestDomain$return = {
    _id: string;
};
export type check$params = {
    id?: string;
};
export type cloudflareConnection$return = {
    connected: boolean;
    zones?: number | undefined;
    connectedAt?: Date | undefined;
    /** Connecting is a sign-in on Cloudflare; else an API token is pasted */
    signIn: boolean;
};
export type connectCloudflareToken$body = {
    token: string;
};
export type connectCloudflareToken$return = {
    zones: number;
};
export type authorizeCloudflare$query = {
    /** The dashboard path to return to */
    back: string;
};
export type authorizeCloudflare$return = {
    url: string;
};
export type setUpCloudflare$params = {
    id?: string;
};
export type setUpCloudflare$body = {
    /** Replace records pointing elsewhere (the owner only) */
    replace?: boolean | undefined;
};
export type setUpCloudflare$return = {
    applied: boolean;
    created?: string[] | undefined;
    zone?: string | undefined;
    conflicts?: {
        type: string;
        content: string;
        proxied: boolean;
    }[] | undefined;
};
export type del$params = {
    id?: string;
};
export declare const domainsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        list$query: list$query;
        list$return: list$return;
        create$body: create$body;
        create$return: create$return;
        appDomainInfo$return: appDomainInfo$return;
        addTestDomain$body: addTestDomain$body;
        addTestDomain$return: addTestDomain$return;
        check$params: check$params;
        cloudflareConnection$return: cloudflareConnection$return;
        connectCloudflareToken$body: connectCloudflareToken$body;
        connectCloudflareToken$return: connectCloudflareToken$return;
        authorizeCloudflare$query: authorizeCloudflare$query;
        authorizeCloudflare$return: authorizeCloudflare$return;
        setUpCloudflare$params: setUpCloudflare$params;
        setUpCloudflare$body: setUpCloudflare$body;
        setUpCloudflare$return: setUpCloudflare$return;
        del$params: del$params;
    };
    readonly list: (data: {
        params?: undefined;
        query: list$query;
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
    readonly appDomainInfo: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<appDomainInfo$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<appDomainInfo$return, any, {}, any>>;
        readonly data: Promise<appDomainInfo$return>;
        then: <TResult1 = appDomainInfo$return, TResult2 = never>(onfulfilled?: ((value: appDomainInfo$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<appDomainInfo$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<appDomainInfo$return>;
    };
    readonly addTestDomain: (data: {
        params?: undefined;
        query?: undefined;
        body: addTestDomain$body;
    } & TRequestOptions<addTestDomain$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<addTestDomain$return, any, {}, any>>;
        readonly data: Promise<addTestDomain$return>;
        then: <TResult1 = addTestDomain$return, TResult2 = never>(onfulfilled?: ((value: addTestDomain$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<addTestDomain$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<addTestDomain$return>;
    };
    readonly check: (data: {
        params: check$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly cloudflareConnection: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<cloudflareConnection$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<cloudflareConnection$return, any, {}, any>>;
        readonly data: Promise<cloudflareConnection$return>;
        then: <TResult1 = cloudflareConnection$return, TResult2 = never>(onfulfilled?: ((value: cloudflareConnection$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<cloudflareConnection$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<cloudflareConnection$return>;
    };
    readonly connectCloudflareToken: (data: {
        params?: undefined;
        query?: undefined;
        body: connectCloudflareToken$body;
    } & TRequestOptions<connectCloudflareToken$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<connectCloudflareToken$return, any, {}, any>>;
        readonly data: Promise<connectCloudflareToken$return>;
        then: <TResult1 = connectCloudflareToken$return, TResult2 = never>(onfulfilled?: ((value: connectCloudflareToken$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<connectCloudflareToken$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<connectCloudflareToken$return>;
    };
    readonly disconnectCloudflare: (data?: {
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
    readonly authorizeCloudflare: (data: {
        params?: undefined;
        query: authorizeCloudflare$query;
        body?: undefined;
    } & TRequestOptions<authorizeCloudflare$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<authorizeCloudflare$return, any, {}, any>>;
        readonly data: Promise<authorizeCloudflare$return>;
        then: <TResult1 = authorizeCloudflare$return, TResult2 = never>(onfulfilled?: ((value: authorizeCloudflare$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<authorizeCloudflare$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<authorizeCloudflare$return>;
    };
    readonly cloudflareCallback: (data?: {
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
    readonly setUpCloudflare: (data: {
        params: setUpCloudflare$params;
        query?: undefined;
        body: setUpCloudflare$body;
    } & TRequestOptions<setUpCloudflare$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<setUpCloudflare$return, any, {}, any>>;
        readonly data: Promise<setUpCloudflare$return>;
        then: <TResult1 = setUpCloudflare$return, TResult2 = never>(onfulfilled?: ((value: setUpCloudflare$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<setUpCloudflare$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<setUpCloudflare$return>;
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
//# sourceMappingURL=domains.d.ts.map