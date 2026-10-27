"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMembersModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const tenantMembersModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        count(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("tenantMembers", "count");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("tenantMembers/api/count");
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
                const toPath = (0, path_to_regexp_1.compile)("tenantMembers/api{/:id}");
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
                const toPath = (0, path_to_regexp_1.compile)("tenantMembers/api/:id");
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
                const toPath = (0, path_to_regexp_1.compile)("tenantMembers/api/:id");
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
                const toPath = (0, path_to_regexp_1.compile)("tenantMembers/api/");
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
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "tenant": { "tsType": "string" }, "user": { "tsType": "string" }, "email": { "type": "string" }, "role": { "type": "string" }, "isOwner": { "type": "boolean" }, "expiresAt": { "type": "string", "format": "date-time" }, "createdBy": { "tsType": "string" }, "createdAt": { "default": "2026-10-27T11:49:10.922Z", "type": "string", "format": "date-time" } }, "required": ["tenant", "user", "isOwner", "createdBy", "createdAt"], "additionalProperties": false }, "insertSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "invite": { "tsType": "string" } }, "required": ["invite"] }, "updateSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "role": { "type": "string" }, "expiresAt": { "type": "string", "format": "date-time" } } } } });
    return methods;
};
exports.tenantMembersModule = tenantMembersModule;
