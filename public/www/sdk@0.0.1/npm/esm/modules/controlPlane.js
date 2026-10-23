import { compile } from "path-to-regexp";
export const controlPlaneModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        overview(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("controlPlane", "overview");
                const method = "get";
                const toPath = compile("controlPlane/api/overview");
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
    methods.overview.__scope = "controlPlane";
    sdk["_moduleGroup"].set(methods, "Admin");
    return methods;
};
