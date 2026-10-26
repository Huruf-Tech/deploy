"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const billingModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        get(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("billing", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("billing/api/");
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
        plans(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("billing", "plans");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("billing/api/plans");
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
        periods(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("billing", "periods");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("billing/api/periods");
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
        quote(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("billing", "quote");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("billing/api/quote");
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
        subscribe(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("billing", "subscribe");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("billing/api/subscribe");
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
                sdk.checkPermission("billing", "cancel");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("billing/api/cancel");
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
    methods.get.__scope = "billing";
    methods.plans.__scope = "billing";
    methods.periods.__scope = "billing";
    methods.quote.__scope = "billing";
    methods.subscribe.__scope = "billing";
    methods.cancel.__scope = "billing";
    sdk["_moduleGroup"].set(methods, "Billing");
    return methods;
};
exports.billingModule = billingModule;
