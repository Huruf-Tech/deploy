import { compile } from "path-to-regexp";
export const oauthModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        authorize(data) {
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
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        consent(data) {
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
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        token(data) {
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
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        revoke(data) {
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
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        jwks(data) {
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
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
    };
    methods.authorize.__scope = "oauth";
    methods.consent.__scope = "oauth";
    methods.token.__scope = "oauth";
    methods.revoke.__scope = "oauth";
    methods.jwks.__scope = "oauth";
    sdk["_moduleGroup"].set(methods, "OAuth");
    return methods;
};
