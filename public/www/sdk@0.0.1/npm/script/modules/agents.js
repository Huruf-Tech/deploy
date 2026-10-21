"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const agentsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        hello(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("agents", "hello");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("agents/api/hello");
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
        poll(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("agents", "poll");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("agents/api/poll");
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
        installScript(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("agents", "installScript");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("agents/api/install.sh");
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
        config(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("agents", "config");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("agents/api/config");
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
        events(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("agents", "events");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("agents/api/events");
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
    methods.hello.__scope = "agents";
    methods.poll.__scope = "agents";
    methods.installScript.__scope = "agents";
    methods.config.__scope = "agents";
    methods.events.__scope = "agents";
    sdk["_moduleGroup"].set(methods, "Agents");
    return methods;
};
exports.agentsModule = agentsModule;
