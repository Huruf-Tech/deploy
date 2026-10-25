"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const aiModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        status(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("ai", "status");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("ai/api/status");
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
        draft(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("ai", "draft");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("ai/api/draft");
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
        fix(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("ai", "fix");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("ai/api/fix");
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
        applyAiFix(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("ai", "applyAiFix");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("ai/api/fix/apply");
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
    methods.status.__scope = "ai";
    methods.draft.__scope = "ai";
    methods.fix.__scope = "ai";
    methods.applyAiFix.__scope = "ai";
    sdk["_moduleGroup"].set(methods, "Build");
    return methods;
};
exports.aiModule = aiModule;
