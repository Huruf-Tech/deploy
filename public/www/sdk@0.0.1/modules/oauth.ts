import type { 
    TRequestOptions,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

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
    resourceGrant: {
        [K in string]: string[];
    };
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

export const oauthModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        authorize$query: authorize$query,
        consent$query: consent$query,
        consent$body: consent$body,
        consent$return: consent$return,
        token$body: token$body,
        token$return: token$return,
        revoke$body: revoke$body,
    };

    const methods = {
        type,
        authorize(data: {
        params?: undefined,
        query: authorize$query,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("oauth", "authorize");

            const method = "get";
            const toPath = compile("oauth/authorize");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        consent(data: {
        params?: undefined,
        query: consent$query,
        body: consent$body,
    } & TRequestOptions<consent$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("oauth", "consent");

            const method = "post";
            const toPath = compile("oauth/consent");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        token(data: {
        params?: undefined,
        query?: undefined,
        body: token$body,
    } & TRequestOptions<token$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("oauth", "token");

            const method = "post";
            const toPath = compile("oauth/token");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        revoke(data: {
        params?: undefined,
        query?: undefined,
        body: revoke$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("oauth", "revoke");

            const method = "post";
            const toPath = compile("oauth/revoke");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        jwks(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("oauth", "jwks");

            const method = "get";
            const toPath = compile("oauth/jwks");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
    } as const;

    (methods.authorize as any).__scope = "oauth";
    (methods.consent as any).__scope = "oauth";
    (methods.token as any).__scope = "oauth";
    (methods.revoke as any).__scope = "oauth";
    (methods.jwks as any).__scope = "oauth";

    sdk["_moduleGroup"].set(methods, "OAuth");


    return methods;
};