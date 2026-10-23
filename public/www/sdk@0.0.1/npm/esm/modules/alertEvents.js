import { compile } from "path-to-regexp";
export const alertEventsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        list(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("alertEvents", "list");
                const method = "get";
                const toPath = compile("alertEvents/api/");
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
    methods.list.__scope = "alertEvents";
    sdk["_moduleGroup"].set(methods, "Monitoring");
    return methods;
};
