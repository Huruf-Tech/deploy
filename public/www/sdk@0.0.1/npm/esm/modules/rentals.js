import { compile } from "path-to-regexp";
export const rentalsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        catalog(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "catalog");
                const method = "get";
                const toPath = compile("rentals/api/catalog");
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
                sdk.checkPermission("rentals", "quote");
                const method = "get";
                const toPath = compile("rentals/api/quote");
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
        list(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "list");
                const method = "get";
                const toPath = compile("rentals/api/");
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
        request(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "request");
                const method = "post";
                const toPath = compile("rentals/api/request");
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
        withdraw(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "withdraw");
                const method = "post";
                const toPath = compile("rentals/api/:id/withdraw");
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
        resize(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("rentals", "resize");
                const method = "post";
                const toPath = compile("rentals/api/:id/resize");
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
                sdk.checkPermission("rentals", "cancel");
                const method = "post";
                const toPath = compile("rentals/api/:id/cancel");
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
    methods.catalog.__scope = "rentals";
    methods.quote.__scope = "rentals";
    methods.list.__scope = "rentals";
    methods.request.__scope = "rentals";
    methods.withdraw.__scope = "rentals";
    methods.resize.__scope = "rentals";
    methods.cancel.__scope = "rentals";
    sdk["_moduleGroup"].set(methods, "Billing");
    return methods;
};
