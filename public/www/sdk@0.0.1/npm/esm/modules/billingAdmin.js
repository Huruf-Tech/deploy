import { compile } from "path-to-regexp";
export const billingAdminModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        subscriptions(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("billingAdmin", "subscriptions");
                const method = "get";
                const toPath = compile("billingAdmin/api/subscriptions");
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
        grant(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("billingAdmin", "grant");
                const method = "post";
                const toPath = compile("billingAdmin/api/grant");
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
    methods.subscriptions.__scope = "billingAdmin";
    methods.grant.__scope = "billingAdmin";
    sdk["_moduleGroup"].set(methods, "Admin");
    return methods;
};
