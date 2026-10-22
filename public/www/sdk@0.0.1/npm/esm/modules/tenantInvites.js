import { compile } from "path-to-regexp";
export const tenantInvitesModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("tenantInvites", "create");
                const method = "post";
                const toPath = compile("tenantInvites/api/");
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
                sdk.checkPermission("tenantInvites", "count");
                const method = "get";
                const toPath = compile("tenantInvites/api/count");
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
                sdk.checkPermission("tenantInvites", "get");
                const method = "get";
                const toPath = compile("tenantInvites/api{/:id}");
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
                sdk.checkPermission("tenantInvites", "update");
                const method = "patch";
                const toPath = compile("tenantInvites/api/:id");
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
                sdk.checkPermission("tenantInvites", "del");
                const method = "delete";
                const toPath = compile("tenantInvites/api/:id");
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
    methods.create.__scope = "tenantInvites";
    methods.count.__scope = "tenantInvites";
    methods.get.__scope = "tenantInvites";
    methods.update.__scope = "tenantInvites";
    methods.del.__scope = "tenantInvites";
    sdk["_moduleGroup"].set(methods, "IAM");
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "email": { "type": "string", "format": "email", "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$" }, "role": { "type": "string" }, "url": { "type": "string", "format": "uri" }, "membershipExpiresAt": { "type": "string", "format": "date-time" }, "tenant": { "tsType": "string" }, "createdBy": { "tsType": "string" }, "createdAt": { "default": "2026-10-22T12:45:53.697Z", "type": "string", "format": "date-time" } }, "required": ["email", "role", "url", "tenant", "createdBy", "createdAt"], "additionalProperties": false }, "insertSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "email": { "type": "string", "format": "email", "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$" }, "role": { "type": "string" }, "url": { "type": "string", "format": "uri" }, "membershipExpiresAt": { "type": "string", "format": "date-time" } }, "required": ["email", "role", "url"] } } });
    return methods;
};
