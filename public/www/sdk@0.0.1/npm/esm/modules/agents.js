import { compile } from "path-to-regexp";
export const agentsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        hello(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("agents", "hello");
                const method = "post";
                const toPath = compile("agents/api/hello");
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
        poll(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("agents", "poll");
                const method = "post";
                const toPath = compile("agents/api/poll");
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
        config(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("agents", "config");
                const method = "post";
                const toPath = compile("agents/api/config");
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
        events(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("agents", "events");
                const method = "post";
                const toPath = compile("agents/api/events");
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
    methods.hello.__scope = "agents";
    methods.poll.__scope = "agents";
    methods.config.__scope = "agents";
    methods.events.__scope = "agents";
    sdk["_moduleGroup"].set(methods, "Agents");
    return methods;
};
