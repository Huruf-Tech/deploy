"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletTopupsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const walletTopupsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        webhook(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("walletTopups", "webhook");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("walletTopups/api/webhook");
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
                sdk.checkPermission("walletTopups", "count");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("walletTopups/api/count");
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
                sdk.checkPermission("walletTopups", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("walletTopups/api{/:id}");
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
    methods.webhook.__scope = "walletTopups";
    methods.count.__scope = "walletTopups";
    methods.get.__scope = "walletTopups";
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "status": { "type": "string", "enum": ["initiated", "pending", "paid", "processing", "completed", "failed"], "canFilter": true, "label": "Status" }, "tenant": { "tsType": "string" }, "currency": { "type": "string", "minLength": 3 }, "amount": { "type": "integer", "minimum": -9007199254740991, "maximum": 9007199254740991, "canFilter": true, "label": "Amount" }, "provider": { "canFilter": true, "label": "Provider", "type": "string" }, "providerRef": { "canFilter": true, "label": "Provider Ref", "type": "string" }, "idempotencyKey": { "type": "string" }, "transfer": { "type": "object", "properties": { "fromTenant": { "tsType": "string" }, "toTenant": { "tsType": "string" }, "currency": { "type": "string", "minLength": 3 }, "amount": { "type": "integer", "minimum": -9007199254740991, "maximum": 9007199254740991 }, "reference": { "type": "string" }, "idempotencyKey": { "type": "string" }, "user": { "tsType": "string" }, "purpose": { "type": "string" }, "description": { "anyOf": [{ "type": "string" }, { "type": "object", "propertyNames": { "type": "string" }, "additionalProperties": { "type": "string" } }] }, "foreignRefType": { "type": "string" }, "foreignRef": { "type": "string" }, "tags": { "type": "array", "items": { "type": "string" } }, "metadata": { "type": "object", "propertyNames": { "type": "string" }, "additionalProperties": { "type": ["string", "number", "boolean"] } }, "allowOverdraft": { "type": "boolean" }, "overdraftLimit": { "type": "integer", "minimum": -9007199254740991, "maximum": 9007199254740991 } }, "required": ["fromTenant", "toTenant", "currency", "amount", "reference", "idempotencyKey"], "additionalProperties": false }, "topupReference": { "type": "string" }, "resumedReference": { "type": "string" }, "error": { "type": "string" }, "createdAt": { "default": "2026-10-28T17:27:47.668Z", "canFilter": true, "label": "Created At", "type": "string", "format": "date-time" }, "updatedAt": { "default": "2026-10-28T17:27:47.668Z", "type": "string", "format": "date-time" } }, "required": ["status", "tenant", "currency", "amount", "createdAt", "updatedAt"], "additionalProperties": false } } });
    return methods;
};
exports.walletTopupsModule = walletTopupsModule;
