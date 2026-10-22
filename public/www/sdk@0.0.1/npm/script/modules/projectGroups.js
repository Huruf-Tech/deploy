"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectGroupsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const projectGroupsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("projectGroups", "create");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("projectGroups/api/");
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
                sdk.checkPermission("projectGroups", "count");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("projectGroups/api/count");
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
                sdk.checkPermission("projectGroups", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("projectGroups/api{/:id}");
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
                sdk.checkPermission("projectGroups", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("projectGroups/api/:id");
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
                sdk.checkPermission("projectGroups", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("projectGroups/api/:id");
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
    methods.create.__scope = "projectGroups";
    methods.count.__scope = "projectGroups";
    methods.get.__scope = "projectGroups";
    methods.update.__scope = "projectGroups";
    methods.del.__scope = "projectGroups";
    sdk["_moduleGroup"].set(methods, "Applications");
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "tenant": { "tsType": "string", "ref": "tenants" }, "name": { "type": "string", "minLength": 1, "maxLength": 80, "canFilter": true }, "description": { "type": "string", "maxLength": 500 } }, "required": ["tenant", "name"], "additionalProperties": false }, "insertSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "minLength": 1, "maxLength": 80, "canFilter": true }, "description": { "type": "string", "maxLength": 500 } }, "required": ["name"] } } });
    return methods;
};
exports.projectGroupsModule = projectGroupsModule;
