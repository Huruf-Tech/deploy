"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const meModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        get(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("me", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("me/api/");
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
        setPhoneNumber(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("me", "setPhoneNumber");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("me/api/phone-number");
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
        verifyPhoneNumber(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("me", "verifyPhoneNumber");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("me/api/phone-number/verify");
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
    methods.get.__scope = "me";
    methods.setPhoneNumber.__scope = "me";
    methods.verifyPhoneNumber.__scope = "me";
    return methods;
};
exports.meModule = meModule;
