"use strict";
/**
 * This SDK plugin is used within SDK generation process
 * You cannot import any files from thunder or any of its sources here cause it will not work.
 * Your code should be isolated in the this/current folder.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.essentialsEntry = void 0;
const index_js_1 = require("../../index.js");
class essentialsEntry {
    static setTenant(tenant) {
        this.tenant = index_js_1.ThunderSDK["_cacheNamespaces"].tenant = tenant;
        index_js_1.ThunderSDK.log("Setting tenant:", this.tenant);
        if (!this.tenantInterceptorId && this.tenant) {
            this.tenantInterceptorId = index_js_1.ThunderSDK._axios?.interceptors.request.use((config) => {
                if (this.tenant) {
                    config.headers["x-tenant-id"] = this.tenant;
                }
                index_js_1.ThunderSDK.log("Tenant interceptor:", this.tenant);
                return config;
            });
        }
    }
    static getTenant() {
        return this.tenant;
    }
    static removeTenant() {
        index_js_1.ThunderSDK["_cacheNamespaces"].tenant = null;
        delete this.tenant;
        index_js_1.ThunderSDK.log("Tenant removed");
        if (this.tenantInterceptorId && !this.tenant) {
            index_js_1.ThunderSDK._axios?.interceptors.response.eject(this.tenantInterceptorId);
        }
    }
    static registerAuthInterceptors(getAccessToken, refreshAccessToken) {
        if (!this.authInterceptorIds.length) {
            const requestInterceptorId = index_js_1.ThunderSDK._axios?.interceptors.request.use(async (config) => {
                const token = await (this.accessTokenPromise ??= getAccessToken());
                delete this.accessTokenPromise;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                index_js_1.ThunderSDK.log("Auth interceptor:", "Sending token:", token);
                return config;
            });
            if (requestInterceptorId !== undefined) {
                this.authInterceptorIds.push(requestInterceptorId);
            }
            const responseInterceptorId = index_js_1.ThunderSDK._axios?.interceptors.response
                .use((res) => res, async (error) => {
                if (error.response?.status === 401 &&
                    typeof refreshAccessToken === "function") {
                    await (this.refreshTokenPromise ??= refreshAccessToken());
                    const newToken = await (this.accessTokenPromise ??= getAccessToken());
                    delete this.refreshTokenPromise;
                    delete this.accessTokenPromise;
                    if (newToken) {
                        error.config.headers.Authorization = `Bearer ${newToken}`;
                        return index_js_1.ThunderSDK._axios?.request(error.config);
                    }
                    index_js_1.ThunderSDK.log("Auth interceptor:", "Sending new token:", newToken);
                }
                return Promise.reject(error);
            });
            if (responseInterceptorId !== undefined) {
                this.authInterceptorIds.push(responseInterceptorId);
            }
        }
    }
    static unregisterAuthInterceptors() {
        this.authInterceptorIds.forEach((id) => {
            index_js_1.ThunderSDK._axios?.interceptors.request.eject(id);
            index_js_1.ThunderSDK._axios?.interceptors.response.eject(id);
        });
        this.authInterceptorIds = [];
    }
    static async registerPermissions() {
        const { policies } = await index_js_1.ThunderSDK.accessControlPolicies.myPolicies();
        index_js_1.ThunderSDK.isPermitted = (scope, action) => {
            const allowed = ((scope, action) => {
                if (!scope)
                    return false;
                const _scope = typeof scope === "function" ? scope.__scope : scope;
                const _action = typeof scope === "function" ? scope.name : action;
                return policies.some((policy) => policy.permissions.includes("*") ||
                    policy.permissions.includes(`${_scope}.${_action}`) ||
                    policy.permissions.includes(_scope ?? "*"));
            })(scope, action);
            index_js_1.ThunderSDK.log("Allowed permission", scope, action, allowed);
            return allowed;
        };
    }
    static unregisterPermissions() {
        index_js_1.ThunderSDK.isPermitted = () => false;
    }
    static clean() {
        this.unregisterAuthInterceptors();
        this.removeTenant();
        this.unregisterPermissions();
    }
}
exports.essentialsEntry = essentialsEntry;
Object.defineProperty(essentialsEntry, "authInterceptorIds", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: []
});
