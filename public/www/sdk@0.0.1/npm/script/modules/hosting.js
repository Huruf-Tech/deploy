"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostingModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const hostingModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        machine(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "machine");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/machines/:id");
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
        updateMachine(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "updateMachine");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/machines/:id");
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
        requests(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "requests");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/requests");
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
        accept(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "accept");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/:id/accept");
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
        decline(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "decline");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/:id/decline");
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
        acceptResize(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "acceptResize");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/:id/resize/accept");
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
        declineResize(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "declineResize");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/:id/resize/decline");
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
        retryRenewal(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "retryRenewal");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/:id/renew");
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
        end(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "end");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/:id/end");
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
        moveTargets(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "moveTargets");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/:id/move");
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
        propose(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "propose");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/:id/propose");
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
        capacity(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("hosting", "capacity");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("hosting/api/capacity");
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
    methods.machine.__scope = "hosting";
    methods.updateMachine.__scope = "hosting";
    methods.requests.__scope = "hosting";
    methods.accept.__scope = "hosting";
    methods.decline.__scope = "hosting";
    methods.acceptResize.__scope = "hosting";
    methods.declineResize.__scope = "hosting";
    methods.retryRenewal.__scope = "hosting";
    methods.end.__scope = "hosting";
    methods.moveTargets.__scope = "hosting";
    methods.propose.__scope = "hosting";
    methods.capacity.__scope = "hosting";
    sdk["_moduleGroup"].set(methods, "Billing");
    return methods;
};
exports.hostingModule = hostingModule;
