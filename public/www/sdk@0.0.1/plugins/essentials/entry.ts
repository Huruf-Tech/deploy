/**
 * This SDK plugin is used within SDK generation process
 * You cannot import any files from thunder or any of its sources here cause it will not work.
 * Your code should be isolated in the this/current folder.
 */

import { ThunderSDK } from "../../index.ts";

export class essentialsEntry {
  protected static tenantInterceptorId?: number;
  protected static authInterceptorIds: number[] = [];
  protected static refreshTokenPromise?: Promise<void>;
  protected static accessTokenPromise?: Promise<string | null>;

  protected static tenant?: string;

  static setTenant(tenant: string) {
    this.tenant = ThunderSDK["_cacheNamespaces"].tenant = tenant;

    ThunderSDK.log("Setting tenant:", this.tenant);

    if (!this.tenantInterceptorId && this.tenant) {
      this.tenantInterceptorId = ThunderSDK._axios?.interceptors.request.use(
        (config) => {
          if (this.tenant) {
            config.headers["x-tenant-id"] = this.tenant;
          }

          ThunderSDK.log(
            "Tenant interceptor:",
            this.tenant,
          );

          return config;
        },
      );
    }
  }

  static getTenant() {
    return this.tenant;
  }

  static removeTenant() {
    ThunderSDK["_cacheNamespaces"].tenant = null;
    delete this.tenant;

    ThunderSDK.log("Tenant removed");

    if (this.tenantInterceptorId && !this.tenant) {
      ThunderSDK._axios?.interceptors.response.eject(this.tenantInterceptorId);
    }
  }

  static registerAuthInterceptors(
    getAccessToken: () => Promise<string | null>,
    refreshAccessToken?: () => Promise<void>,
  ) {
    if (!this.authInterceptorIds.length) {
      const requestInterceptorId = ThunderSDK._axios?.interceptors.request.use(
        async (config) => {
          const token = await (this.accessTokenPromise ??= getAccessToken());

          delete this.accessTokenPromise;

          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          ThunderSDK.log(
            "Auth interceptor:",
            "Sending token:",
            token,
          );

          return config;
        },
      );

      if (requestInterceptorId !== undefined) {
        this.authInterceptorIds.push(requestInterceptorId);
      }

      const responseInterceptorId = ThunderSDK._axios?.interceptors.response
        .use(
          (res) => res,
          async (error) => {
            if (
              error.response?.status === 401 &&
              typeof refreshAccessToken === "function"
            ) {
              await (this.refreshTokenPromise ??= refreshAccessToken());

              const newToken =
                await (this.accessTokenPromise ??= getAccessToken());

              delete this.refreshTokenPromise;
              delete this.accessTokenPromise;

              if (newToken) {
                error.config.headers.Authorization = `Bearer ${newToken}`;

                return ThunderSDK._axios?.request(error.config);
              }

              ThunderSDK.log(
                "Auth interceptor:",
                "Sending new token:",
                newToken,
              );
            }

            return Promise.reject(error);
          },
        );

      if (responseInterceptorId !== undefined) {
        this.authInterceptorIds.push(responseInterceptorId);
      }
    }
  }

  static unregisterAuthInterceptors() {
    this.authInterceptorIds.forEach((id) => {
      ThunderSDK._axios?.interceptors.request.eject(id);
      ThunderSDK._axios?.interceptors.response.eject(id);
    });

    this.authInterceptorIds = [];
  }

  static async registerPermissions() {
    const { policies } = await ThunderSDK.accessControlPolicies.myPolicies();

    ThunderSDK.isPermitted = (scope, action) => {
      const allowed = ((scope, action) => {
        if (!scope) return false;

        const _scope = typeof scope === "function" ? scope.__scope : scope;
        const _action = typeof scope === "function" ? scope.name : action;

        return policies.some((policy) =>
          policy.permissions.includes("*") ||
          policy.permissions.includes(`${_scope}.${_action}`) ||
          policy.permissions.includes(_scope ?? "*")
        );
      })(scope, action);

      ThunderSDK.log("Allowed permission", scope, action, allowed);

      return allowed;
    };
  }

  static unregisterPermissions() {
    ThunderSDK.isPermitted = () => false;
  }

  static clean() {
    this.unregisterAuthInterceptors();
    this.removeTenant();
    this.unregisterPermissions();
  }
}
