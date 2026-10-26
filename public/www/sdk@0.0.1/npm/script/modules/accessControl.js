"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessControlModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const accessControlModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("accessControl", "create");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("accessControl/api/");
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
        count(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("accessControl", "count");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("accessControl/api/count");
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
                sdk.checkPermission("accessControl", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("accessControl/api{/:id}");
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
                sdk.checkPermission("accessControl", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("accessControl/api/:id");
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
                sdk.checkPermission("accessControl", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("accessControl/api/:id");
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
    methods.create.__scope = "accessControl";
    methods.count.__scope = "accessControl";
    methods.get.__scope = "accessControl";
    methods.update.__scope = "accessControl";
    methods.del.__scope = "accessControl";
    sdk["_moduleGroup"].set(methods, "IAM");
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "role": { "type": "string", "maxLength": 100, "description": "The name of the role" }, "skipIntersection": { "type": "boolean" }, "policies": { "type": "array", "items": { "tsType": "string", "ref": "accessControlPolicies" }, "description": "The policies associated with the role" }, "subRoles": { "type": "array", "items": { "type": "string", "maxLength": 100 } }, "createdAt": { "default": "2026-10-26T11:04:22.988Z", "type": "string", "format": "date-time" }, "updatedAt": { "default": "2026-10-26T11:04:22.988Z", "type": "string", "format": "date-time" } }, "required": ["role", "policies", "createdAt", "updatedAt"], "additionalProperties": false }, "insertSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "role": { "type": "string", "maxLength": 100, "description": "The name of the role" }, "skipIntersection": { "type": "boolean" }, "policies": { "type": "array", "items": { "tsType": "string", "ref": "accessControlPolicies" }, "description": "The policies associated with the role" }, "subRoles": { "type": "array", "items": { "type": "string", "maxLength": 100 } } }, "required": ["role", "policies"] } } });
    return methods;
};
exports.accessControlModule = accessControlModule;
