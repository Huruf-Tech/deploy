"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rentalsAdminModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const rentalsAdminModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        suspend(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "suspend");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/suspend");
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
        resume(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "resume");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/resume");
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
        terminate(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "terminate");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/terminate");
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
        waiting(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "waiting");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/waiting");
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
        refund(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "refund");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/:id/refund");
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
        machine(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "machine");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/machines/:id");
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
        dispute(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "dispute");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/disputes/:id");
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
        report(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "report");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/reports/:id");
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
        listDisputes(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "listDisputes");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/disputes");
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
        resolveDispute(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "resolveDispute");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/disputes/:id/resolve");
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
        listReverts(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "listReverts");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/reverts");
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
        decideRevert(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "decideRevert");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/reverts/:id/decide");
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
        listReports(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "listReports");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/reports");
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
        closeReport(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentalsAdmin", "closeReport");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentalsAdmin/api/reports/:id/close");
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
    methods.suspend.__scope = "rentalsAdmin";
    methods.resume.__scope = "rentalsAdmin";
    methods.terminate.__scope = "rentalsAdmin";
    methods.moveTargets.__scope = "rentalsAdmin";
    methods.move.__scope = "rentalsAdmin";
    methods.cancelMove.__scope = "rentalsAdmin";
    methods.capacity.__scope = "rentalsAdmin";
    methods.waiting.__scope = "rentalsAdmin";
    methods.recreatePartition.__scope = "rentalsAdmin";
    methods.refund.__scope = "rentalsAdmin";
    methods.machine.__scope = "rentalsAdmin";
    methods.dispute.__scope = "rentalsAdmin";
    methods.report.__scope = "rentalsAdmin";
    methods.listDisputes.__scope = "rentalsAdmin";
    methods.resolveDispute.__scope = "rentalsAdmin";
    methods.listReverts.__scope = "rentalsAdmin";
    methods.decideRevert.__scope = "rentalsAdmin";
    methods.listReports.__scope = "rentalsAdmin";
    methods.closeReport.__scope = "rentalsAdmin";
    sdk["_moduleGroup"].set(methods, "Admin");
    return methods;
};
exports.rentalsAdminModule = rentalsAdminModule;
