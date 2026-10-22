import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type list$return = {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    scope: "system" | "tenant";
    kind: "app" | "service";
    slug: string;
    latestVersion: number;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    _id: string;
    clonedFrom?: {
        template: string;
        version: number;
    } | undefined;
}[];
export type create$body = {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    kind: "app" | "service";
    slug: string;
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
export type create$return = {
    _id: string;
};
export type get$params = {
    id?: string;
};
export type get$query = {
    version?: number | undefined;
};
export type get$return = {
    template: {
        name: string;
        description?: string | undefined;
        icon?: string | undefined;
        scope: "system" | "tenant";
        kind: "app" | "service";
        slug: string;
        latestVersion: number;
        isPublished: boolean;
        createdAt: string;
        updatedAt: string;
        _id: string;
        clonedFrom?: {
            template: string;
            version: number;
        } | undefined;
    };
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
        version: number;
        createdAt: string;
    };
};
export type update$params = {
    id?: string;
};
export type update$body = {
    name?: string | undefined;
    description?: (string | undefined) | undefined;
    icon?: (string | undefined) | undefined;
};
export type del$params = {
    id?: string;
};
export type versions$params = {
    id?: string;
};
export type versions$return = {
    version: number;
    changelog?: string | undefined;
    createdAt: string;
}[];
export type saveTemplateVersion$params = {
    id?: string;
};
export type saveTemplateVersion$body = {
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
export type saveTemplateVersion$return = {
    version: number;
};
export type clone$params = {
    id?: string;
};
export type clone$body = {
    name: string;
    slug: string;
};
export type clone$return = {
    _id: string;
};
export type render$params = {
    id?: string;
};
export type render$body = {
    version?: number | undefined;
    inputs?: Record<string, unknown>;
};
export type render$return = {
    files: Record<string, string>;
    generated: string[];
};
export declare const templatesModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        list$return: list$return;
        create$body: create$body;
        create$return: create$return;
        get$params: get$params;
        get$query: get$query;
        get$return: get$return;
        update$params: update$params;
        update$body: update$body;
        del$params: del$params;
        versions$params: versions$params;
        versions$return: versions$return;
        saveTemplateVersion$params: saveTemplateVersion$params;
        saveTemplateVersion$body: saveTemplateVersion$body;
        saveTemplateVersion$return: saveTemplateVersion$return;
        clone$params: clone$params;
        clone$body: clone$body;
        clone$return: clone$return;
        render$params: render$params;
        render$body: render$body;
        render$return: render$return;
    };
    readonly list: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<list$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<list$return, any, {}, any>>;
        readonly data: Promise<list$return>;
        then: <TResult1 = list$return, TResult2 = never>(onfulfilled?: ((value: list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<list$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<list$return>;
    };
    readonly create: (data: {
        params?: undefined;
        query?: undefined;
        body: create$body;
    } & TRequestOptions<create$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<create$return, any, {}, any>>;
        readonly data: Promise<create$return>;
        then: <TResult1 = create$return, TResult2 = never>(onfulfilled?: ((value: create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<create$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<create$return>;
    };
    readonly get: (data: {
        params: get$params;
        query: get$query;
        body?: undefined;
    } & TRequestOptions<get$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<get$return, any, {}, any>>;
        readonly data: Promise<get$return>;
        then: <TResult1 = get$return, TResult2 = never>(onfulfilled?: ((value: get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<get$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<get$return>;
    };
    readonly update: (data: {
        params: update$params;
        query?: undefined;
        body: update$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly del: (data: {
        params: del$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly versions: (data: {
        params: versions$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<versions$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<versions$return, any, {}, any>>;
        readonly data: Promise<versions$return>;
        then: <TResult1 = versions$return, TResult2 = never>(onfulfilled?: ((value: versions$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<versions$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<versions$return>;
    };
    readonly saveTemplateVersion: (data: {
        params: saveTemplateVersion$params;
        query?: undefined;
        body: saveTemplateVersion$body;
    } & TRequestOptions<saveTemplateVersion$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<saveTemplateVersion$return, any, {}, any>>;
        readonly data: Promise<saveTemplateVersion$return>;
        then: <TResult1 = saveTemplateVersion$return, TResult2 = never>(onfulfilled?: ((value: saveTemplateVersion$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<saveTemplateVersion$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<saveTemplateVersion$return>;
    };
    readonly clone: (data: {
        params: clone$params;
        query?: undefined;
        body: clone$body;
    } & TRequestOptions<clone$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<clone$return, any, {}, any>>;
        readonly data: Promise<clone$return>;
        then: <TResult1 = clone$return, TResult2 = never>(onfulfilled?: ((value: clone$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<clone$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<clone$return>;
    };
    readonly render: (data: {
        params: render$params;
        query?: undefined;
        body: render$body;
    } & TRequestOptions<render$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<render$return, any, {}, any>>;
        readonly data: Promise<render$return>;
        then: <TResult1 = render$return, TResult2 = never>(onfulfilled?: ((value: render$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<render$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<render$return>;
    };
};
