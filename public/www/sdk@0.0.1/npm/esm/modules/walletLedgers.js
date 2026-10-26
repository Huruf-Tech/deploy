import { compile } from "path-to-regexp";
export const walletLedgersModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        count(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("walletLedgers", "count");
                const method = "get";
                const toPath = compile("walletLedgers/api/count");
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
                sdk.checkPermission("walletLedgers", "get");
                const method = "get";
                const toPath = compile("walletLedgers/api{/:id}");
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
    methods.count.__scope = "walletLedgers";
    methods.get.__scope = "walletLedgers";
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "type": { "type": "string", "enum": ["credit", "debit"], "canFilter": true, "label": "Type" }, "description": { "anyOf": [{ "type": "string" }, { "type": "object", "propertyNames": { "type": "string" }, "additionalProperties": { "type": "string" } }] }, "purpose": { "type": "string" }, "foreignRefType": { "type": "string" }, "foreignRef": { "type": "string" }, "reference": { "type": "string", "canFilter": true, "label": "Reference" }, "isRefund": { "type": "boolean" }, "refundedReference": { "description": "Reference to the original transaction if this is a refund", "type": "string" }, "isRefunded": { "type": "boolean" }, "refundReference": { "description": "Reference to the refund transaction if this transaction has been refunded", "type": "string" }, "idempotencyKey": { "type": "string" }, "currency": { "type": "string", "minLength": 3 }, "amount": { "type": "integer", "minimum": -9007199254740991, "maximum": 9007199254740991, "canFilter": true, "label": "Amount" }, "previousBalance": { "type": "integer", "minimum": -9007199254740991, "maximum": 9007199254740991 }, "tenant": { "tsType": "string" }, "wallet": { "tsType": "string" }, "oppositeTenant": { "tsType": "string" }, "oppositeWallet": { "tsType": "string" }, "executorUser": { "tsType": "string" }, "tags": { "type": "array", "items": { "type": "string" } }, "metadata": { "type": "object", "propertyNames": { "type": "string" }, "additionalProperties": {} }, "createdAt": { "default": "2026-10-26T17:05:30.097Z", "canFilter": true, "label": "Created At", "type": "string", "format": "date-time" }, "updatedAt": { "default": "2026-10-26T17:05:30.097Z", "canFilter": true, "label": "Updated At", "type": "string", "format": "date-time" } }, "required": ["type", "reference", "idempotencyKey", "currency", "amount", "previousBalance", "tenant", "wallet", "oppositeTenant", "oppositeWallet", "createdAt", "updatedAt"], "additionalProperties": false } } });
    return methods;
};
