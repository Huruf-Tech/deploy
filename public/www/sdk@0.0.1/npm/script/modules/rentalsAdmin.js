"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rentalsAdminModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const rentalsAdminModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        queue(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "queue");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/queue");
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
        placement(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "placement");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/placement");
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
        approve(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "approve");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/approve");
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
        reject(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "reject");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/reject");
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
        approveResize(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "approveResize");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/resize/approve");
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
        rejectResize(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "rejectResize");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/resize/reject");
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
                sdk.checkPermission("rentalsAdmin", "moveTargets");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/move");
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
        move(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "move");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/move");
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
        cancelMove(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "cancelMove");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/move/cancel");
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
                sdk.checkPermission("rentalsAdmin", "capacity");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/capacity");
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
        recreatePartition(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "recreatePartition");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/partition");
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
        pool(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "pool");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/pool/:id");
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
        updatePool(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "updatePool");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/pool/:id");
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
    methods.queue.__scope = "rentalsAdmin";
    methods.placement.__scope = "rentalsAdmin";
    methods.approve.__scope = "rentalsAdmin";
    methods.reject.__scope = "rentalsAdmin";
    methods.approveResize.__scope = "rentalsAdmin";
    methods.rejectResize.__scope = "rentalsAdmin";
    methods.moveTargets.__scope = "rentalsAdmin";
    methods.move.__scope = "rentalsAdmin";
    methods.cancelMove.__scope = "rentalsAdmin";
    methods.capacity.__scope = "rentalsAdmin";
    methods.recreatePartition.__scope = "rentalsAdmin";
    methods.pool.__scope = "rentalsAdmin";
    methods.updatePool.__scope = "rentalsAdmin";
    sdk["_moduleGroup"].set(methods, "Admin");
    return methods;
};
exports.rentalsAdminModule = rentalsAdminModule;
