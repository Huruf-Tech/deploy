"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variablesModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const variablesModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        list(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("variables", "list");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("variables/api/");
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
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("variables", "create");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("variables/api/");
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
        importEnv(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("variables", "importEnv");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("variables/api/import");
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
        update(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("variables", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("variables/api/:id");
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
        del(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("variables", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("variables/api/:id");
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
        reveal(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("variables", "reveal");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("variables/api/:id/reveal");
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
        resolve(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("variables", "resolve");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("variables/api/resolve");
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
    methods.list.__scope = "variables";
    methods.create.__scope = "variables";
    methods.importEnv.__scope = "variables";
    methods.update.__scope = "variables";
    methods.del.__scope = "variables";
    methods.reveal.__scope = "variables";
    methods.resolve.__scope = "variables";
    sdk["_moduleGroup"].set(methods, "Configuration");
    return methods;
};
exports.variablesModule = variablesModule;
