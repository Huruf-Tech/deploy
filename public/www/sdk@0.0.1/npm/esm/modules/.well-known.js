import { compile } from "path-to-regexp";
export const wellKnownModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        oauthServerMeta(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("wellKnown", "oauthServerMeta");
                const method = "get";
                const toPath = compile(".well-known/oauth-authorization-server{/*endpoint}");
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
        openidConfig(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("wellKnown", "openidConfig");
                const method = "get";
                const toPath = compile(".well-known/openid-configuration{/*endpoint}");
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
    methods.oauthServerMeta.__scope = "wellKnown";
    methods.openidConfig.__scope = "wellKnown";
    sdk["_moduleGroup"].set(methods, "Default");
    return methods;
};
