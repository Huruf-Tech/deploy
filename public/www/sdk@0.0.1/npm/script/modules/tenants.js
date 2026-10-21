"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const tenantsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        count(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("tenants", "count");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("tenants/api/count");
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
                sdk.checkPermission("tenants", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("tenants/api{/:id}");
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
                sdk.checkPermission("tenants", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("tenants/api/:id");
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
                sdk.checkPermission("tenants", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("tenants/api/:id");
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
                sdk.checkPermission("tenants", "create");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("tenants/api/");
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
    methods.count.__scope = "tenants";
    methods.get.__scope = "tenants";
    methods.update.__scope = "tenants";
    methods.del.__scope = "tenants";
    methods.create.__scope = "tenants";
    sdk["_moduleGroup"].set(methods, "IAM");
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string" }, "logo": { "type": "string", "format": "uri" }, "createdBy": { "tsType": "string" }, "createdAt": { "default": "2026-10-21T15:50:05.367Z", "type": "string", "format": "date-time" } }, "required": ["name", "createdBy", "createdAt"], "additionalProperties": false }, "insertSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string" }, "logo": { "type": "string", "format": "uri" } }, "required": ["name"] } } });
    return methods;
};
exports.tenantsModule = tenantsModule;
