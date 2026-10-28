import { compile } from "path-to-regexp";
export const earningsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        summary(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("earnings", "summary");
                const method = "get";
                const toPath = compile("earnings/api/");
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
        claim(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("earnings", "claim");
                const method = "post";
                const toPath = compile("earnings/api/claim");
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
        revert(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("earnings", "revert");
                const method = "post";
                const toPath = compile("earnings/api/claims/:id/revert");
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
    methods.summary.__scope = "earnings";
    methods.claim.__scope = "earnings";
    methods.revert.__scope = "earnings";
    sdk["_moduleGroup"].set(methods, "Billing");
    return methods;
};
