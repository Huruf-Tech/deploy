"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rentalsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const rentalsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        list(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "list");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/");
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
        request(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "request");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/request");
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
        pay(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "pay");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/:id/pay");
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
        withdraw(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "withdraw");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/:id/withdraw");
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
        resize(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "resize");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/:id/resize");
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
        withdrawResize(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "withdrawResize");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/:id/resize/withdraw");
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
        cancel(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "cancel");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/:id/cancel");
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
        acceptProposal(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "acceptProposal");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/:id/proposal/accept");
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
        declineProposal(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "declineProposal");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/:id/proposal/decline");
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
        proposalTargets(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "proposalTargets");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/:id/proposal/targets");
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
                sdk.checkPermission("rentals", "dispute");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/:id/dispute");
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
        rateMachine(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "rateMachine");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/:id/rate");
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
                sdk.checkPermission("rentals", "report");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("rentals/api/report");
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
    methods.list.__scope = "rentals";
    methods.request.__scope = "rentals";
    methods.pay.__scope = "rentals";
    methods.withdraw.__scope = "rentals";
    methods.resize.__scope = "rentals";
    methods.withdrawResize.__scope = "rentals";
    methods.cancel.__scope = "rentals";
    methods.acceptProposal.__scope = "rentals";
    methods.declineProposal.__scope = "rentals";
    methods.proposalTargets.__scope = "rentals";
    methods.dispute.__scope = "rentals";
    methods.rateMachine.__scope = "rentals";
    methods.report.__scope = "rentals";
    sdk["_moduleGroup"].set(methods, "Billing");
    return methods;
};
exports.rentalsModule = rentalsModule;
