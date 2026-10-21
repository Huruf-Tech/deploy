"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const streamsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        openLogs(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("streams", "openLogs");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("streams/api/logs");
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
        openMetrics(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("streams", "openMetrics");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("streams/api/metrics");
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
        openExec(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("streams", "openExec");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("streams/api/exec");
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
        openTerminal(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("streams", "openTerminal");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("streams/api/terminal");
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
        openHostTerminal(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("streams", "openHostTerminal");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("streams/api/terminal/host");
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
        input(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("streams", "input");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("streams/api/:id/input");
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
        read(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("streams", "read");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("streams/api/:id/chunks");
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
        close(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("streams", "close");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("streams/api/:id/close");
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
    methods.openLogs.__scope = "streams";
    methods.openMetrics.__scope = "streams";
    methods.openExec.__scope = "streams";
    methods.openTerminal.__scope = "streams";
    methods.openHostTerminal.__scope = "streams";
    methods.input.__scope = "streams";
    methods.read.__scope = "streams";
    methods.close.__scope = "streams";
    sdk["_moduleGroup"].set(methods, "Streams");
    return methods;
};
exports.streamsModule = streamsModule;
