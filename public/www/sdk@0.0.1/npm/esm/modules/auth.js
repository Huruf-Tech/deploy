import { compile } from "path-to-regexp";
export const authModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        branding(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("auth", "branding");
                const method = "get";
                const toPath = compile("auth/branding");
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
        capabilities(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("auth", "capabilities");
                const method = "get";
                const toPath = compile("auth/api/capabilities");
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
        handleAuth(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("auth", "handleAuth");
                const method = "all";
                const toPath = compile("auth/api{/*endpoint}");
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
        betterAuthUI(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("auth", "betterAuthUI");
                const method = "get";
                const toPath = compile("auth{/*endpoint}");
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
    methods.branding.__scope = "auth";
    methods.capabilities.__scope = "auth";
    methods.handleAuth.__scope = "auth";
    methods.betterAuthUI.__scope = "auth";
    sdk["_moduleGroup"].set(methods, "Auth");
    return methods;
};
