"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const paymentsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        config(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "config");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("payments/api/config");
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
        cards(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "cards");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("payments/api/cards");
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
        setupCard(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "setupCard");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("payments/api/cards/setup");
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
        finishCard(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "finishCard");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("payments/api/cards/finish");
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
        setDefaultCard(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "setDefaultCard");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("payments/api/cards/:id/default");
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
        removeCard(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "removeCard");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("payments/api/cards/:id");
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
        updateAccount(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "updateAccount");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("payments/api/account");
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
        webhook(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "webhook");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("payments/api/webhook/:gateway");
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
    methods.config.__scope = "payments";
    methods.cards.__scope = "payments";
    methods.setupCard.__scope = "payments";
    methods.finishCard.__scope = "payments";
    methods.setDefaultCard.__scope = "payments";
    methods.removeCard.__scope = "payments";
    methods.updateAccount.__scope = "payments";
    methods.webhook.__scope = "payments";
    sdk["_moduleGroup"].set(methods, "Billing");
    return methods;
};
exports.paymentsModule = paymentsModule;
