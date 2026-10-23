"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageKitModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const imageKitModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        auth(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("imageKit", "auth");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("imagekit/api/auth");
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
    methods.auth.__scope = "imageKit";
    sdk["_moduleGroup"].set(methods, "Media");
    return methods;
};
exports.imageKitModule = imageKitModule;
