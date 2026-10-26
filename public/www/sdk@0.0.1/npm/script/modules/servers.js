"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serversModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const serversModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        count(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "count");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/count");
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
                sdk.checkPermission("servers", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("servers/api{/:id}");
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
                sdk.checkPermission("servers", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id");
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
                sdk.checkPermission("servers", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id");
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
        createPartition(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "createPartition");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id/partitions");
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
        resizePartition(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "resizePartition");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id/partitions/:name");
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
        removePartition(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "removePartition");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id/partitions/:name");
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
        agentRelease(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "agentRelease");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/agent/latest");
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
        updateAgent(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "updateAgent");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id/updateAgent");
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
        accept(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "accept");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id/accept");
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
        reject(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "reject");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id/reject");
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
        prepare(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "prepare");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id/prepare");
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
        ping(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "ping");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id/ping");
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
        cleanup(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "cleanup");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id/cleanup");
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
        command(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "command");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/:id/commands/:command");
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
        bootstrap(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "bootstrap");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/bootstrap");
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
        bootstrapProgress(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "bootstrapProgress");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/bootstrap/:id");
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
        installCommand(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "installCommand");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/install/command");
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
        liveness(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("servers", "liveness");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("servers/api/live/status");
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
    methods.count.__scope = "servers";
    methods.get.__scope = "servers";
    methods.update.__scope = "servers";
    methods.del.__scope = "servers";
    methods.createPartition.__scope = "servers";
    methods.resizePartition.__scope = "servers";
    methods.removePartition.__scope = "servers";
    methods.agentRelease.__scope = "servers";
    methods.updateAgent.__scope = "servers";
    methods.accept.__scope = "servers";
    methods.reject.__scope = "servers";
    methods.prepare.__scope = "servers";
    methods.ping.__scope = "servers";
    methods.cleanup.__scope = "servers";
    methods.command.__scope = "servers";
    methods.bootstrap.__scope = "servers";
    methods.bootstrapProgress.__scope = "servers";
    methods.installCommand.__scope = "servers";
    methods.liveness.__scope = "servers";
    sdk["_moduleGroup"].set(methods, "Infrastructure");
    sdk["_moduleMetadata"].set(methods, { "crud": { "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "minLength": 1, "maxLength": 60, "canFilter": true }, "labels": { "default": {}, "description": "Free-form key/value tags, e.g. region=eu, builder=true", "type": "object", "propertyNames": { "type": "string", "maxLength": 40 }, "additionalProperties": { "type": "string", "maxLength": 80 } }, "tenant": { "tsType": "string", "ref": "tenants" }, "status": { "type": "string", "enum": ["pending", "active", "rejected"], "canFilter": true }, "identity": { "type": "object", "properties": { "signPublicKey": { "type": "string" }, "boxPublicKey": { "type": "string" }, "fingerprint": { "type": "string" } }, "required": ["signPublicKey", "boxPublicKey", "fingerprint"], "additionalProperties": false }, "pairingCode": { "type": "string" }, "pairingExpiresAt": { "type": "string", "format": "date-time" }, "installMethod": { "default": "manual", "canFilter": true, "type": "string", "enum": ["manual", "ssh"] }, "provider": { "default": { "kind": "machine" }, "type": "object", "properties": { "kind": { "type": "string", "enum": ["machine", "partition", "rented", "byo"] }, "host": { "tsType": "string", "ref": "servers", "canFilter": true }, "partition": { "type": "string" }, "meshPort": { "type": "integer", "minimum": 1, "maximum": 65535 }, "subscription": { "tsType": "string" } }, "required": ["kind"], "additionalProperties": false }, "inventory": { "type": "object", "properties": { "hostname": { "type": "string", "maxLength": 255, "canFilter": true }, "os": { "type": "string", "maxLength": 100, "canFilter": true }, "arch": { "type": "string", "enum": ["amd64", "arm64"], "canFilter": true }, "cpuCores": { "type": "number", "minimum": 0.1 }, "memory": { "type": "integer", "minimum": 0, "maximum": 9007199254740991, "description": "Bytes" }, "disk": { "type": "integer", "minimum": 0, "maximum": 9007199254740991, "description": "Bytes" }, "publicIp": { "canFilter": true, "type": "string", "maxLength": 64 }, "privateIp": { "type": "string", "maxLength": 64 }, "dockerVersion": { "type": "string", "maxLength": 50 }, "agentVersion": { "type": "string", "maxLength": 50, "canFilter": true }, "agentSha256": { "description": "SHA-256 of the running agent binary: compared with the published one for updates", "type": "string", "maxLength": 64 } }, "required": ["hostname", "os", "arch", "cpuCores", "memory", "disk", "agentVersion"], "additionalProperties": false }, "resources": { "type": "object", "properties": { "cpu": { "type": "number", "minimum": 0, "maximum": 1, "description": "Used fraction" }, "memFree": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "diskFree": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "partitions": { "description": "Pool machines only (PLAN §26)", "maxItems": 200, "type": "array", "items": { "type": "object", "properties": { "name": { "type": "string", "pattern": "^[a-z0-9]{1,12}$" }, "remainder": { "type": "boolean" }, "state": { "type": "string", "description": "Docker state: running, exited…" }, "size": { "type": "object", "properties": { "cpus": { "type": "number", "minimum": 0, "maximum": 512 }, "memMb": { "type": "integer", "minimum": 256, "maximum": 9007199254740991 }, "diskGb": { "type": "integer", "minimum": 5, "maximum": 9007199254740991 } }, "required": ["cpus", "memMb", "diskGb"], "additionalProperties": false }, "cpuMicros": { "type": "integer", "minimum": 0, "maximum": 9007199254740991, "description": "CPU time used since it started" }, "memUsed": { "type": "integer", "minimum": 0, "maximum": 9007199254740991, "description": "Bytes it can't give back" }, "diskUsed": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 }, "rxBytes": { "type": "integer", "minimum": 0, "maximum": 9007199254740991, "description": "Traffic in since it was created" }, "txBytes": { "type": "integer", "minimum": 0, "maximum": 9007199254740991, "description": "Traffic out since it was created" } }, "required": ["name", "remainder", "state", "size", "cpuMicros", "memUsed", "diskUsed", "rxBytes", "txBytes"], "additionalProperties": false } }, "reportedAt": { "type": "string", "format": "date-time" } }, "required": ["cpu", "memFree", "diskFree", "reportedAt"], "additionalProperties": false }, "setup": { "type": "object", "properties": { "status": { "type": "string", "enum": ["pending", "ready", "failed"] }, "dockerVersion": { "type": "string" }, "checks": { "type": "array", "items": { "type": "object", "properties": { "name": { "type": "string" }, "ok": { "type": "boolean" }, "detail": { "type": "string" } }, "required": ["name", "ok", "detail"], "additionalProperties": false } }, "notes": { "type": "array", "items": { "type": "string" } }, "error": { "type": "string" }, "updatedAt": { "type": "string", "format": "date-time" } }, "required": ["status", "updatedAt"], "additionalProperties": false }, "mesh": { "type": "object", "properties": { "index": { "type": "integer", "minimum": 1, "maximum": 9007199254740991 }, "enabled": { "default": true, "type": "boolean" }, "publicKey": { "type": "string" }, "endpoint": { "type": "string" }, "peers": { "type": "object", "propertyNames": { "type": "string" }, "additionalProperties": { "type": "boolean" } }, "error": { "type": "string" }, "reportedAt": { "type": "string", "format": "date-time" } }, "required": ["index", "enabled"], "additionalProperties": false }, "pool": { "type": "object", "properties": { "status": { "type": "string", "enum": ["pending", "ready", "failed"] }, "mode": { "type": "string", "enum": ["machine", "pool"] }, "allocatable": { "type": "object", "properties": { "cpus": { "type": "number", "minimum": 0, "maximum": 512 }, "memMb": { "type": "integer", "minimum": 256, "maximum": 9007199254740991 }, "diskGb": { "type": "integer", "minimum": 5, "maximum": 9007199254740991 } }, "required": ["cpus", "memMb", "diskGb"], "additionalProperties": false }, "sysbox": { "type": "string" }, "notes": { "type": "array", "items": { "type": "string" } }, "error": { "type": "string" }, "updatedAt": { "type": "string", "format": "date-time" }, "class": { "tsType": "string", "ref": "serverClasses" }, "accepting": { "type": "boolean" }, "monthlyCost": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 } }, "required": ["status", "updatedAt"], "additionalProperties": false }, "tunnelPort": { "type": "integer", "minimum": 1, "maximum": 65535 }, "acceptedBy": { "tsType": "string", "ref": "users" }, "acceptedAt": { "type": "string", "format": "date-time" }, "createdAt": { "canFilter": true, "type": "string", "format": "date-time" } }, "required": ["name", "labels", "tenant", "status", "identity", "installMethod", "provider", "inventory", "createdAt"], "additionalProperties": false }, "updateSchema": { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object", "properties": { "name": { "type": "string", "minLength": 1, "maxLength": 60, "canFilter": true }, "labels": { "default": {}, "description": "Free-form key/value tags, e.g. region=eu, builder=true", "type": "object", "propertyNames": { "type": "string", "maxLength": 40 }, "additionalProperties": { "type": "string", "maxLength": 80 } } }, "required": ["name"] } } });
    return methods;
};
exports.serversModule = serversModule;
