"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsModule = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const projectsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        list(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("projects", "list");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/");
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
        create(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("projects", "create");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/");
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
        placementInfo(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("projects", "placementInfo");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/placement");
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
                sdk.checkPermission("projects", "get");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/:id");
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
                sdk.checkPermission("projects", "update");
                const method = "patch";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/:id");
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
                sdk.checkPermission("projects", "del");
                const method = "delete";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/:id");
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
        deployProject(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("projects", "deployProject");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/:id/deploy");
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
        rollbackProject(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("projects", "rollbackProject");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/:id/rollback");
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
        clearCache(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("projects", "clearCache");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/:id/clearCache");
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
        releases(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("projects", "releases");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/:id/releases");
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
        deployments(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("projects", "deployments");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/:id/deployments");
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
        deployment(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("projects", "deployment");
                const method = "get";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/deployments/:deployment");
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
        cancelDeployment(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("projects", "cancelDeployment");
                const method = "post";
                const toPath = (0, path_to_regexp_1.compile)("projects/api/deployments/:deployment/cancel");
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
    methods.list.__scope = "projects";
    methods.create.__scope = "projects";
    methods.placementInfo.__scope = "projects";
    methods.get.__scope = "projects";
    methods.update.__scope = "projects";
    methods.del.__scope = "projects";
    methods.deployProject.__scope = "projects";
    methods.rollbackProject.__scope = "projects";
    methods.clearCache.__scope = "projects";
    methods.releases.__scope = "projects";
    methods.deployments.__scope = "projects";
    methods.deployment.__scope = "projects";
    methods.cancelDeployment.__scope = "projects";
    sdk["_moduleGroup"].set(methods, "Applications");
    return methods;
};
exports.projectsModule = projectsModule;
