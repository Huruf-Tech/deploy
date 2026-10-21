import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type openLogs$body = {
    server?: string;
    container: string;
    tail?: number;
    /** e.g. 10m */
    since?: string | undefined;
};
export type openLogs$return = {
    session: string;
};
export type openMetrics$body = {
    server?: string;
};
export type openMetrics$return = {
    session: string;
};
export type openExec$body = {
    server?: string;
    container: string;
    command: string[];
};
export type openExec$return = {
    session: string;
};
export type openTerminal$body = {
    server?: string;
    container: string;
    cols?: number;
    rows?: number;
};
export type openTerminal$return = {
    session: string;
};
export type openHostTerminal$body = {
    server?: string;
    cols?: number;
    rows?: number;
};
export type openHostTerminal$return = {
    session: string;
};
export type input$params = {
    id?: string;
};
export type input$body = {
    items: {
        seq: number;
        data?: string | undefined;
        cols?: number | undefined;
        rows?: number | undefined;
    }[];
};
export type read$params = {
    id?: string;
};
export type read$query = {
    after?: number;
};
export type read$return = {
    chunks: {
        seq: number;
        data: string;
        done?: boolean | undefined;
        error?: string | undefined;
    }[];
};
export type close$params = {
    id?: string;
};
export declare const streamsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        openLogs$body: openLogs$body;
        openLogs$return: openLogs$return;
        openMetrics$body: openMetrics$body;
        openMetrics$return: openMetrics$return;
        openExec$body: openExec$body;
        openExec$return: openExec$return;
        openTerminal$body: openTerminal$body;
        openTerminal$return: openTerminal$return;
        openHostTerminal$body: openHostTerminal$body;
        openHostTerminal$return: openHostTerminal$return;
        input$params: input$params;
        input$body: input$body;
        read$params: read$params;
        read$query: read$query;
        read$return: read$return;
        close$params: close$params;
    };
    readonly openLogs: (data: {
        params?: undefined;
        query?: undefined;
        body: openLogs$body;
    } & TRequestOptions<openLogs$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<openLogs$return, any, {}, any>>;
        readonly data: Promise<openLogs$return>;
        then: <TResult1 = openLogs$return, TResult2 = never>(onfulfilled?: ((value: openLogs$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<openLogs$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<openLogs$return>;
    };
    readonly openMetrics: (data: {
        params?: undefined;
        query?: undefined;
        body: openMetrics$body;
    } & TRequestOptions<openMetrics$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<openMetrics$return, any, {}, any>>;
        readonly data: Promise<openMetrics$return>;
        then: <TResult1 = openMetrics$return, TResult2 = never>(onfulfilled?: ((value: openMetrics$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<openMetrics$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<openMetrics$return>;
    };
    readonly openExec: (data: {
        params?: undefined;
        query?: undefined;
        body: openExec$body;
    } & TRequestOptions<openExec$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<openExec$return, any, {}, any>>;
        readonly data: Promise<openExec$return>;
        then: <TResult1 = openExec$return, TResult2 = never>(onfulfilled?: ((value: openExec$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<openExec$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<openExec$return>;
    };
    readonly openTerminal: (data: {
        params?: undefined;
        query?: undefined;
        body: openTerminal$body;
    } & TRequestOptions<openTerminal$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<openTerminal$return, any, {}, any>>;
        readonly data: Promise<openTerminal$return>;
        then: <TResult1 = openTerminal$return, TResult2 = never>(onfulfilled?: ((value: openTerminal$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<openTerminal$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<openTerminal$return>;
    };
    readonly openHostTerminal: (data: {
        params?: undefined;
        query?: undefined;
        body: openHostTerminal$body;
    } & TRequestOptions<openHostTerminal$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<openHostTerminal$return, any, {}, any>>;
        readonly data: Promise<openHostTerminal$return>;
        then: <TResult1 = openHostTerminal$return, TResult2 = never>(onfulfilled?: ((value: openHostTerminal$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<openHostTerminal$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<openHostTerminal$return>;
    };
    readonly input: (data: {
        params: input$params;
        query?: undefined;
        body: input$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly read: (data: {
        params: read$params;
        query: read$query;
        body?: undefined;
    } & TRequestOptions<read$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<read$return, any, {}, any>>;
        readonly data: Promise<read$return>;
        then: <TResult1 = read$return, TResult2 = never>(onfulfilled?: ((value: read$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<read$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<read$return>;
    };
    readonly close: (data: {
        params: close$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
};
