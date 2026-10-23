"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const usersModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("users", "create");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("users/api/");
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
                sdk.checkPermission("users", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("users/api/:id");
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
        ban(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("users", "ban");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("users/api/ban/:id");
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
        addFcmToken(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("users", "addFcmToken");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("users/api/add/fcm-token");
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
        getUserTenants(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("users", "getUserTenants");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("users/api/:id/tenants");
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
                sdk.checkPermission("users", "count");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("users/api/count");
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
                sdk.checkPermission("users", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("users/api{/:id}");
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
    methods.create.__scope = "users";
    methods.update.__scope = "users";
    methods.ban.__scope = "users";
    methods.addFcmToken.__scope = "users";
    methods.getUserTenants.__scope = "users";
    methods.count.__scope = "users";
    methods.get.__scope = "users";
    sdk["_moduleGroup"].set(methods, "Admin");
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "canFilter": true, "label": "Name" }, "image": { "type": "string", "format": "uri" }, "email": { "type": "string", "format": "email", "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$", "canFilter": true, "label": "Email" }, "fcmTokens": { "type": "array", "items": { "type": "string" } }, "emailVerified": { "type": "boolean", "canFilter": true, "label": "Email Verified" }, "phoneNumber": { "canFilter": true, "label": "Phone Number", "type": "string", "format": "e164", "pattern": "^\\+[1-9]\\d{6,14}$" }, "phoneNumberVerified": { "type": "boolean" }, "phoneNumberVerificationCode": { "type": "string" }, "phoneNumberVerificationRequestAt": { "type": "string", "format": "date-time" }, "role": { "type": "string", "canFilter": true, "label": "Role" }, "createdAt": { "canFilter": true, "label": "Created At", "type": "string", "format": "date-time" }, "updatedAt": { "type": "string", "format": "date-time" } }, "required": ["name", "email", "emailVerified", "role", "createdAt", "updatedAt"], "additionalProperties": false }, "insertSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "email": { "type": "string", "format": "email", "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$" }, "password": { "type": "string" }, "name": { "type": "string" }, "role": { "type": "string" }, "metadata": { "type": "object", "propertyNames": { "type": "string" }, "additionalProperties": {} } }, "required": ["email", "name"] } } });
    return methods;
};
exports.usersModule = usersModule;
