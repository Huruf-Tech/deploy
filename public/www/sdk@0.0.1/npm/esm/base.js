var _a;
import axios from "axios";
export class BaseSDK {
    static resolveAxiosConfig(config) {
        if (config?.headers) {
            const headerKeys = Object.keys(config.headers);
            if (headerKeys.length) {
                config.headers = headerKeys.reduce((headers, key) => {
                    headers[key.toLowerCase()] = config.headers[key];
                    return headers;
                }, {});
            }
        }
        return config;
    }
    ;
    static resolvePathParams(params) {
        if (!params)
            return params;
        // path-to-regexp only accepts strings (e.g. z.coerce.number() params are numbers)
        return Object.fromEntries(Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [
            key,
            value instanceof Array ? value.map(String) : String(value),
        ]));
    }
    static log(...args) {
        if (this._options?.logs) {
            console.log("Thunder SDK::", ...args);
        }
    }
    static async init(options) {
        this._options = options;
        this._axios = axios.create(options?.axiosConfig);
        await Promise.all(Object.values(this.plugins).map(async (plugin) => {
            if (typeof plugin.init === "function") {
                await plugin.init();
            }
        }));
    }
    static async clean() {
        await Promise.all(Object.values(this.plugins).map(async (plugin) => {
            if (typeof plugin.clean === "function") {
                await plugin.clean();
            }
        }));
        // Cache is optional (and keys() is optional within it)
        if (this._options?.cache?.delete && this._options.cache.keys) {
            await this.clearCache();
        }
        delete this._options;
        delete this._axios;
        this._useCachingMethods = new Map();
        this._cachingActivity = new Map();
        this._cacheNamespaces = { ...this._cacheNamespacesDefault };
    }
    static checkPermission(scope, action) {
        if (!this.isPermitted(scope, action))
            throw new Error(`You are not authorized to perform this action! Missing permission '${scope}.${action}'!`);
    }
    static resolveCacheKey(keys, namespace) {
        const internalNamespaces = Object.values(this._cacheNamespaces);
        return [...internalNamespaces, namespace, ...(keys instanceof Array ? keys : [keys])].filter(Boolean).join(":");
    }
    static async setCache(keys, value) {
        if (typeof this._options?.cache?.setter !== "function")
            throw new Error("A cache setter is not defined!");
        return await this._options.cache.setter(this.resolveCacheKey(keys), JSON.stringify({ value, timestamp: Date.now() / 1000 }));
    }
    static async getCache(keys) {
        if (typeof this._options?.cache?.getter !== "function")
            throw new Error("A cache getter is not defined!");
        const value = await this._options.cache.getter(this.resolveCacheKey(keys));
        if (!value)
            return null;
        return JSON.parse(value);
    }
    static async expireCache(keys) {
        if (typeof this._options?.cache?.getter !== "function")
            throw new Error("A cache getter is not defined!");
        if (typeof this._options?.cache?.setter !== "function")
            throw new Error("A cache setter is not defined!");
        const value = await this._options.cache.getter(this.resolveCacheKey(keys));
        if (!value || /^{\s*"expired"/.test(value))
            return false;
        return await this._options.cache.setter(this.resolveCacheKey(keys), `{"expired": true,` + value.substring(1));
    }
    static async delCache(keys) {
        if (typeof this._options?.cache?.delete !== "function")
            throw new Error("A cache delete function is not defined!");
        return await this._options.cache.delete(this.resolveCacheKey(keys));
    }
    static async clearCache() {
        if (typeof this._options?.cache?.delete !== "function")
            throw new Error("A cache delete function is not defined!");
        const keys = await this.cacheKeys();
        await Promise.all(keys.map(key => this._options.cache.delete(key)));
    }
    static async cacheKeys(startsWith) {
        if (typeof this._options?.cache?.keys !== "function")
            throw new Error("A cache keys function is not defined!");
        return (await this._options.cache.keys()).filter(key => key.startsWith(startsWith ?? this.resolveCacheKey("")));
    }
    static async useCache(callback, options) {
        const Cached = options?.cacheKey ? await this.getCache(options.cacheKey) : null;
        returnCache: if (Cached !== null) {
            if (Cached.expired)
                break returnCache;
            if (options?.cacheTTL && (Cached.timestamp + (typeof options.cacheTTL === "function"
                ? options.cacheTTL(Cached.value, Cached.timestamp)
                : options.cacheTTL)) < (Date.now() / 1000)) {
                await this.expireCache(options.cacheKey);
                break returnCache;
            }
            return Cached.value;
        }
        try {
            const Results = await callback();
            if (options?.cacheKey && ![null, undefined].includes(Results)) {
                await this.setCache(options.cacheKey, Results);
            }
            return Results;
        }
        catch (error) {
            if (Cached)
                return Cached.value;
            throw error;
        }
    }
    static useCaching(cacheKey, callback, options, freshMethods = false) {
        const resolvedCacheKey = this.resolveCacheKey(cacheKey);
        const _methods = this._useCachingMethods.get(resolvedCacheKey);
        if (_methods && !freshMethods)
            return _methods;
        const get = () => {
            return this.useCache(async () => {
                const activity = this._cachingActivity.get(resolvedCacheKey);
                if (activity) {
                    if (Date.now() - activity.timestamp > 1000) {
                        activity.controller.abort("Repeated request!");
                    }
                    else {
                        return activity.resultPromise;
                    }
                }
                const controller = new AbortController();
                const resultPromise = callback({ signal: controller.signal });
                this._cachingActivity.set(resolvedCacheKey, {
                    controller,
                    resultPromise,
                    timestamp: Date.now(),
                });
                try {
                    return await resultPromise;
                }
                finally {
                    if (this._cachingActivity.get(resolvedCacheKey)?.resultPromise === resultPromise) {
                        this._cachingActivity.delete(resolvedCacheKey);
                    }
                }
            }, {
                cacheKey,
                ...options,
            });
        };
        const isSubKey = (key, baseKey) => {
            const prefix = this.resolveCacheKey(baseKey);
            return key === prefix || key.startsWith(prefix + ":");
        };
        const expireCallbacks = new Set();
        const onExpire = (callback) => {
            expireCallbacks.add(callback);
        };
        const offExpire = (callback) => {
            expireCallbacks.delete(callback);
        };
        const expire = async (options) => {
            if (!options?.stopPropagation) {
                const baseKey = cacheKey instanceof Array ? cacheKey[0] : cacheKey;
                const cacheKeys = Array.from(this._useCachingMethods.keys());
                await Promise.all(cacheKeys.map(async (key) => {
                    if (resolvedCacheKey !== key && isSubKey(key, baseKey)) {
                        const cachingMethods = this._useCachingMethods.get(key);
                        await cachingMethods.expire({ stopPropagation: true });
                    }
                }));
            }
            const expired = await this.expireCache(cacheKey);
            for (const callback of expireCallbacks) {
                callback();
            }
            return expired;
        };
        const del = () => this.delCache(cacheKey);
        const invalidateCallbacks = new Set();
        const onInvalidate = (callback) => {
            invalidateCallbacks.add(callback);
        };
        const offInvalidate = (callback) => {
            invalidateCallbacks.delete(callback);
        };
        const invalidate = async (options) => {
            if (!options?.stopPropagation) {
                const baseKey = cacheKey instanceof Array ? cacheKey[0] : cacheKey;
                const cacheKeys = Array.from(this._useCachingMethods.keys());
                await Promise.all(cacheKeys.map(async (key) => {
                    if (resolvedCacheKey !== key && isSubKey(key, baseKey)) {
                        const cachingMethods = this._useCachingMethods.get(key);
                        await cachingMethods.invalidate({ stopPropagation: true });
                    }
                }));
            }
            await expire({ stopPropagation: true });
            const data = await get();
            for (const callback of invalidateCallbacks) {
                callback(data);
            }
            return data;
        };
        const methods = { key: resolvedCacheKey, get, expire, del, invalidate, onInvalidate, offInvalidate, onExpire, offExpire };
        this._useCachingMethods.set(resolvedCacheKey, methods);
        return methods;
    }
    static async withCaching(callback, options) {
        for (const [key, methods] of this._useCachingMethods) {
            if (options && options.matcher instanceof RegExp && !options.matcher.test(key))
                continue;
            await callback(methods, key);
        }
    }
    static resolveAxiosResponse(executor, options) {
        if (!this._axios)
            throw new Error("Axios not initialized!");
        const sdk = this;
        const executors = {
            get raw() {
                return executor();
            },
            get data() {
                const callback = () => new Promise((resolve, reject) => {
                    executors.raw
                        .then((res) => resolve(res.data))
                        .catch((err) => reject(err));
                });
                if (options?.cacheKey)
                    return sdk.useCache(callback, options);
                return callback();
            },
            then: ((resolve, reject) => {
                return executors.data.then(resolve, reject);
            }),
            catch: ((reject) => {
                return executors.data.catch(reject);
            }),
            finally: ((result) => {
                return executors.data.finally(result);
            }),
        };
        return executors;
    }
}
_a = BaseSDK;
Object.defineProperty(BaseSDK, "_moduleGroup", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(BaseSDK, "_moduleMetadata", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(BaseSDK, "_useCachingMethods", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(BaseSDK, "_cachingActivity", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(BaseSDK, "_cacheNamespacesDefault", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        __internal: "__thunder-sdk:cache",
    }
});
Object.defineProperty(BaseSDK, "_cacheNamespaces", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: { ..._a._cacheNamespacesDefault }
});
Object.defineProperty(BaseSDK, "plugins", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {}
});
Object.defineProperty(BaseSDK, "isPermitted", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (scope, action) => {
        return true;
    }
});
