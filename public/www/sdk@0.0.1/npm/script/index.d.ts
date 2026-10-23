/**
 * Copyright © Huruf Tech 2026
 *
 * This is a generated file. Do not edit the contents of this file!
 */
import { BaseSDK } from "./base.js";
import { essentialsEntry } from "./plugins/essentials/entry.js";
export declare class ThunderSDK extends BaseSDK {
    protected static _actionsList?: string[];
    protected static _moduleNames: string[];
    static projectGroups: {
        readonly type: {
            create$body: import("./modules/projectGroups.js").create$body;
            create$return: import("./modules/projectGroups.js").create$return;
            count$query: import("./modules/projectGroups.js").count$query;
            count$return: import("./modules/projectGroups.js").count$return;
            get$params: import("./modules/projectGroups.js").get$params;
            get$query: import("./modules/projectGroups.js").get$query;
            get$return: import("./modules/projectGroups.js").get$return;
            update$params: import("./modules/projectGroups.js").update$params;
            update$body: import("./modules/projectGroups.js").update$body;
            del$params: import("./modules/projectGroups.js").del$params;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/projectGroups.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/projectGroups.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projectGroups.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projectGroups.js").create$return>;
            then: <TResult1 = import("./modules/projectGroups.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projectGroups.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projectGroups.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projectGroups.js").create$return>;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/projectGroups.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/projectGroups.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projectGroups.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projectGroups.js").count$return>;
            then: <TResult1 = import("./modules/projectGroups.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projectGroups.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projectGroups.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projectGroups.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/projectGroups.js").get$params;
            query: import("./modules/projectGroups.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/projectGroups.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projectGroups.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projectGroups.js").get$return>;
            then: <TResult1 = import("./modules/projectGroups.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projectGroups.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projectGroups.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projectGroups.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/projectGroups.js").update$params;
            query?: undefined;
            body: import("./modules/projectGroups.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/projectGroups.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static projects: {
        readonly type: {
            list$return: import("./modules/projects.js").list$return;
            create$body: import("./modules/projects.js").create$body;
            create$return: import("./modules/projects.js").create$return;
            placementInfo$return: import("./modules/projects.js").placementInfo$return;
            get$params: import("./modules/projects.js").get$params;
            get$return: import("./modules/projects.js").get$return;
            update$params: import("./modules/projects.js").update$params;
            update$body: import("./modules/projects.js").update$body;
            update$return: import("./modules/projects.js").update$return;
            del$params: import("./modules/projects.js").del$params;
            deployProject$params: import("./modules/projects.js").deployProject$params;
            deployProject$body: import("./modules/projects.js").deployProject$body;
            deployProject$return: import("./modules/projects.js").deployProject$return;
            rollbackProject$params: import("./modules/projects.js").rollbackProject$params;
            rollbackProject$body: import("./modules/projects.js").rollbackProject$body;
            rollbackProject$return: import("./modules/projects.js").rollbackProject$return;
            clearCache$params: import("./modules/projects.js").clearCache$params;
            releases$params: import("./modules/projects.js").releases$params;
            releases$return: import("./modules/projects.js").releases$return;
            deployments$params: import("./modules/projects.js").deployments$params;
            deployments$query: import("./modules/projects.js").deployments$query;
            deployments$return: import("./modules/projects.js").deployments$return;
            deployment$params: import("./modules/projects.js").deployment$params;
            deployment$return: import("./modules/projects.js").deployment$return;
            cancelDeployment$params: import("./modules/projects.js").cancelDeployment$params;
        };
        readonly list: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/projects.js").list$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projects.js").list$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projects.js").list$return>;
            then: <TResult1 = import("./modules/projects.js").list$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projects.js").list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projects.js").list$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projects.js").list$return>;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/projects.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/projects.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projects.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projects.js").create$return>;
            then: <TResult1 = import("./modules/projects.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projects.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projects.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projects.js").create$return>;
        };
        readonly placementInfo: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/projects.js").placementInfo$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projects.js").placementInfo$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projects.js").placementInfo$return>;
            then: <TResult1 = import("./modules/projects.js").placementInfo$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projects.js").placementInfo$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projects.js").placementInfo$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projects.js").placementInfo$return>;
        };
        readonly get: (data: {
            params: import("./modules/projects.js").get$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/projects.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projects.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projects.js").get$return>;
            then: <TResult1 = import("./modules/projects.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projects.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projects.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projects.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/projects.js").update$params;
            query?: undefined;
            body: import("./modules/projects.js").update$body;
        } & import("./types.js").TRequestOptions<import("./modules/projects.js").update$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projects.js").update$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projects.js").update$return>;
            then: <TResult1 = import("./modules/projects.js").update$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projects.js").update$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projects.js").update$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projects.js").update$return>;
        };
        readonly del: (data: {
            params: import("./modules/projects.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly deployProject: (data: {
            params: import("./modules/projects.js").deployProject$params;
            query?: undefined;
            body: import("./modules/projects.js").deployProject$body;
        } & import("./types.js").TRequestOptions<import("./modules/projects.js").deployProject$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projects.js").deployProject$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projects.js").deployProject$return>;
            then: <TResult1 = import("./modules/projects.js").deployProject$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projects.js").deployProject$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projects.js").deployProject$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projects.js").deployProject$return>;
        };
        readonly rollbackProject: (data: {
            params: import("./modules/projects.js").rollbackProject$params;
            query?: undefined;
            body: import("./modules/projects.js").rollbackProject$body;
        } & import("./types.js").TRequestOptions<import("./modules/projects.js").rollbackProject$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projects.js").rollbackProject$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projects.js").rollbackProject$return>;
            then: <TResult1 = import("./modules/projects.js").rollbackProject$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projects.js").rollbackProject$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projects.js").rollbackProject$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projects.js").rollbackProject$return>;
        };
        readonly clearCache: (data: {
            params: import("./modules/projects.js").clearCache$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly releases: (data: {
            params: import("./modules/projects.js").releases$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/projects.js").releases$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projects.js").releases$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projects.js").releases$return>;
            then: <TResult1 = import("./modules/projects.js").releases$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projects.js").releases$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projects.js").releases$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projects.js").releases$return>;
        };
        readonly deployments: (data: {
            params: import("./modules/projects.js").deployments$params;
            query: import("./modules/projects.js").deployments$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/projects.js").deployments$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projects.js").deployments$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projects.js").deployments$return>;
            then: <TResult1 = import("./modules/projects.js").deployments$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projects.js").deployments$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projects.js").deployments$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projects.js").deployments$return>;
        };
        readonly deployment: (data: {
            params: import("./modules/projects.js").deployment$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/projects.js").deployment$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/projects.js").deployment$return, any, {}, any>>;
            readonly data: Promise<import("./modules/projects.js").deployment$return>;
            then: <TResult1 = import("./modules/projects.js").deployment$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/projects.js").deployment$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/projects.js").deployment$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/projects.js").deployment$return>;
        };
        readonly cancelDeployment: (data: {
            params: import("./modules/projects.js").cancelDeployment$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static billing: {
        readonly type: {
            get$return: import("./modules/billing.js").get$return;
            plans$return: import("./modules/billing.js").plans$return;
            periods$return: import("./modules/billing.js").periods$return;
            subscribe$body: import("./modules/billing.js").subscribe$body;
            subscribe$return: import("./modules/billing.js").subscribe$return;
        };
        readonly get: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/billing.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/billing.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/billing.js").get$return>;
            then: <TResult1 = import("./modules/billing.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/billing.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/billing.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/billing.js").get$return>;
        };
        readonly plans: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/billing.js").plans$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/billing.js").plans$return, any, {}, any>>;
            readonly data: Promise<import("./modules/billing.js").plans$return>;
            then: <TResult1 = import("./modules/billing.js").plans$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/billing.js").plans$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/billing.js").plans$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/billing.js").plans$return>;
        };
        readonly periods: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/billing.js").periods$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/billing.js").periods$return, any, {}, any>>;
            readonly data: Promise<import("./modules/billing.js").periods$return>;
            then: <TResult1 = import("./modules/billing.js").periods$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/billing.js").periods$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/billing.js").periods$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/billing.js").periods$return>;
        };
        readonly subscribe: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/billing.js").subscribe$body;
        } & import("./types.js").TRequestOptions<import("./modules/billing.js").subscribe$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/billing.js").subscribe$return, any, {}, any>>;
            readonly data: Promise<import("./modules/billing.js").subscribe$return>;
            then: <TResult1 = import("./modules/billing.js").subscribe$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/billing.js").subscribe$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/billing.js").subscribe$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/billing.js").subscribe$return>;
        };
        readonly cancel: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static billingAdmin: {
        readonly type: {
            subscriptions$query: import("./modules/billingAdmin.js").subscriptions$query;
            subscriptions$return: import("./modules/billingAdmin.js").subscriptions$return;
            grant$body: import("./modules/billingAdmin.js").grant$body;
        };
        readonly subscriptions: (data: {
            params?: undefined;
            query: import("./modules/billingAdmin.js").subscriptions$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/billingAdmin.js").subscriptions$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/billingAdmin.js").subscriptions$return, any, {}, any>>;
            readonly data: Promise<import("./modules/billingAdmin.js").subscriptions$return>;
            then: <TResult1 = import("./modules/billingAdmin.js").subscriptions$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/billingAdmin.js").subscriptions$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/billingAdmin.js").subscriptions$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/billingAdmin.js").subscriptions$return>;
        };
        readonly grant: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/billingAdmin.js").grant$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static plans: {
        readonly type: {
            create$body: import("./modules/plans.js").create$body;
            create$return: import("./modules/plans.js").create$return;
            count$query: import("./modules/plans.js").count$query;
            count$return: import("./modules/plans.js").count$return;
            get$params: import("./modules/plans.js").get$params;
            get$query: import("./modules/plans.js").get$query;
            get$return: import("./modules/plans.js").get$return;
            update$params: import("./modules/plans.js").update$params;
            update$body: import("./modules/plans.js").update$body;
            del$params: import("./modules/plans.js").del$params;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/plans.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/plans.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/plans.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/plans.js").create$return>;
            then: <TResult1 = import("./modules/plans.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/plans.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/plans.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/plans.js").create$return>;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/plans.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/plans.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/plans.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/plans.js").count$return>;
            then: <TResult1 = import("./modules/plans.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/plans.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/plans.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/plans.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/plans.js").get$params;
            query: import("./modules/plans.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/plans.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/plans.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/plans.js").get$return>;
            then: <TResult1 = import("./modules/plans.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/plans.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/plans.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/plans.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/plans.js").update$params;
            query?: undefined;
            body: import("./modules/plans.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/plans.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static gitIntegrations: {
        readonly type: {
            list$return: import("./modules/gitIntegrations.js").list$return;
            connect$body: import("./modules/gitIntegrations.js").connect$body;
            connect$return: import("./modules/gitIntegrations.js").connect$return;
            update$params: import("./modules/gitIntegrations.js").update$params;
            update$body: import("./modules/gitIntegrations.js").update$body;
            del$params: import("./modules/gitIntegrations.js").del$params;
            refresh$params: import("./modules/gitIntegrations.js").refresh$params;
            refresh$return: import("./modules/gitIntegrations.js").refresh$return;
            repositories$params: import("./modules/gitIntegrations.js").repositories$params;
            repositories$query: import("./modules/gitIntegrations.js").repositories$query;
            repositories$return: import("./modules/gitIntegrations.js").repositories$return;
            branches$params: import("./modules/gitIntegrations.js").branches$params;
            branches$query: import("./modules/gitIntegrations.js").branches$query;
            branches$return: import("./modules/gitIntegrations.js").branches$return;
        };
        readonly list: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/gitIntegrations.js").list$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/gitIntegrations.js").list$return, any, {}, any>>;
            readonly data: Promise<import("./modules/gitIntegrations.js").list$return>;
            then: <TResult1 = import("./modules/gitIntegrations.js").list$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/gitIntegrations.js").list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/gitIntegrations.js").list$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/gitIntegrations.js").list$return>;
        };
        readonly connect: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/gitIntegrations.js").connect$body;
        } & import("./types.js").TRequestOptions<import("./modules/gitIntegrations.js").connect$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/gitIntegrations.js").connect$return, any, {}, any>>;
            readonly data: Promise<import("./modules/gitIntegrations.js").connect$return>;
            then: <TResult1 = import("./modules/gitIntegrations.js").connect$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/gitIntegrations.js").connect$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/gitIntegrations.js").connect$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/gitIntegrations.js").connect$return>;
        };
        readonly update: (data: {
            params: import("./modules/gitIntegrations.js").update$params;
            query?: undefined;
            body: import("./modules/gitIntegrations.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/gitIntegrations.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly refresh: (data: {
            params: import("./modules/gitIntegrations.js").refresh$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/gitIntegrations.js").refresh$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/gitIntegrations.js").refresh$return, any, {}, any>>;
            readonly data: Promise<import("./modules/gitIntegrations.js").refresh$return>;
            then: <TResult1 = import("./modules/gitIntegrations.js").refresh$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/gitIntegrations.js").refresh$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/gitIntegrations.js").refresh$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/gitIntegrations.js").refresh$return>;
        };
        readonly repositories: (data: {
            params: import("./modules/gitIntegrations.js").repositories$params;
            query: import("./modules/gitIntegrations.js").repositories$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/gitIntegrations.js").repositories$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/gitIntegrations.js").repositories$return, any, {}, any>>;
            readonly data: Promise<import("./modules/gitIntegrations.js").repositories$return>;
            then: <TResult1 = import("./modules/gitIntegrations.js").repositories$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/gitIntegrations.js").repositories$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/gitIntegrations.js").repositories$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/gitIntegrations.js").repositories$return>;
        };
        readonly branches: (data: {
            params: import("./modules/gitIntegrations.js").branches$params;
            query: import("./modules/gitIntegrations.js").branches$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/gitIntegrations.js").branches$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/gitIntegrations.js").branches$return, any, {}, any>>;
            readonly data: Promise<import("./modules/gitIntegrations.js").branches$return>;
            then: <TResult1 = import("./modules/gitIntegrations.js").branches$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/gitIntegrations.js").branches$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/gitIntegrations.js").branches$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/gitIntegrations.js").branches$return>;
        };
    };
    static githubHooks: {
        readonly type: {};
        readonly manifest: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly setup: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly webhook: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static templates: {
        readonly type: {
            list$return: import("./modules/templates.js").list$return;
            create$body: import("./modules/templates.js").create$body;
            create$return: import("./modules/templates.js").create$return;
            get$params: import("./modules/templates.js").get$params;
            get$query: import("./modules/templates.js").get$query;
            get$return: import("./modules/templates.js").get$return;
            update$params: import("./modules/templates.js").update$params;
            update$body: import("./modules/templates.js").update$body;
            del$params: import("./modules/templates.js").del$params;
            versions$params: import("./modules/templates.js").versions$params;
            versions$return: import("./modules/templates.js").versions$return;
            saveTemplateVersion$params: import("./modules/templates.js").saveTemplateVersion$params;
            saveTemplateVersion$body: import("./modules/templates.js").saveTemplateVersion$body;
            saveTemplateVersion$return: import("./modules/templates.js").saveTemplateVersion$return;
            clone$params: import("./modules/templates.js").clone$params;
            clone$body: import("./modules/templates.js").clone$body;
            clone$return: import("./modules/templates.js").clone$return;
            render$params: import("./modules/templates.js").render$params;
            render$body: import("./modules/templates.js").render$body;
            render$return: import("./modules/templates.js").render$return;
        };
        readonly list: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/templates.js").list$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/templates.js").list$return, any, {}, any>>;
            readonly data: Promise<import("./modules/templates.js").list$return>;
            then: <TResult1 = import("./modules/templates.js").list$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/templates.js").list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/templates.js").list$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/templates.js").list$return>;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/templates.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/templates.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/templates.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/templates.js").create$return>;
            then: <TResult1 = import("./modules/templates.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/templates.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/templates.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/templates.js").create$return>;
        };
        readonly get: (data: {
            params: import("./modules/templates.js").get$params;
            query: import("./modules/templates.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/templates.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/templates.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/templates.js").get$return>;
            then: <TResult1 = import("./modules/templates.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/templates.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/templates.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/templates.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/templates.js").update$params;
            query?: undefined;
            body: import("./modules/templates.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/templates.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly versions: (data: {
            params: import("./modules/templates.js").versions$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/templates.js").versions$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/templates.js").versions$return, any, {}, any>>;
            readonly data: Promise<import("./modules/templates.js").versions$return>;
            then: <TResult1 = import("./modules/templates.js").versions$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/templates.js").versions$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/templates.js").versions$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/templates.js").versions$return>;
        };
        readonly saveTemplateVersion: (data: {
            params: import("./modules/templates.js").saveTemplateVersion$params;
            query?: undefined;
            body: import("./modules/templates.js").saveTemplateVersion$body;
        } & import("./types.js").TRequestOptions<import("./modules/templates.js").saveTemplateVersion$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/templates.js").saveTemplateVersion$return, any, {}, any>>;
            readonly data: Promise<import("./modules/templates.js").saveTemplateVersion$return>;
            then: <TResult1 = import("./modules/templates.js").saveTemplateVersion$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/templates.js").saveTemplateVersion$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/templates.js").saveTemplateVersion$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/templates.js").saveTemplateVersion$return>;
        };
        readonly clone: (data: {
            params: import("./modules/templates.js").clone$params;
            query?: undefined;
            body: import("./modules/templates.js").clone$body;
        } & import("./types.js").TRequestOptions<import("./modules/templates.js").clone$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/templates.js").clone$return, any, {}, any>>;
            readonly data: Promise<import("./modules/templates.js").clone$return>;
            then: <TResult1 = import("./modules/templates.js").clone$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/templates.js").clone$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/templates.js").clone$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/templates.js").clone$return>;
        };
        readonly render: (data: {
            params: import("./modules/templates.js").render$params;
            query?: undefined;
            body: import("./modules/templates.js").render$body;
        } & import("./types.js").TRequestOptions<import("./modules/templates.js").render$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/templates.js").render$return, any, {}, any>>;
            readonly data: Promise<import("./modules/templates.js").render$return>;
            then: <TResult1 = import("./modules/templates.js").render$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/templates.js").render$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/templates.js").render$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/templates.js").render$return>;
        };
    };
    static variables: {
        readonly type: {
            list$query: import("./modules/variables.js").list$query;
            list$return: import("./modules/variables.js").list$return;
            create$body: import("./modules/variables.js").create$body;
            create$return: import("./modules/variables.js").create$return;
            importEnv$body: import("./modules/variables.js").importEnv$body;
            importEnv$return: import("./modules/variables.js").importEnv$return;
            update$params: import("./modules/variables.js").update$params;
            update$body: import("./modules/variables.js").update$body;
            del$params: import("./modules/variables.js").del$params;
            del$query: import("./modules/variables.js").del$query;
            reveal$params: import("./modules/variables.js").reveal$params;
            reveal$body: import("./modules/variables.js").reveal$body;
            reveal$return: import("./modules/variables.js").reveal$return;
            resolve$query: import("./modules/variables.js").resolve$query;
            resolve$return: import("./modules/variables.js").resolve$return;
        };
        readonly list: (data: {
            params?: undefined;
            query: import("./modules/variables.js").list$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/variables.js").list$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/variables.js").list$return, any, {}, any>>;
            readonly data: Promise<import("./modules/variables.js").list$return>;
            then: <TResult1 = import("./modules/variables.js").list$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/variables.js").list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/variables.js").list$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/variables.js").list$return>;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/variables.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/variables.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/variables.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/variables.js").create$return>;
            then: <TResult1 = import("./modules/variables.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/variables.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/variables.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/variables.js").create$return>;
        };
        readonly importEnv: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/variables.js").importEnv$body;
        } & import("./types.js").TRequestOptions<import("./modules/variables.js").importEnv$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/variables.js").importEnv$return, any, {}, any>>;
            readonly data: Promise<import("./modules/variables.js").importEnv$return>;
            then: <TResult1 = import("./modules/variables.js").importEnv$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/variables.js").importEnv$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/variables.js").importEnv$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/variables.js").importEnv$return>;
        };
        readonly update: (data: {
            params: import("./modules/variables.js").update$params;
            query?: undefined;
            body: import("./modules/variables.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/variables.js").del$params;
            query: import("./modules/variables.js").del$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly reveal: (data: {
            params: import("./modules/variables.js").reveal$params;
            query?: undefined;
            body: import("./modules/variables.js").reveal$body;
        } & import("./types.js").TRequestOptions<import("./modules/variables.js").reveal$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/variables.js").reveal$return, any, {}, any>>;
            readonly data: Promise<import("./modules/variables.js").reveal$return>;
            then: <TResult1 = import("./modules/variables.js").reveal$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/variables.js").reveal$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/variables.js").reveal$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/variables.js").reveal$return>;
        };
        readonly resolve: (data: {
            params?: undefined;
            query: import("./modules/variables.js").resolve$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/variables.js").resolve$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/variables.js").resolve$return, any, {}, any>>;
            readonly data: Promise<import("./modules/variables.js").resolve$return>;
            then: <TResult1 = import("./modules/variables.js").resolve$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/variables.js").resolve$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/variables.js").resolve$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/variables.js").resolve$return>;
        };
    };
    static home: {
        readonly type: {};
        readonly status: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static index: {
        readonly type: {
            app$params: import("./modules/index.js").app$params;
            index$params: import("./modules/index.js").index$params;
        };
        readonly app: (data: {
            params: import("./modules/index.js").app$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly index: (data: {
            params: import("./modules/index.js").index$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static agents: {
        readonly type: {
            hello$body: import("./modules/agents.js").hello$body;
            hello$return: import("./modules/agents.js").hello$return;
            poll$body: import("./modules/agents.js").poll$body;
            poll$return: import("./modules/agents.js").poll$return;
            config$return: import("./modules/agents.js").config$return;
            events$body: import("./modules/agents.js").events$body;
            events$return: import("./modules/agents.js").events$return;
        };
        readonly hello: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/agents.js").hello$body;
        } & import("./types.js").TRequestOptions<import("./modules/agents.js").hello$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/agents.js").hello$return, any, {}, any>>;
            readonly data: Promise<import("./modules/agents.js").hello$return>;
            then: <TResult1 = import("./modules/agents.js").hello$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/agents.js").hello$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/agents.js").hello$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/agents.js").hello$return>;
        };
        readonly poll: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/agents.js").poll$body;
        } & import("./types.js").TRequestOptions<import("./modules/agents.js").poll$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/agents.js").poll$return, any, {}, any>>;
            readonly data: Promise<import("./modules/agents.js").poll$return>;
            then: <TResult1 = import("./modules/agents.js").poll$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/agents.js").poll$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/agents.js").poll$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/agents.js").poll$return>;
        };
        readonly installScript: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly config: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/agents.js").config$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/agents.js").config$return, any, {}, any>>;
            readonly data: Promise<import("./modules/agents.js").config$return>;
            then: <TResult1 = import("./modules/agents.js").config$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/agents.js").config$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/agents.js").config$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/agents.js").config$return>;
        };
        readonly events: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/agents.js").events$body;
        } & import("./types.js").TRequestOptions<import("./modules/agents.js").events$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/agents.js").events$return, any, {}, any>>;
            readonly data: Promise<import("./modules/agents.js").events$return>;
            then: <TResult1 = import("./modules/agents.js").events$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/agents.js").events$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/agents.js").events$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/agents.js").events$return>;
        };
    };
    static networks: {
        readonly type: {
            get$return: import("./modules/networks.js").get$return;
            updateMember$params: import("./modules/networks.js").updateMember$params;
            updateMember$body: import("./modules/networks.js").updateMember$body;
            setPrimary$body: import("./modules/networks.js").setPrimary$body;
        };
        readonly get: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/networks.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/networks.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/networks.js").get$return>;
            then: <TResult1 = import("./modules/networks.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/networks.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/networks.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/networks.js").get$return>;
        };
        readonly updateMember: (data: {
            params: import("./modules/networks.js").updateMember$params;
            query?: undefined;
            body: import("./modules/networks.js").updateMember$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly setPrimary: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/networks.js").setPrimary$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static registries: {
        readonly type: {
            list$return: import("./modules/registries.js").list$return;
            create$body: import("./modules/registries.js").create$body;
            create$return: import("./modules/registries.js").create$return;
            makeDefault$params: import("./modules/registries.js").makeDefault$params;
            del$params: import("./modules/registries.js").del$params;
        };
        readonly list: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/registries.js").list$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/registries.js").list$return, any, {}, any>>;
            readonly data: Promise<import("./modules/registries.js").list$return>;
            then: <TResult1 = import("./modules/registries.js").list$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/registries.js").list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/registries.js").list$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/registries.js").list$return>;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/registries.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/registries.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/registries.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/registries.js").create$return>;
            then: <TResult1 = import("./modules/registries.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/registries.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/registries.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/registries.js").create$return>;
        };
        readonly makeDefault: (data: {
            params: import("./modules/registries.js").makeDefault$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/registries.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static servers: {
        readonly type: {
            count$query: import("./modules/servers.js").count$query;
            count$return: import("./modules/servers.js").count$return;
            get$params: import("./modules/servers.js").get$params;
            get$query: import("./modules/servers.js").get$query;
            get$return: import("./modules/servers.js").get$return;
            update$params: import("./modules/servers.js").update$params;
            update$body: import("./modules/servers.js").update$body;
            del$params: import("./modules/servers.js").del$params;
            agentRelease$return: import("./modules/servers.js").agentRelease$return;
            updateAgent$params: import("./modules/servers.js").updateAgent$params;
            accept$params: import("./modules/servers.js").accept$params;
            accept$body: import("./modules/servers.js").accept$body;
            reject$params: import("./modules/servers.js").reject$params;
            prepare$params: import("./modules/servers.js").prepare$params;
            prepare$return: import("./modules/servers.js").prepare$return;
            ping$params: import("./modules/servers.js").ping$params;
            ping$return: import("./modules/servers.js").ping$return;
            bootstrap$body: import("./modules/servers.js").bootstrap$body;
            bootstrap$return: import("./modules/servers.js").bootstrap$return;
            bootstrapProgress$params: import("./modules/servers.js").bootstrapProgress$params;
            bootstrapProgress$return: import("./modules/servers.js").bootstrapProgress$return;
            installCommand$return: import("./modules/servers.js").installCommand$return;
            liveness$return: import("./modules/servers.js").liveness$return;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/servers.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/servers.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/servers.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/servers.js").count$return>;
            then: <TResult1 = import("./modules/servers.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/servers.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/servers.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/servers.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/servers.js").get$params;
            query: import("./modules/servers.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/servers.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/servers.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/servers.js").get$return>;
            then: <TResult1 = import("./modules/servers.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/servers.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/servers.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/servers.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/servers.js").update$params;
            query?: undefined;
            body: import("./modules/servers.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/servers.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly agentRelease: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/servers.js").agentRelease$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/servers.js").agentRelease$return, any, {}, any>>;
            readonly data: Promise<import("./modules/servers.js").agentRelease$return>;
            then: <TResult1 = import("./modules/servers.js").agentRelease$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/servers.js").agentRelease$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/servers.js").agentRelease$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/servers.js").agentRelease$return>;
        };
        readonly updateAgent: (data: {
            params: import("./modules/servers.js").updateAgent$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly accept: (data: {
            params: import("./modules/servers.js").accept$params;
            query?: undefined;
            body: import("./modules/servers.js").accept$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly reject: (data: {
            params: import("./modules/servers.js").reject$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly prepare: (data: {
            params: import("./modules/servers.js").prepare$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/servers.js").prepare$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/servers.js").prepare$return, any, {}, any>>;
            readonly data: Promise<import("./modules/servers.js").prepare$return>;
            then: <TResult1 = import("./modules/servers.js").prepare$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/servers.js").prepare$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/servers.js").prepare$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/servers.js").prepare$return>;
        };
        readonly ping: (data: {
            params: import("./modules/servers.js").ping$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/servers.js").ping$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/servers.js").ping$return, any, {}, any>>;
            readonly data: Promise<import("./modules/servers.js").ping$return>;
            then: <TResult1 = import("./modules/servers.js").ping$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/servers.js").ping$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/servers.js").ping$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/servers.js").ping$return>;
        };
        readonly bootstrap: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/servers.js").bootstrap$body;
        } & import("./types.js").TRequestOptions<import("./modules/servers.js").bootstrap$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/servers.js").bootstrap$return, any, {}, any>>;
            readonly data: Promise<import("./modules/servers.js").bootstrap$return>;
            then: <TResult1 = import("./modules/servers.js").bootstrap$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/servers.js").bootstrap$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/servers.js").bootstrap$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/servers.js").bootstrap$return>;
        };
        readonly bootstrapProgress: (data: {
            params: import("./modules/servers.js").bootstrapProgress$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/servers.js").bootstrapProgress$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/servers.js").bootstrapProgress$return, any, {}, any>>;
            readonly data: Promise<import("./modules/servers.js").bootstrapProgress$return>;
            then: <TResult1 = import("./modules/servers.js").bootstrapProgress$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/servers.js").bootstrapProgress$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/servers.js").bootstrapProgress$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/servers.js").bootstrapProgress$return>;
        };
        readonly installCommand: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/servers.js").installCommand$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/servers.js").installCommand$return, any, {}, any>>;
            readonly data: Promise<import("./modules/servers.js").installCommand$return>;
            then: <TResult1 = import("./modules/servers.js").installCommand$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/servers.js").installCommand$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/servers.js").installCommand$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/servers.js").installCommand$return>;
        };
        readonly liveness: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/servers.js").liveness$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/servers.js").liveness$return, any, {}, any>>;
            readonly data: Promise<import("./modules/servers.js").liveness$return>;
            then: <TResult1 = import("./modules/servers.js").liveness$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/servers.js").liveness$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/servers.js").liveness$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/servers.js").liveness$return>;
        };
    };
    static storages: {
        readonly type: {
            list$return: import("./modules/storages.js").list$return;
            create$body: import("./modules/storages.js").create$body;
            create$return: import("./modules/storages.js").create$return;
            update$params: import("./modules/storages.js").update$params;
            update$body: import("./modules/storages.js").update$body;
            del$params: import("./modules/storages.js").del$params;
        };
        readonly list: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/storages.js").list$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/storages.js").list$return, any, {}, any>>;
            readonly data: Promise<import("./modules/storages.js").list$return>;
            then: <TResult1 = import("./modules/storages.js").list$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/storages.js").list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/storages.js").list$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/storages.js").list$return>;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/storages.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/storages.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/storages.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/storages.js").create$return>;
            then: <TResult1 = import("./modules/storages.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/storages.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/storages.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/storages.js").create$return>;
        };
        readonly update: (data: {
            params: import("./modules/storages.js").update$params;
            query?: undefined;
            body: import("./modules/storages.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/storages.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static streams: {
        readonly type: {
            openLogs$body: import("./modules/streams.js").openLogs$body;
            openLogs$return: import("./modules/streams.js").openLogs$return;
            openBuild$body: import("./modules/streams.js").openBuild$body;
            openBuild$return: import("./modules/streams.js").openBuild$return;
            openMetrics$body: import("./modules/streams.js").openMetrics$body;
            openMetrics$return: import("./modules/streams.js").openMetrics$return;
            openCapacity$body: import("./modules/streams.js").openCapacity$body;
            openCapacity$return: import("./modules/streams.js").openCapacity$return;
            openExec$body: import("./modules/streams.js").openExec$body;
            openExec$return: import("./modules/streams.js").openExec$return;
            openTerminal$body: import("./modules/streams.js").openTerminal$body;
            openTerminal$return: import("./modules/streams.js").openTerminal$return;
            openHostTerminal$body: import("./modules/streams.js").openHostTerminal$body;
            openHostTerminal$return: import("./modules/streams.js").openHostTerminal$return;
            input$params: import("./modules/streams.js").input$params;
            input$body: import("./modules/streams.js").input$body;
            read$params: import("./modules/streams.js").read$params;
            read$query: import("./modules/streams.js").read$query;
            read$return: import("./modules/streams.js").read$return;
            close$params: import("./modules/streams.js").close$params;
        };
        readonly openLogs: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/streams.js").openLogs$body;
        } & import("./types.js").TRequestOptions<import("./modules/streams.js").openLogs$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/streams.js").openLogs$return, any, {}, any>>;
            readonly data: Promise<import("./modules/streams.js").openLogs$return>;
            then: <TResult1 = import("./modules/streams.js").openLogs$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/streams.js").openLogs$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/streams.js").openLogs$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/streams.js").openLogs$return>;
        };
        readonly openBuild: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/streams.js").openBuild$body;
        } & import("./types.js").TRequestOptions<import("./modules/streams.js").openBuild$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/streams.js").openBuild$return, any, {}, any>>;
            readonly data: Promise<import("./modules/streams.js").openBuild$return>;
            then: <TResult1 = import("./modules/streams.js").openBuild$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/streams.js").openBuild$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/streams.js").openBuild$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/streams.js").openBuild$return>;
        };
        readonly openMetrics: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/streams.js").openMetrics$body;
        } & import("./types.js").TRequestOptions<import("./modules/streams.js").openMetrics$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/streams.js").openMetrics$return, any, {}, any>>;
            readonly data: Promise<import("./modules/streams.js").openMetrics$return>;
            then: <TResult1 = import("./modules/streams.js").openMetrics$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/streams.js").openMetrics$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/streams.js").openMetrics$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/streams.js").openMetrics$return>;
        };
        readonly openCapacity: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/streams.js").openCapacity$body;
        } & import("./types.js").TRequestOptions<import("./modules/streams.js").openCapacity$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/streams.js").openCapacity$return, any, {}, any>>;
            readonly data: Promise<import("./modules/streams.js").openCapacity$return>;
            then: <TResult1 = import("./modules/streams.js").openCapacity$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/streams.js").openCapacity$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/streams.js").openCapacity$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/streams.js").openCapacity$return>;
        };
        readonly openExec: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/streams.js").openExec$body;
        } & import("./types.js").TRequestOptions<import("./modules/streams.js").openExec$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/streams.js").openExec$return, any, {}, any>>;
            readonly data: Promise<import("./modules/streams.js").openExec$return>;
            then: <TResult1 = import("./modules/streams.js").openExec$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/streams.js").openExec$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/streams.js").openExec$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/streams.js").openExec$return>;
        };
        readonly openTerminal: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/streams.js").openTerminal$body;
        } & import("./types.js").TRequestOptions<import("./modules/streams.js").openTerminal$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/streams.js").openTerminal$return, any, {}, any>>;
            readonly data: Promise<import("./modules/streams.js").openTerminal$return>;
            then: <TResult1 = import("./modules/streams.js").openTerminal$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/streams.js").openTerminal$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/streams.js").openTerminal$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/streams.js").openTerminal$return>;
        };
        readonly openHostTerminal: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/streams.js").openHostTerminal$body;
        } & import("./types.js").TRequestOptions<import("./modules/streams.js").openHostTerminal$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/streams.js").openHostTerminal$return, any, {}, any>>;
            readonly data: Promise<import("./modules/streams.js").openHostTerminal$return>;
            then: <TResult1 = import("./modules/streams.js").openHostTerminal$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/streams.js").openHostTerminal$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/streams.js").openHostTerminal$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/streams.js").openHostTerminal$return>;
        };
        readonly input: (data: {
            params: import("./modules/streams.js").input$params;
            query?: undefined;
            body: import("./modules/streams.js").input$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly read: (data: {
            params: import("./modules/streams.js").read$params;
            query: import("./modules/streams.js").read$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/streams.js").read$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/streams.js").read$return, any, {}, any>>;
            readonly data: Promise<import("./modules/streams.js").read$return>;
            then: <TResult1 = import("./modules/streams.js").read$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/streams.js").read$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/streams.js").read$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/streams.js").read$return>;
        };
        readonly close: (data: {
            params: import("./modules/streams.js").close$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static alertEvents: {
        readonly type: {
            list$query: import("./modules/alertEvents.js").list$query;
            list$return: import("./modules/alertEvents.js").list$return;
        };
        readonly list: (data: {
            params?: undefined;
            query: import("./modules/alertEvents.js").list$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/alertEvents.js").list$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/alertEvents.js").list$return, any, {}, any>>;
            readonly data: Promise<import("./modules/alertEvents.js").list$return>;
            then: <TResult1 = import("./modules/alertEvents.js").list$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/alertEvents.js").list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/alertEvents.js").list$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/alertEvents.js").list$return>;
        };
    };
    static alertRules: {
        readonly type: {
            list$return: import("./modules/alertRules.js").list$return;
            create$body: import("./modules/alertRules.js").create$body;
            create$return: import("./modules/alertRules.js").create$return;
            update$params: import("./modules/alertRules.js").update$params;
            update$body: import("./modules/alertRules.js").update$body;
            del$params: import("./modules/alertRules.js").del$params;
        };
        readonly list: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/alertRules.js").list$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/alertRules.js").list$return, any, {}, any>>;
            readonly data: Promise<import("./modules/alertRules.js").list$return>;
            then: <TResult1 = import("./modules/alertRules.js").list$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/alertRules.js").list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/alertRules.js").list$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/alertRules.js").list$return>;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/alertRules.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/alertRules.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/alertRules.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/alertRules.js").create$return>;
            then: <TResult1 = import("./modules/alertRules.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/alertRules.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/alertRules.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/alertRules.js").create$return>;
        };
        readonly update: (data: {
            params: import("./modules/alertRules.js").update$params;
            query?: undefined;
            body: import("./modules/alertRules.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/alertRules.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static wellKnown: {
        readonly type: {
            oauthServerMeta$params: import("./modules/.well-known.js").oauthServerMeta$params;
            openidConfig$params: import("./modules/.well-known.js").openidConfig$params;
        };
        readonly oauthServerMeta: (data: {
            params: import("./modules/.well-known.js").oauthServerMeta$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly openidConfig: (data: {
            params: import("./modules/.well-known.js").openidConfig$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static accessControl: {
        readonly type: {
            create$body: import("./modules/accessControl.js").create$body;
            create$return: import("./modules/accessControl.js").create$return;
            count$query: import("./modules/accessControl.js").count$query;
            count$return: import("./modules/accessControl.js").count$return;
            get$params: import("./modules/accessControl.js").get$params;
            get$query: import("./modules/accessControl.js").get$query;
            get$return: import("./modules/accessControl.js").get$return;
            update$params: import("./modules/accessControl.js").update$params;
            update$body: import("./modules/accessControl.js").update$body;
            del$params: import("./modules/accessControl.js").del$params;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/accessControl.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/accessControl.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/accessControl.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/accessControl.js").create$return>;
            then: <TResult1 = import("./modules/accessControl.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/accessControl.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/accessControl.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/accessControl.js").create$return>;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/accessControl.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/accessControl.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/accessControl.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/accessControl.js").count$return>;
            then: <TResult1 = import("./modules/accessControl.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/accessControl.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/accessControl.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/accessControl.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/accessControl.js").get$params;
            query: import("./modules/accessControl.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/accessControl.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/accessControl.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/accessControl.js").get$return>;
            then: <TResult1 = import("./modules/accessControl.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/accessControl.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/accessControl.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/accessControl.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/accessControl.js").update$params;
            query?: undefined;
            body: import("./modules/accessControl.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/accessControl.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static accessControlPolicies: {
        readonly type: {
            myPolicies$return: import("./modules/accessControlPolicies.js").myPolicies$return;
            create$body: import("./modules/accessControlPolicies.js").create$body;
            create$return: import("./modules/accessControlPolicies.js").create$return;
            count$query: import("./modules/accessControlPolicies.js").count$query;
            count$return: import("./modules/accessControlPolicies.js").count$return;
            get$params: import("./modules/accessControlPolicies.js").get$params;
            get$query: import("./modules/accessControlPolicies.js").get$query;
            get$return: import("./modules/accessControlPolicies.js").get$return;
            update$params: import("./modules/accessControlPolicies.js").update$params;
            update$body: import("./modules/accessControlPolicies.js").update$body;
            del$params: import("./modules/accessControlPolicies.js").del$params;
        };
        readonly myPolicies: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/accessControlPolicies.js").myPolicies$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/accessControlPolicies.js").myPolicies$return, any, {}, any>>;
            readonly data: Promise<import("./modules/accessControlPolicies.js").myPolicies$return>;
            then: <TResult1 = import("./modules/accessControlPolicies.js").myPolicies$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/accessControlPolicies.js").myPolicies$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/accessControlPolicies.js").myPolicies$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/accessControlPolicies.js").myPolicies$return>;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/accessControlPolicies.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/accessControlPolicies.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/accessControlPolicies.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/accessControlPolicies.js").create$return>;
            then: <TResult1 = import("./modules/accessControlPolicies.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/accessControlPolicies.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/accessControlPolicies.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/accessControlPolicies.js").create$return>;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/accessControlPolicies.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/accessControlPolicies.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/accessControlPolicies.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/accessControlPolicies.js").count$return>;
            then: <TResult1 = import("./modules/accessControlPolicies.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/accessControlPolicies.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/accessControlPolicies.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/accessControlPolicies.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/accessControlPolicies.js").get$params;
            query: import("./modules/accessControlPolicies.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/accessControlPolicies.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/accessControlPolicies.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/accessControlPolicies.js").get$return>;
            then: <TResult1 = import("./modules/accessControlPolicies.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/accessControlPolicies.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/accessControlPolicies.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/accessControlPolicies.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/accessControlPolicies.js").update$params;
            query?: undefined;
            body: import("./modules/accessControlPolicies.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/accessControlPolicies.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static apiKeys: {
        readonly type: {
            create$body: import("./modules/apiKeys.js").create$body;
            create$return: import("./modules/apiKeys.js").create$return;
            count$query: import("./modules/apiKeys.js").count$query;
            count$return: import("./modules/apiKeys.js").count$return;
            get$params: import("./modules/apiKeys.js").get$params;
            get$query: import("./modules/apiKeys.js").get$query;
            get$return: import("./modules/apiKeys.js").get$return;
            update$params: import("./modules/apiKeys.js").update$params;
            update$body: import("./modules/apiKeys.js").update$body;
            del$params: import("./modules/apiKeys.js").del$params;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/apiKeys.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/apiKeys.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/apiKeys.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/apiKeys.js").create$return>;
            then: <TResult1 = import("./modules/apiKeys.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/apiKeys.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/apiKeys.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/apiKeys.js").create$return>;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/apiKeys.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/apiKeys.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/apiKeys.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/apiKeys.js").count$return>;
            then: <TResult1 = import("./modules/apiKeys.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/apiKeys.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/apiKeys.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/apiKeys.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/apiKeys.js").get$params;
            query: import("./modules/apiKeys.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/apiKeys.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/apiKeys.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/apiKeys.js").get$return>;
            then: <TResult1 = import("./modules/apiKeys.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/apiKeys.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/apiKeys.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/apiKeys.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/apiKeys.js").update$params;
            query?: undefined;
            body: import("./modules/apiKeys.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/apiKeys.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static auth: {
        readonly type: {
            branding$return: import("./modules/auth.js").branding$return;
            capabilities$return: import("./modules/auth.js").capabilities$return;
            handleAuth$params: import("./modules/auth.js").handleAuth$params;
            betterAuthUI$params: import("./modules/auth.js").betterAuthUI$params;
        };
        readonly branding: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/auth.js").branding$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/auth.js").branding$return, any, {}, any>>;
            readonly data: Promise<import("./modules/auth.js").branding$return>;
            then: <TResult1 = import("./modules/auth.js").branding$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/auth.js").branding$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/auth.js").branding$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/auth.js").branding$return>;
        };
        readonly capabilities: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/auth.js").capabilities$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/auth.js").capabilities$return, any, {}, any>>;
            readonly data: Promise<import("./modules/auth.js").capabilities$return>;
            then: <TResult1 = import("./modules/auth.js").capabilities$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/auth.js").capabilities$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/auth.js").capabilities$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/auth.js").capabilities$return>;
        };
        readonly handleAuth: (data: {
            params: import("./modules/auth.js").handleAuth$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly betterAuthUI: (data: {
            params: import("./modules/auth.js").betterAuthUI$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static envs: {
        readonly type: {
            create$body: import("./modules/envs.js").create$body;
            create$return: import("./modules/envs.js").create$return;
            count$query: import("./modules/envs.js").count$query;
            count$return: import("./modules/envs.js").count$return;
            get$params: import("./modules/envs.js").get$params;
            get$query: import("./modules/envs.js").get$query;
            get$return: import("./modules/envs.js").get$return;
            update$params: import("./modules/envs.js").update$params;
            update$body: import("./modules/envs.js").update$body;
            del$params: import("./modules/envs.js").del$params;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/envs.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/envs.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/envs.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/envs.js").create$return>;
            then: <TResult1 = import("./modules/envs.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/envs.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/envs.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/envs.js").create$return>;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/envs.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/envs.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/envs.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/envs.js").count$return>;
            then: <TResult1 = import("./modules/envs.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/envs.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/envs.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/envs.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/envs.js").get$params;
            query: import("./modules/envs.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/envs.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/envs.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/envs.js").get$return>;
            then: <TResult1 = import("./modules/envs.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/envs.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/envs.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/envs.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/envs.js").update$params;
            query?: undefined;
            body: import("./modules/envs.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/envs.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static imageKit: {
        readonly type: {
            auth$return: import("./modules/imagekit.js").auth$return;
        };
        readonly auth: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/imagekit.js").auth$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/imagekit.js").auth$return, any, {}, any>>;
            readonly data: Promise<import("./modules/imagekit.js").auth$return>;
            then: <TResult1 = import("./modules/imagekit.js").auth$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/imagekit.js").auth$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/imagekit.js").auth$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/imagekit.js").auth$return>;
        };
    };
    static me: {
        readonly type: {
            get$return: import("./modules/me.js").get$return;
            setPhoneNumber$body: import("./modules/me.js").setPhoneNumber$body;
            verifyPhoneNumber$body: import("./modules/me.js").verifyPhoneNumber$body;
        };
        readonly get: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/me.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/me.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/me.js").get$return>;
            then: <TResult1 = import("./modules/me.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/me.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/me.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/me.js").get$return>;
        };
        readonly setPhoneNumber: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/me.js").setPhoneNumber$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly verifyPhoneNumber: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/me.js").verifyPhoneNumber$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static oauth: {
        readonly type: {
            authorize$query: import("./modules/oauth.js").authorize$query;
            consent$query: import("./modules/oauth.js").consent$query;
            consent$body: import("./modules/oauth.js").consent$body;
            consent$return: import("./modules/oauth.js").consent$return;
            token$body: import("./modules/oauth.js").token$body;
            token$return: import("./modules/oauth.js").token$return;
            revoke$body: import("./modules/oauth.js").revoke$body;
        };
        readonly authorize: (data: {
            params?: undefined;
            query: import("./modules/oauth.js").authorize$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly consent: (data: {
            params?: undefined;
            query: import("./modules/oauth.js").consent$query;
            body: import("./modules/oauth.js").consent$body;
        } & import("./types.js").TRequestOptions<import("./modules/oauth.js").consent$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/oauth.js").consent$return, any, {}, any>>;
            readonly data: Promise<import("./modules/oauth.js").consent$return>;
            then: <TResult1 = import("./modules/oauth.js").consent$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/oauth.js").consent$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/oauth.js").consent$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/oauth.js").consent$return>;
        };
        readonly token: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/oauth.js").token$body;
        } & import("./types.js").TRequestOptions<import("./modules/oauth.js").token$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/oauth.js").token$return, any, {}, any>>;
            readonly data: Promise<import("./modules/oauth.js").token$return>;
            then: <TResult1 = import("./modules/oauth.js").token$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/oauth.js").token$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/oauth.js").token$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/oauth.js").token$return>;
        };
        readonly revoke: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/oauth.js").revoke$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly jwks: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static oauthClients: {
        readonly type: {
            create$body: import("./modules/oauthClients.js").create$body;
            create$return: import("./modules/oauthClients.js").create$return;
            count$query: import("./modules/oauthClients.js").count$query;
            count$return: import("./modules/oauthClients.js").count$return;
            get$params: import("./modules/oauthClients.js").get$params;
            get$query: import("./modules/oauthClients.js").get$query;
            get$return: import("./modules/oauthClients.js").get$return;
            update$params: import("./modules/oauthClients.js").update$params;
            update$body: import("./modules/oauthClients.js").update$body;
            del$params: import("./modules/oauthClients.js").del$params;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/oauthClients.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/oauthClients.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/oauthClients.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/oauthClients.js").create$return>;
            then: <TResult1 = import("./modules/oauthClients.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/oauthClients.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/oauthClients.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/oauthClients.js").create$return>;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/oauthClients.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/oauthClients.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/oauthClients.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/oauthClients.js").count$return>;
            then: <TResult1 = import("./modules/oauthClients.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/oauthClients.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/oauthClients.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/oauthClients.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/oauthClients.js").get$params;
            query: import("./modules/oauthClients.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/oauthClients.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/oauthClients.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/oauthClients.js").get$return>;
            then: <TResult1 = import("./modules/oauthClients.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/oauthClients.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/oauthClients.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/oauthClients.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/oauthClients.js").update$params;
            query?: undefined;
            body: import("./modules/oauthClients.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/oauthClients.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static tenantInvites: {
        readonly type: {
            create$body: import("./modules/tenantInvites.js").create$body;
            create$return: import("./modules/tenantInvites.js").create$return;
            count$query: import("./modules/tenantInvites.js").count$query;
            count$return: import("./modules/tenantInvites.js").count$return;
            get$params: import("./modules/tenantInvites.js").get$params;
            get$query: import("./modules/tenantInvites.js").get$query;
            get$return: import("./modules/tenantInvites.js").get$return;
            update$params: import("./modules/tenantInvites.js").update$params;
            update$body: import("./modules/tenantInvites.js").update$body;
            del$params: import("./modules/tenantInvites.js").del$params;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/tenantInvites.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/tenantInvites.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/tenantInvites.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/tenantInvites.js").create$return>;
            then: <TResult1 = import("./modules/tenantInvites.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/tenantInvites.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/tenantInvites.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/tenantInvites.js").create$return>;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/tenantInvites.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/tenantInvites.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/tenantInvites.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/tenantInvites.js").count$return>;
            then: <TResult1 = import("./modules/tenantInvites.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/tenantInvites.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/tenantInvites.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/tenantInvites.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/tenantInvites.js").get$params;
            query: import("./modules/tenantInvites.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/tenantInvites.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/tenantInvites.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/tenantInvites.js").get$return>;
            then: <TResult1 = import("./modules/tenantInvites.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/tenantInvites.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/tenantInvites.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/tenantInvites.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/tenantInvites.js").update$params;
            query?: undefined;
            body: import("./modules/tenantInvites.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/tenantInvites.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
    };
    static tenantMembers: {
        readonly type: {
            count$query: import("./modules/tenantMembers.js").count$query;
            count$return: import("./modules/tenantMembers.js").count$return;
            get$params: import("./modules/tenantMembers.js").get$params;
            get$query: import("./modules/tenantMembers.js").get$query;
            get$return: import("./modules/tenantMembers.js").get$return;
            update$params: import("./modules/tenantMembers.js").update$params;
            update$body: import("./modules/tenantMembers.js").update$body;
            del$params: import("./modules/tenantMembers.js").del$params;
            create$body: import("./modules/tenantMembers.js").create$body;
            create$return: import("./modules/tenantMembers.js").create$return;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/tenantMembers.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/tenantMembers.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/tenantMembers.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/tenantMembers.js").count$return>;
            then: <TResult1 = import("./modules/tenantMembers.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/tenantMembers.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/tenantMembers.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/tenantMembers.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/tenantMembers.js").get$params;
            query: import("./modules/tenantMembers.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/tenantMembers.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/tenantMembers.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/tenantMembers.js").get$return>;
            then: <TResult1 = import("./modules/tenantMembers.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/tenantMembers.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/tenantMembers.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/tenantMembers.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/tenantMembers.js").update$params;
            query?: undefined;
            body: import("./modules/tenantMembers.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/tenantMembers.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/tenantMembers.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/tenantMembers.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/tenantMembers.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/tenantMembers.js").create$return>;
            then: <TResult1 = import("./modules/tenantMembers.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/tenantMembers.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/tenantMembers.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/tenantMembers.js").create$return>;
        };
    };
    static tenantMemberships: {
        readonly type: {
            get$params: import("./modules/tenantMemberships.js").get$params;
            get$query: import("./modules/tenantMemberships.js").get$query;
            get$return: import("./modules/tenantMemberships.js").get$return;
        };
        readonly get: (data: {
            params: import("./modules/tenantMemberships.js").get$params;
            query: import("./modules/tenantMemberships.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/tenantMemberships.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/tenantMemberships.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/tenantMemberships.js").get$return>;
            then: <TResult1 = import("./modules/tenantMemberships.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/tenantMemberships.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/tenantMemberships.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/tenantMemberships.js").get$return>;
        };
    };
    static tenants: {
        readonly type: {
            count$query: import("./modules/tenants.js").count$query;
            count$return: import("./modules/tenants.js").count$return;
            get$params: import("./modules/tenants.js").get$params;
            get$query: import("./modules/tenants.js").get$query;
            get$return: import("./modules/tenants.js").get$return;
            update$params: import("./modules/tenants.js").update$params;
            update$body: import("./modules/tenants.js").update$body;
            del$params: import("./modules/tenants.js").del$params;
            create$body: import("./modules/tenants.js").create$body;
            create$return: import("./modules/tenants.js").create$return;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/tenants.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/tenants.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/tenants.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/tenants.js").count$return>;
            then: <TResult1 = import("./modules/tenants.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/tenants.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/tenants.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/tenants.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/tenants.js").get$params;
            query: import("./modules/tenants.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/tenants.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/tenants.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/tenants.js").get$return>;
            then: <TResult1 = import("./modules/tenants.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/tenants.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/tenants.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/tenants.js").get$return>;
        };
        readonly update: (data: {
            params: import("./modules/tenants.js").update$params;
            query?: undefined;
            body: import("./modules/tenants.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly del: (data: {
            params: import("./modules/tenants.js").del$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/tenants.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/tenants.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/tenants.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/tenants.js").create$return>;
            then: <TResult1 = import("./modules/tenants.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/tenants.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/tenants.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/tenants.js").create$return>;
        };
    };
    static users: {
        readonly type: {
            create$body: import("./modules/users.js").create$body;
            create$return: import("./modules/users.js").create$return;
            update$params: import("./modules/users.js").update$params;
            update$body: import("./modules/users.js").update$body;
            ban$params: import("./modules/users.js").ban$params;
            ban$body: import("./modules/users.js").ban$body;
            addFcmToken$body: import("./modules/users.js").addFcmToken$body;
            addFcmToken$return: import("./modules/users.js").addFcmToken$return;
            getUserTenants$params: import("./modules/users.js").getUserTenants$params;
            getUserTenants$return: import("./modules/users.js").getUserTenants$return;
            count$query: import("./modules/users.js").count$query;
            count$return: import("./modules/users.js").count$return;
            get$params: import("./modules/users.js").get$params;
            get$query: import("./modules/users.js").get$query;
            get$return: import("./modules/users.js").get$return;
        };
        readonly create: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/users.js").create$body;
        } & import("./types.js").TRequestOptions<import("./modules/users.js").create$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/users.js").create$return, any, {}, any>>;
            readonly data: Promise<import("./modules/users.js").create$return>;
            then: <TResult1 = import("./modules/users.js").create$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/users.js").create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/users.js").create$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/users.js").create$return>;
        };
        readonly update: (data: {
            params: import("./modules/users.js").update$params;
            query?: undefined;
            body: import("./modules/users.js").update$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly ban: (data: {
            params: import("./modules/users.js").ban$params;
            query?: undefined;
            body: import("./modules/users.js").ban$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly addFcmToken: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/users.js").addFcmToken$body;
        } & import("./types.js").TRequestOptions<import("./modules/users.js").addFcmToken$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/users.js").addFcmToken$return, any, {}, any>>;
            readonly data: Promise<import("./modules/users.js").addFcmToken$return>;
            then: <TResult1 = import("./modules/users.js").addFcmToken$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/users.js").addFcmToken$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/users.js").addFcmToken$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/users.js").addFcmToken$return>;
        };
        readonly getUserTenants: (data: {
            params: import("./modules/users.js").getUserTenants$params;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/users.js").getUserTenants$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/users.js").getUserTenants$return, any, {}, any>>;
            readonly data: Promise<import("./modules/users.js").getUserTenants$return>;
            then: <TResult1 = import("./modules/users.js").getUserTenants$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/users.js").getUserTenants$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/users.js").getUserTenants$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/users.js").getUserTenants$return>;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/users.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/users.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/users.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/users.js").count$return>;
            then: <TResult1 = import("./modules/users.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/users.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/users.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/users.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/users.js").get$params;
            query: import("./modules/users.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/users.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/users.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/users.js").get$return>;
            then: <TResult1 = import("./modules/users.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/users.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/users.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/users.js").get$return>;
        };
    };
    static walletLedgers: {
        readonly type: {
            count$query: import("./modules/walletLedgers.js").count$query;
            count$return: import("./modules/walletLedgers.js").count$return;
            get$params: import("./modules/walletLedgers.js").get$params;
            get$query: import("./modules/walletLedgers.js").get$query;
            get$return: import("./modules/walletLedgers.js").get$return;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/walletLedgers.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/walletLedgers.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/walletLedgers.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/walletLedgers.js").count$return>;
            then: <TResult1 = import("./modules/walletLedgers.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/walletLedgers.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/walletLedgers.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/walletLedgers.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/walletLedgers.js").get$params;
            query: import("./modules/walletLedgers.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/walletLedgers.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/walletLedgers.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/walletLedgers.js").get$return>;
            then: <TResult1 = import("./modules/walletLedgers.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/walletLedgers.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/walletLedgers.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/walletLedgers.js").get$return>;
        };
    };
    static wallets: {
        readonly type: {
            metadata$return: import("./modules/wallets.js").metadata$return;
            signTransfer$query: import("./modules/wallets.js").signTransfer$query;
            signTransfer$return: import("./modules/wallets.js").signTransfer$return;
            transfer$body: import("./modules/wallets.js").transfer$body;
            transfer$return: import("./modules/wallets.js").transfer$return;
            updateOverdraftLimit$body: import("./modules/wallets.js").updateOverdraftLimit$body;
            getOverdraftLimit$query: import("./modules/wallets.js").getOverdraftLimit$query;
            getOverdraftLimit$return: import("./modules/wallets.js").getOverdraftLimit$return;
            count$query: import("./modules/wallets.js").count$query;
            count$return: import("./modules/wallets.js").count$return;
            get$params: import("./modules/wallets.js").get$params;
            get$query: import("./modules/wallets.js").get$query;
            get$return: import("./modules/wallets.js").get$return;
        };
        readonly metadata: (data?: {
            params?: undefined;
            query?: undefined;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/wallets.js").metadata$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/wallets.js").metadata$return, any, {}, any>>;
            readonly data: Promise<import("./modules/wallets.js").metadata$return>;
            then: <TResult1 = import("./modules/wallets.js").metadata$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/wallets.js").metadata$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/wallets.js").metadata$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/wallets.js").metadata$return>;
        };
        readonly signTransfer: (data: {
            params?: undefined;
            query: import("./modules/wallets.js").signTransfer$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/wallets.js").signTransfer$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/wallets.js").signTransfer$return, any, {}, any>>;
            readonly data: Promise<import("./modules/wallets.js").signTransfer$return>;
            then: <TResult1 = import("./modules/wallets.js").signTransfer$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/wallets.js").signTransfer$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/wallets.js").signTransfer$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/wallets.js").signTransfer$return>;
        };
        readonly transfer: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/wallets.js").transfer$body;
        } & import("./types.js").TRequestOptions<import("./modules/wallets.js").transfer$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/wallets.js").transfer$return, any, {}, any>>;
            readonly data: Promise<import("./modules/wallets.js").transfer$return>;
            then: <TResult1 = import("./modules/wallets.js").transfer$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/wallets.js").transfer$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/wallets.js").transfer$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/wallets.js").transfer$return>;
        };
        readonly updateOverdraftLimit: (data: {
            params?: undefined;
            query?: undefined;
            body: import("./modules/wallets.js").updateOverdraftLimit$body;
        } & import("./types.js").TRequestOptions<unknown>) => {
            readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
            readonly data: Promise<unknown>;
            then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
        };
        readonly getOverdraftLimit: (data: {
            params?: undefined;
            query: import("./modules/wallets.js").getOverdraftLimit$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/wallets.js").getOverdraftLimit$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/wallets.js").getOverdraftLimit$return, any, {}, any>>;
            readonly data: Promise<import("./modules/wallets.js").getOverdraftLimit$return>;
            then: <TResult1 = import("./modules/wallets.js").getOverdraftLimit$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/wallets.js").getOverdraftLimit$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/wallets.js").getOverdraftLimit$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/wallets.js").getOverdraftLimit$return>;
        };
        readonly count: (data: {
            params?: undefined;
            query: import("./modules/wallets.js").count$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/wallets.js").count$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/wallets.js").count$return, any, {}, any>>;
            readonly data: Promise<import("./modules/wallets.js").count$return>;
            then: <TResult1 = import("./modules/wallets.js").count$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/wallets.js").count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/wallets.js").count$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/wallets.js").count$return>;
        };
        readonly get: (data: {
            params: import("./modules/wallets.js").get$params;
            query: import("./modules/wallets.js").get$query;
            body?: undefined;
        } & import("./types.js").TRequestOptions<import("./modules/wallets.js").get$return>) => {
            readonly raw: Promise<import("axios").AxiosResponse<import("./modules/wallets.js").get$return, any, {}, any>>;
            readonly data: Promise<import("./modules/wallets.js").get$return>;
            then: <TResult1 = import("./modules/wallets.js").get$return, TResult2 = never>(onfulfilled?: ((value: import("./modules/wallets.js").get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<import("./modules/wallets.js").get$return | TResult>;
            finally: (onfinally?: (() => void) | null | undefined) => Promise<import("./modules/wallets.js").get$return>;
        };
    };
    static plugins: {
        essentials: typeof essentialsEntry;
    };
    static getModuleNames(): string[];
    static getModule(name: string): Record<string, (data: unknown) => Promise<unknown>>;
    static hasModule(name: string): boolean;
    static getMetadata(module: object | string): Record<string, unknown> | undefined;
    static hasMetadata(module: object | string): boolean;
    static getGroup(module: object | string): string | undefined;
    static hasGroup(module: object | string): boolean;
    static listActions(moduleName?: string): string[];
}
