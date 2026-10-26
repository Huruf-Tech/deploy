import { compile } from "path-to-regexp";
export const paymentsAdminModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        topups(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("paymentsAdmin", "topups");
                const method = "get";
                const toPath = compile("paymentsAdmin/api/topups");
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
        settle(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("paymentsAdmin", "settle");
                const method = "post";
                const toPath = compile("paymentsAdmin/api/topups/:id/settle");
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
        abandon(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("paymentsAdmin", "abandon");
                const method = "post";
                const toPath = compile("paymentsAdmin/api/topups/:id/abandon");
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
        events(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("paymentsAdmin", "events");
                const method = "get";
                const toPath = compile("paymentsAdmin/api/events");
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
        markHandled(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("paymentsAdmin", "markHandled");
                const method = "post";
                const toPath = compile("paymentsAdmin/api/events/:id/handled");
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
    methods.topups.__scope = "paymentsAdmin";
    methods.settle.__scope = "paymentsAdmin";
    methods.abandon.__scope = "paymentsAdmin";
    methods.events.__scope = "paymentsAdmin";
    methods.markHandled.__scope = "paymentsAdmin";
    sdk["_moduleGroup"].set(methods, "Admin");
    return methods;
};
