"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitIntegrationsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const gitIntegrationsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        list(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("gitIntegrations", "list");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("gitIntegrations/api/");
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
        connect(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("gitIntegrations", "connect");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("gitIntegrations/api/connect");
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
                sdk.checkPermission("gitIntegrations", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("gitIntegrations/api/:id");
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
                sdk.checkPermission("gitIntegrations", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("gitIntegrations/api/:id");
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
        refresh(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("gitIntegrations", "refresh");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("gitIntegrations/api/:id/refresh");
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
        repositories(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("gitIntegrations", "repositories");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("gitIntegrations/api/:id/installations/:installation/repositories");
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
        branches(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("gitIntegrations", "branches");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("gitIntegrations/api/:id/installations/:installation/branches");
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
    methods.list.__scope = "gitIntegrations";
    methods.connect.__scope = "gitIntegrations";
    methods.update.__scope = "gitIntegrations";
    methods.del.__scope = "gitIntegrations";
    methods.refresh.__scope = "gitIntegrations";
    methods.repositories.__scope = "gitIntegrations";
    methods.branches.__scope = "gitIntegrations";
    sdk["_moduleGroup"].set(methods, "Build");
    return methods;
};
exports.gitIntegrationsModule = gitIntegrationsModule;
