"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networksModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const networksModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        get(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("networks", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("networks/api/");
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
        updateMember(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("networks", "updateMember");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("networks/api/servers/:id");
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
        setPrimary(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("networks", "setPrimary");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("networks/api/primary");
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
    methods.get.__scope = "networks";
    methods.updateMember.__scope = "networks";
    methods.setPrimary.__scope = "networks";
    sdk["_moduleGroup"].set(methods, "Infrastructure");
    return methods;
};
exports.networksModule = networksModule;
