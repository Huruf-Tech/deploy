"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registriesModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const registriesModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        list(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("registries", "list");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("registries/api/");
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
                sdk.checkPermission("registries", "create");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("registries/api/");
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
        makeDefault(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("registries", "makeDefault");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("registries/api/:id/default");
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
                sdk.checkPermission("registries", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("registries/api/:id");
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
    methods.list.__scope = "registries";
    methods.create.__scope = "registries";
    methods.makeDefault.__scope = "registries";
    methods.del.__scope = "registries";
    sdk["_moduleGroup"].set(methods, "Infrastructure");
    return methods;
};
exports.registriesModule = registriesModule;
