import { compile } from "path-to-regexp";
export const ingressModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        acmeChallenge(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("ingress", "acmeChallenge");
                const method = "get";
                const toPath = compile("ingress/api/acme-challenge/:token");
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
        traefik(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("ingress", "traefik");
                const method = "get";
                const toPath = compile("ingress/api/traefik");
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
        frp(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("ingress", "frp");
                const method = "post";
                const toPath = compile("ingress/api/frp");
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
    methods.acmeChallenge.__scope = "ingress";
    methods.traefik.__scope = "ingress";
    methods.frp.__scope = "ingress";
    sdk["_moduleGroup"].set(methods, "Ingress");
    return methods;
};
