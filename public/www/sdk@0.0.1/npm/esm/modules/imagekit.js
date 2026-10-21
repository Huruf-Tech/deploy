import { compile } from "path-to-regexp";
export const imageKitModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        auth(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("imageKit", "auth");
                const method = "get";
                const toPath = compile("imagekit/api/auth");
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
    methods.auth.__scope = "imageKit";
    sdk["_moduleGroup"].set(methods, "Media");
    return methods;
};
