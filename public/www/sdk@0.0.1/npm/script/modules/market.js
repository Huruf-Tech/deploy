"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const marketModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        machines(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("market", "machines");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("market/api/machines");
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
                sdk.checkPermission("market", "quote");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("market/api/quote");
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
    methods.machines.__scope = "market";
    methods.quote.__scope = "market";
    sdk["_moduleGroup"].set(methods, "Billing");
    return methods;
};
exports.marketModule = marketModule;
