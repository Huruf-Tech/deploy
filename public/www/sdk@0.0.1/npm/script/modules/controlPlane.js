"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.controlPlaneModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const controlPlaneModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        overview(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("controlPlane", "overview");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("controlPlane/api/overview");
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
    methods.overview.__scope = "controlPlane";
    sdk["_moduleGroup"].set(methods, "Admin");
    return methods;
};
exports.controlPlaneModule = controlPlaneModule;
