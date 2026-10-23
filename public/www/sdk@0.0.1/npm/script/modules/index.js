"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const indexModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        app(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("index", "app");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("index/app{/*endpoint}");
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
        index(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("index", "index");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("index{/*endpoint}");
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
    methods.app.__scope = "index";
    methods.index.__scope = "index";
    sdk["_moduleGroup"].set(methods, "Default");
    return methods;
};
exports.indexModule = indexModule;
