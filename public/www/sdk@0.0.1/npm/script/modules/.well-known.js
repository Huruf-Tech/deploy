"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wellKnownModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const wellKnownModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        oauthServerMeta(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("wellKnown", "oauthServerMeta");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)(".well-known/oauth-authorization-server{/*endpoint}");
                const requestPayload = {
                    method,
                    url: toPath(data?.params),
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
                const toPath = (0, path_to_regexp_1.compile)(".well-known/openid-configuration{/*endpoint}");
                const requestPayload = {
                    method,
                    url: toPath(data?.params),
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
exports.wellKnownModule = wellKnownModule;
