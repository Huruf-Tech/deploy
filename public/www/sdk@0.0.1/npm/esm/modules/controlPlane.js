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
        rules(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("controlPlane", "rules");
                const method = "get";
                const toPath = compile("controlPlane/api/rules");
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
        createRuleHandler(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("controlPlane", "createRuleHandler");
                const method = "post";
                const toPath = compile("controlPlane/api/rules");
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
        updateRuleHandler(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("controlPlane", "updateRuleHandler");
                const method = "patch";
                const toPath = compile("controlPlane/api/rules/:id");
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
        deleteRuleHandler(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("controlPlane", "deleteRuleHandler");
                const method = "delete";
                const toPath = compile("controlPlane/api/rules/:id");
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
        alerts(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("controlPlane", "alerts");
                const method = "get";
                const toPath = compile("controlPlane/api/alerts");
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
    methods.rules.__scope = "controlPlane";
    methods.createRuleHandler.__scope = "controlPlane";
    methods.updateRuleHandler.__scope = "controlPlane";
    methods.deleteRuleHandler.__scope = "controlPlane";
    methods.alerts.__scope = "controlPlane";
    sdk["_moduleGroup"].set(methods, "Admin");
    return methods;
};
