import { type AxiosRequestConfig, type AxiosInstance, type AxiosResponse } from "axios";
import type { TSDKOptions, TCacheKey, TCacheOptions } from "./types.js";
export declare class BaseSDK {
    protected static _moduleGroup: Map<object, string>;
    protected static _moduleMetadata: Map<object, Record<string, unknown>>;
    protected static _useCachingMethods: Map<string, unknown>;
    protected static _cachingActivity: Map<string, {
        controller: AbortController;
        resultPromise: unknown;
        timestamp: number;
    }>;
    protected static _cacheNamespacesDefault: Record<string, string | null>;
    protected static _cacheNamespaces: {
        [x: string]: string | null;
    };
    static _options?: TSDKOptions;
    static _axios?: AxiosInstance;
    static plugins: Record<string, any>;
    static resolveAxiosConfig(config: AxiosRequestConfig): AxiosRequestConfig<any, any>;
    static resolvePathParams(params?: Record<string, unknown>): Record<string, string | string[]> | undefined;
    static log(...args: unknown[]): void;
    static init(options?: TSDKOptions): Promise<void>;
    static clean(): Promise<void>;
    static isPermitted: (scope: string | (Function & {
        __scope?: string;
    }), action?: string) => boolean;
    static checkPermission(scope: string | Function & {
        __scope?: string;
    }, action?: string): void;
    static resolveCacheKey(keys: TCacheKey, namespace?: string): string;
    static setCache(keys: TCacheKey, value: any): Promise<boolean>;
    static getCache<T>(keys: TCacheKey): Promise<{
        value: T;
        timestamp: number;
        expired?: boolean;
    } | null>;
    static expireCache(keys: TCacheKey): Promise<boolean>;
    static delCache(keys: TCacheKey): Promise<boolean>;
    /**
     * Forgets the entry for `keys`; with `subKeys`, every registered entry under
     * that prefix too. Returns the resolved keys it removed.
     */
    static forgetCache(keys: TCacheKey, options?: {
        subKeys?: boolean;
    }): Promise<string[]>;
    static clearCache(): Promise<void>;
    static cacheKeys(startsWith?: string): Promise<string[]>;
    static useCache<T>(callback: () => T | Promise<T>, options?: TCacheOptions<T>): Promise<T>;
    static useCaching<T>(cacheKey: TCacheKey, callback: (opts: {
        signal: AbortSignal;
    }) => T | Promise<T>, options?: Omit<TCacheOptions<T>, "cacheKey">, freshMethods?: boolean): {
        key: string;
        get: () => Promise<T>;
        expire: (options?: {
            stopPropagation?: boolean;
        }) => Promise<boolean>;
        del: () => Promise<boolean>;
        forget: () => Promise<boolean>;
        invalidate: (options?: {
            stopPropagation?: boolean;
        }) => Promise<T>;
        onInvalidate: (callback: (data: T) => void) => void;
        offInvalidate: (callback: (data: T) => void) => void;
        onExpire: (callback: () => void) => void;
        offExpire: (callback: () => void) => void;
    };
    static withCaching(callback: (methods: ReturnType<typeof BaseSDK.useCaching>, key: string) => void | Promise<void>, options?: {
        matcher?: RegExp;
    }): Promise<void>;
    static resolveAxiosResponse<T>(executor: () => Promise<AxiosResponse<T>>, options?: TCacheOptions<T>): {
        readonly raw: Promise<AxiosResponse<T, any, {}, any>>;
        readonly data: Promise<T>;
        then: Promise<T>["then"];
        catch: Promise<T>["catch"];
        finally: Promise<T>["finally"];
    };
}
//# sourceMappingURL=base.d.ts.map