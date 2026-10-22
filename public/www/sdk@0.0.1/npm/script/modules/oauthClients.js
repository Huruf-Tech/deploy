"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthClientsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const oauthClientsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("oauthClients", "create");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("oauthClients/api/");
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
                sdk.checkPermission("oauthClients", "count");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("oauthClients/api/count");
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
                sdk.checkPermission("oauthClients", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("oauthClients/api{/:id}");
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
                sdk.checkPermission("oauthClients", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("oauthClients/api/:id");
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
                sdk.checkPermission("oauthClients", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("oauthClients/api/:id");
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
    methods.create.__scope = "oauthClients";
    methods.count.__scope = "oauthClients";
    methods.get.__scope = "oauthClients";
    methods.update.__scope = "oauthClients";
    methods.del.__scope = "oauthClients";
    sdk["_moduleGroup"].set(methods, "OAuth");
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "minLength": 1, "maxLength": 100 }, "description": { "type": "string", "maxLength": 300 }, "logo": { "type": "string", "format": "uri" }, "type": { "type": "string", "enum": ["confidential", "public"] }, "secret": { "type": "hidden" }, "allowedScopes": { "default": [], "type": "array", "items": { "type": "string", "minLength": 1, "maxLength": 255 } }, "redirectUris": { "default": [], "type": "array", "items": { "type": "string", "format": "uri" } }, "disabled": { "type": "boolean" }, "createdBy": { "tsType": "string" }, "createdAt": { "default": "2026-10-22T12:45:53.690Z", "type": "string", "format": "date-time" }, "updatedAt": { "default": "2026-10-22T12:45:53.690Z", "type": "string", "format": "date-time" } }, "required": ["name", "type", "allowedScopes", "redirectUris", "createdBy", "createdAt", "updatedAt"], "additionalProperties": false }, "insertSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "minLength": 1, "maxLength": 100 }, "description": { "type": "string", "maxLength": 300 }, "logo": { "type": "string", "format": "uri" }, "type": { "type": "string", "enum": ["confidential", "public"] }, "secret": { "type": "hidden" }, "allowedScopes": { "default": [], "type": "array", "items": { "type": "string", "minLength": 1, "maxLength": 255 } }, "redirectUris": { "default": [], "type": "array", "items": { "type": "string", "format": "uri" } }, "disabled": { "type": "boolean" } }, "required": ["name", "type"] } } });
    return methods;
};
exports.oauthClientsModule = oauthClientsModule;
