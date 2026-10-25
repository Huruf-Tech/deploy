import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type status$return = {
    enabled: boolean;
    limit: number;
    used: number;
};
export type draft$body = {
    description: string;
    repo?: {
        integration?: string;
        installation: number;
        repo: string;
        branch: string;
    } | undefined;
};
export type draft$return = {
    kind: "app" | "service";
    name: string;
    description: string;
    explanation: string;
    content: {
        dockerfile?: string | undefined;
        compose?: string | undefined;
        inputs: {
            key: string;
            label: string;
            description?: string | undefined;
            type: "string" | "number" | "boolean" | "select" | "secret";
            default?: (string | number | boolean) | undefined;
            required: boolean;
            options?: string[] | undefined;
            generate?: ("password") | undefined;
        }[];
        defaults: {
            port?: number | undefined;
            healthcheckPath?: string | undefined;
            startCommand?: string | undefined;
            buildCommand?: string | undefined;
            cpuLimit?: number | undefined;
            memLimitMb?: number | undefined;
        };
        cachePaths: string[];
        changelog?: string | undefined;
    };
};
export type fix$body = {
    deployment?: string;
    log?: string | undefined;
};
export type fix$return = {
    project: string;
    explanation: string;
    template?: string | undefined;
    baseVersion?: number | undefined;
    content?: {
        dockerfile?: string | undefined;
        compose?: string | undefined;
        inputs: {
            key: string;
            label: string;
            description?: string | undefined;
            type: "string" | "number" | "boolean" | "select" | "secret";
            default?: (string | number | boolean) | undefined;
            required: boolean;
            options?: string[] | undefined;
            generate?: ("password") | undefined;
        }[];
        defaults: {
            port?: number | undefined;
            healthcheckPath?: string | undefined;
            startCommand?: string | undefined;
            buildCommand?: string | undefined;
            cpuLimit?: number | undefined;
            memLimitMb?: number | undefined;
        };
        cachePaths: string[];
        changelog?: string | undefined;
    } | undefined;
};
export type applyAiFix$body = {
    project?: string;
    content: {
        dockerfile?: string | undefined;
        compose?: string | undefined;
        inputs?: {
            key: string;
            label: string;
            description?: string | undefined;
            type: "string" | "number" | "boolean" | "select" | "secret";
            default?: (string | number | boolean) | undefined;
            required?: boolean;
            options?: string[] | undefined;
            generate?: ("password") | undefined;
        }[];
        defaults?: {
            port?: number | undefined;
            healthcheckPath?: string | undefined;
            startCommand?: string | undefined;
            buildCommand?: string | undefined;
            cpuLimit?: number | undefined;
            memLimitMb?: number | undefined;
        };
        cachePaths?: string[];
        changelog?: string | undefined;
    };
};
export type applyAiFix$return = {
    template: string;
    version: number;
};
export declare const aiModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        status$return: status$return;
        draft$body: draft$body;
        draft$return: draft$return;
        fix$body: fix$body;
        fix$return: fix$return;
        applyAiFix$body: applyAiFix$body;
        applyAiFix$return: applyAiFix$return;
    };
    readonly status: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<status$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<status$return, any, {}, any>>;
        readonly data: Promise<status$return>;
        then: <TResult1 = status$return, TResult2 = never>(onfulfilled?: ((value: status$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<status$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<status$return>;
    };
    readonly draft: (data: {
        params?: undefined;
        query?: undefined;
        body: draft$body;
    } & TRequestOptions<draft$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<draft$return, any, {}, any>>;
        readonly data: Promise<draft$return>;
        then: <TResult1 = draft$return, TResult2 = never>(onfulfilled?: ((value: draft$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<draft$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<draft$return>;
    };
    readonly fix: (data: {
        params?: undefined;
        query?: undefined;
        body: fix$body;
    } & TRequestOptions<fix$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<fix$return, any, {}, any>>;
        readonly data: Promise<fix$return>;
        then: <TResult1 = fix$return, TResult2 = never>(onfulfilled?: ((value: fix$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<fix$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<fix$return>;
    };
    readonly applyAiFix: (data: {
        params?: undefined;
        query?: undefined;
        body: applyAiFix$body;
    } & TRequestOptions<applyAiFix$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<applyAiFix$return, any, {}, any>>;
        readonly data: Promise<applyAiFix$return>;
        then: <TResult1 = applyAiFix$return, TResult2 = never>(onfulfilled?: ((value: applyAiFix$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<applyAiFix$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<applyAiFix$return>;
    };
};
//# sourceMappingURL=ai.d.ts.map