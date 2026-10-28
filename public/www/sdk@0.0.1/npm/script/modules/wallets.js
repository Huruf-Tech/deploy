"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const walletsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        metadata(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("wallets", "metadata");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("wallets/api/metadata");
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
        signTransfer(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("wallets", "signTransfer");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("wallets/api/transfer/sign");
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
        transfer(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("wallets", "transfer");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("wallets/api/transfer");
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
        addBalance(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("wallets", "addBalance");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("wallets/api/add-balance");
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
        updateOverdraftLimit(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("wallets", "updateOverdraftLimit");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("wallets/api/update/overdraft-limit");
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
        getOverdraftLimit(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("wallets", "getOverdraftLimit");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("wallets/api/overdraft-limit");
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
                sdk.checkPermission("wallets", "count");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("wallets/api/count");
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
                sdk.checkPermission("wallets", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("wallets/api{/:id}");
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
    methods.metadata.__scope = "wallets";
    methods.signTransfer.__scope = "wallets";
    methods.transfer.__scope = "wallets";
    methods.addBalance.__scope = "wallets";
    methods.updateOverdraftLimit.__scope = "wallets";
    methods.getOverdraftLimit.__scope = "wallets";
    methods.count.__scope = "wallets";
    methods.get.__scope = "wallets";
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "currency": { "type": "string", "minLength": 3 }, "balance": { "default": 0, "type": "integer", "minimum": -9007199254740991, "maximum": 9007199254740991 }, "overdraftLimit": { "default": 0, "type": "integer", "minimum": -9007199254740991, "maximum": 9007199254740991 }, "previousBalance": { "default": 0, "type": "integer", "minimum": -9007199254740991, "maximum": 9007199254740991 }, "lastRef": { "type": "string" }, "user": { "tsType": "string" }, "tenant": { "tsType": "string" }, "negativeAt": { "anyOf": [{ "type": "string", "format": "date-time" }, { "type": "null" }] }, "createdAt": { "default": "2026-10-28T17:27:47.675Z", "type": "string", "format": "date-time" }, "updatedAt": { "default": "2026-10-28T17:27:47.675Z", "type": "string", "format": "date-time" } }, "required": ["currency", "balance", "overdraftLimit", "previousBalance", "user", "tenant", "createdAt", "updatedAt"], "additionalProperties": false } } });
    return methods;
};
exports.walletsModule = walletsModule;
