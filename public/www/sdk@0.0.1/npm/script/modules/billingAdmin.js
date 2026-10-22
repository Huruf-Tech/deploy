"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingAdminModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const billingAdminModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        subscriptions(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("billingAdmin", "subscriptions");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("billingAdmin/api/subscriptions");
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
        grant(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("billingAdmin", "grant");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("billingAdmin/api/grant");
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
    methods.subscriptions.__scope = "billingAdmin";
    methods.grant.__scope = "billingAdmin";
    sdk["_moduleGroup"].set(methods, "Admin");
    return methods;
};
exports.billingAdminModule = billingAdminModule;
