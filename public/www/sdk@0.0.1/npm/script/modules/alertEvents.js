"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertEventsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const alertEventsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        list(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("alertEvents", "list");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("alertEvents/api/");
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
    methods.list.__scope = "alertEvents";
    sdk["_moduleGroup"].set(methods, "Monitoring");
    return methods;
};
exports.alertEventsModule = alertEventsModule;
