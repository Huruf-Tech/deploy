"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertRulesModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const alertRulesModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        list(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("alertRules", "list");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("alertRules/api/");
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
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("alertRules", "create");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("alertRules/api/");
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
        update(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("alertRules", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("alertRules/api/:id");
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
        del(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("alertRules", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("alertRules/api/:id");
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
    methods.list.__scope = "alertRules";
    methods.create.__scope = "alertRules";
    methods.update.__scope = "alertRules";
    methods.del.__scope = "alertRules";
    sdk["_moduleGroup"].set(methods, "Monitoring");
    return methods;
};
exports.alertRulesModule = alertRulesModule;
