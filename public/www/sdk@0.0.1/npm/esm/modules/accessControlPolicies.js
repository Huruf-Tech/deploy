import { compile } from "path-to-regexp";
export const accessControlPoliciesModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        myPolicies(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("accessControlPolicies", "myPolicies");
                const method = "get";
                const toPath = compile("accessControlPolicies/api/me");
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
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("accessControlPolicies", "create");
                const method = "post";
                const toPath = compile("accessControlPolicies/api/");
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
        count(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("accessControlPolicies", "count");
                const method = "get";
                const toPath = compile("accessControlPolicies/api/count");
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
        get(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("accessControlPolicies", "get");
                const method = "get";
                const toPath = compile("accessControlPolicies/api{/:id}");
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
        update(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("accessControlPolicies", "update");
                const method = "patch";
                const toPath = compile("accessControlPolicies/api/:id");
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
        del(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("accessControlPolicies", "del");
                const method = "delete";
                const toPath = compile("accessControlPolicies/api/:id");
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
    methods.myPolicies.__scope = "accessControlPolicies";
    methods.create.__scope = "accessControlPolicies";
    methods.count.__scope = "accessControlPolicies";
    methods.get.__scope = "accessControlPolicies";
    methods.update.__scope = "accessControlPolicies";
    methods.del.__scope = "accessControlPolicies";
    sdk["_moduleGroup"].set(methods, "IAM");
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "maxLength": 100, "description": "The name of the access control policy" }, "permissions": { "type": "array", "items": { "type": "string" }, "description": "The permissions associated with the access control policy" }, "createdAt": { "default": "2026-10-22T10:30:24.196Z", "type": "string", "format": "date-time" }, "updatedAt": { "default": "2026-10-22T10:30:24.196Z", "type": "string", "format": "date-time" } }, "required": ["name", "permissions", "createdAt", "updatedAt"], "additionalProperties": false }, "insertSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "maxLength": 100, "description": "The name of the access control policy" }, "permissions": { "type": "array", "items": { "type": "string" }, "description": "The permissions associated with the access control policy" } }, "required": ["name", "permissions"] } } });
    return methods;
};
