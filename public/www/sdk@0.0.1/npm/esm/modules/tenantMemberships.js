import { compile } from "path-to-regexp";
export const tenantMembershipsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        get(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("tenantMemberships", "get");
                const method = "get";
                const toPath = compile("tenantMemberships/api/");
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
    methods.get.__scope = "tenantMemberships";
    return methods;
};
