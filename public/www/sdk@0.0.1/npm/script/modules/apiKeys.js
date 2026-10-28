"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeysModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const apiKeysModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("apiKeys", "create");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("apiKeys/api/");
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
                sdk.checkPermission("apiKeys", "count");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("apiKeys/api/count");
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
                sdk.checkPermission("apiKeys", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("apiKeys/api{/:id}");
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
                sdk.checkPermission("apiKeys", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("apiKeys/api/:id");
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
                sdk.checkPermission("apiKeys", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("apiKeys/api/:id");
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
    methods.create.__scope = "apiKeys";
    methods.count.__scope = "apiKeys";
    methods.get.__scope = "apiKeys";
    methods.update.__scope = "apiKeys";
    methods.del.__scope = "apiKeys";
    sdk["_moduleGroup"].set(methods, "Developer");
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "minLength": 2, "maxLength": 100 }, "resourceGrant": { "type": "object", "propertyNames": { "type": "string" }, "additionalProperties": { "type": "array", "items": { "type": "string" } } }, "secret": {}, "scopes": { "type": "array", "items": { "type": "string", "maxLength": 100 } }, "expiresAt": { "type": "string", "format": "date-time" }, "lastAccessAt": { "type": "string", "format": "date-time" }, "accessCount": { "default": 0, "type": "number" }, "createdBy": { "tsType": "string" }, "createdAt": { "default": "2026-10-28T17:32:39.412Z", "type": "string", "format": "date-time" }, "updatedAt": { "default": "2026-10-28T17:32:39.413Z", "type": "string", "format": "date-time" } }, "required": ["name", "resourceGrant", "secret", "accessCount", "createdBy", "createdAt", "updatedAt"], "additionalProperties": false }, "insertSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "minLength": 2, "maxLength": 100 }, "resourceGrant": { "type": "object", "propertyNames": { "type": "string" }, "additionalProperties": { "type": "array", "items": { "type": "string" } } }, "secret": { "type": "string", "minLength": 8, "maxLength": 100 }, "scopes": { "type": "array", "items": { "type": "string", "maxLength": 100 } }, "expiresAt": { "type": "string", "format": "date-time" } }, "required": ["name", "resourceGrant", "secret"] } } });
    return methods;
};
exports.apiKeysModule = apiKeysModule;
