import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type authorize$query = {
    response_type: "code";
    client_id: string;
    scope: string;
    state?: string | undefined;
    code_challenge: string;
    code_challenge_method: "S256";
    nonce?: string | undefined;
    redirect_uri: string;
};
export type consent$query = {
    response_type: "code";
    client_id: string;
    scope: string;
    state?: string | undefined;
    code_challenge: string;
    code_challenge_method: "S256";
    nonce?: string | undefined;
    redirect_uri: string;
};
export type consent$body = {
    resourceGrant: Record<string, string[]>;
};
export type consent$return = {
    _id: string;
};
export type token$body = {
    grant_type: "authorization_code" | "refresh_token";
    client_id: string;
    code?: string | undefined;
    code_verifier?: string | undefined;
    redirect_uri?: string | undefined;
    refresh_token?: string | undefined;
};
export type token$return = {
    token_type: "Bearer";
    refresh_token?: string | undefined;
    access_token: string;
    id_token?: string | undefined;
    expires_in: number;
};
export type revoke$body = {
    client_id?: string | undefined;
    token_type_hint?: ("refresh_token" | "access_token") | undefined;
    token: string;
};
export declare const oauthModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        authorize$query: authorize$query;
        consent$query: consent$query;
        consent$body: consent$body;
        consent$return: consent$return;
        token$body: token$body;
        token$return: token$return;
        revoke$body: revoke$body;
    };
    readonly authorize: (data: {
        params?: undefined;
        query: authorize$query;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly consent: (data: {
        params?: undefined;
        query: consent$query;
        body: consent$body;
    } & TRequestOptions<consent$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<consent$return, any, {}, any>>;
        readonly data: Promise<consent$return>;
        then: <TResult1 = consent$return, TResult2 = never>(onfulfilled?: ((value: consent$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<consent$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<consent$return>;
    };
    readonly token: (data: {
        params?: undefined;
        query?: undefined;
        body: token$body;
    } & TRequestOptions<token$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<token$return, any, {}, any>>;
        readonly data: Promise<token$return>;
        then: <TResult1 = token$return, TResult2 = never>(onfulfilled?: ((value: token$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<token$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<token$return>;
    };
    readonly revoke: (data: {
        params?: undefined;
        query?: undefined;
        body: revoke$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly jwks: (data?: {
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
