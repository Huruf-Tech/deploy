import { compile } from "path-to-regexp";
export const tenantMembersModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        count(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("tenantMembers", "count");
                const method = "get";
                const toPath = compile("tenantMembers/api/count");
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
        get(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("tenantMembers", "get");
                const method = "get";
                const toPath = compile("tenantMembers/api{/:id}");
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
        update(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("tenantMembers", "update");
                const method = "patch";
                const toPath = compile("tenantMembers/api/:id");
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
        del(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("tenantMembers", "del");
                const method = "delete";
                const toPath = compile("tenantMembers/api/:id");
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
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("tenantMembers", "create");
                const method = "post";
                const toPath = compile("tenantMembers/api/");
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
    methods.count.__scope = "tenantMembers";
    methods.get.__scope = "tenantMembers";
    methods.update.__scope = "tenantMembers";
    methods.del.__scope = "tenantMembers";
    methods.create.__scope = "tenantMembers";
    sdk["_moduleGroup"].set(methods, "IAM");
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "tenant": { "tsType": "string" }, "user": { "tsType": "string" }, "email": { "type": "string" }, "role": { "type": "string" }, "isOwner": { "type": "boolean" }, "expiresAt": { "type": "string", "format": "date-time" }, "createdBy": { "tsType": "string" }, "createdAt": { "default": "2026-10-28T17:32:39.478Z", "type": "string", "format": "date-time" } }, "required": ["tenant", "user", "isOwner", "createdBy", "createdAt"], "additionalProperties": false }, "insertSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "invite": { "tsType": "string" } }, "required": ["invite"] }, "updateSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "role": { "type": "string" }, "expiresAt": { "type": "string", "format": "date-time" } } } } });
    return methods;
};
