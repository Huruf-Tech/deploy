"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const homeModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        status(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("home", "status");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("home/api/");
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
    methods.status.__scope = "home";
    sdk["_moduleGroup"].set(methods, "Default");
    return methods;
};
exports.homeModule = homeModule;
