import { compile } from "path-to-regexp";
export const githubHooksModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        manifest(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("githubHooks", "manifest");
                const method = "get";
                const toPath = compile("githubHooks/api/manifest");
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
        setup(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("githubHooks", "setup");
                const method = "get";
                const toPath = compile("githubHooks/api/setup");
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
        webhook(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("githubHooks", "webhook");
                const method = "post";
                const toPath = compile("githubHooks/api/webhook/:id");
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
    methods.manifest.__scope = "githubHooks";
    methods.setup.__scope = "githubHooks";
    methods.webhook.__scope = "githubHooks";
    return methods;
};
