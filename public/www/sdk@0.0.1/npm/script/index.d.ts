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
    static streams: {
        readonly type: {
            openLogs$body: import("./modules/streams.js").openLogs$body;
            openLogs$return: import("./modules/streams.js").openLogs$return;
            openMetrics$body: import("./modules/streams.js").openMetrics$body;
            openMetrics$return: import("./modules/streams.js").openMetrics$return;
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
