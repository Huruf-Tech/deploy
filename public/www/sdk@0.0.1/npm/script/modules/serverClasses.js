"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverClassesModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const serverClassesModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("serverClasses", "create");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("serverClasses/api/");
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
                sdk.checkPermission("serverClasses", "count");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("serverClasses/api/count");
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
                sdk.checkPermission("serverClasses", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("serverClasses/api{/:id}");
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
                sdk.checkPermission("serverClasses", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("serverClasses/api/:id");
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
                sdk.checkPermission("serverClasses", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("serverClasses/api/:id");
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
    methods.create.__scope = "serverClasses";
    methods.count.__scope = "serverClasses";
    methods.get.__scope = "serverClasses";
    methods.update.__scope = "serverClasses";
    methods.del.__scope = "serverClasses";
    sdk["_moduleGroup"].set(methods, "Admin");
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "minLength": 1, "maxLength": 50, "canFilter": true }, "description": { "type": "string", "maxLength": 300 }, "family": { "type": "string", "maxLength": 30 }, "rates": { "type": "object", "properties": { "vcpu": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "memGb": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "diskGb": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "trafficGb": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "fixed": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 } }, "required": ["vcpu", "memGb", "diskGb", "trafficGb", "fixed"], "additionalProperties": false }, "includedTrafficPerVcpu": { "default": 100, "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "cpuOvercommit": { "default": 1, "type": "number", "minimum": 1, "maximum": 8 }, "maxPerRental": { "default": { "vcpu": 4, "memMb": 8192, "diskGb": 160 }, "type": "object", "properties": { "vcpu": { "type": "number", "minimum": 0.5 }, "memMb": { "type": "integer", "minimum": 512, "maximum": 9007199254740991 }, "diskGb": { "type": "integer", "minimum": 5, "maximum": 9007199254740991 } }, "required": ["vcpu", "memMb", "diskGb"], "additionalProperties": false }, "active": { "default": true, "canFilter": true, "type": "boolean" }, "sortOrder": { "default": 0, "type": "integer", "minimum": -9007199254740991, "maximum": 9007199254740991 }, "createdAt": { "default": "2026-10-26T19:34:07.497Z", "type": "string", "format": "date-time" }, "updatedAt": { "default": "2026-10-26T19:34:07.497Z", "type": "string", "format": "date-time" } }, "required": ["name", "rates", "includedTrafficPerVcpu", "cpuOvercommit", "maxPerRental", "active", "sortOrder", "createdAt", "updatedAt"], "additionalProperties": false }, "insertSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "minLength": 1, "maxLength": 50, "canFilter": true }, "description": { "type": "string", "maxLength": 300 }, "family": { "type": "string", "maxLength": 30 }, "rates": { "type": "object", "properties": { "vcpu": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "memGb": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "diskGb": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "trafficGb": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "fixed": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 } }, "required": ["vcpu", "memGb", "diskGb", "trafficGb", "fixed"] }, "includedTrafficPerVcpu": { "default": 100, "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "cpuOvercommit": { "default": 1, "type": "number", "minimum": 1, "maximum": 8 }, "maxPerRental": { "default": { "vcpu": 4, "memMb": 8192, "diskGb": 160 }, "type": "object", "properties": { "vcpu": { "type": "number", "minimum": 0.5 }, "memMb": { "type": "integer", "minimum": 512, "maximum": 9007199254740991 }, "diskGb": { "type": "integer", "minimum": 5, "maximum": 9007199254740991 } }, "required": ["vcpu", "memMb", "diskGb"] }, "active": { "default": true, "canFilter": true, "type": "boolean" }, "sortOrder": { "default": 0, "type": "integer", "minimum": -9007199254740991, "maximum": 9007199254740991 } }, "required": ["name", "rates"] }, "updateSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "minLength": 1, "maxLength": 50, "canFilter": true }, "description": { "type": "string", "maxLength": 300 }, "family": { "type": "string", "maxLength": 30 }, "rates": { "type": "object", "properties": { "vcpu": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "memGb": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "diskGb": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "trafficGb": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "fixed": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 } }, "required": ["vcpu", "memGb", "diskGb", "trafficGb", "fixed"] }, "includedTrafficPerVcpu": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "cpuOvercommit": { "type": "number", "minimum": 1, "maximum": 8 }, "maxPerRental": { "type": "object", "properties": { "vcpu": { "type": "number", "minimum": 0.5 }, "memMb": { "type": "integer", "minimum": 512, "maximum": 9007199254740991 }, "diskGb": { "type": "integer", "minimum": 5, "maximum": 9007199254740991 } }, "required": ["vcpu", "memMb", "diskGb"] }, "active": { "type": "boolean" }, "sortOrder": { "type": "integer", "minimum": -9007199254740991, "maximum": 9007199254740991 } } } } });
    return methods;
};
exports.serverClassesModule = serverClassesModule;
