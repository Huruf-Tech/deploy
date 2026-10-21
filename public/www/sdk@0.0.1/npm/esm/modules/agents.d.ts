import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type hello$body = {
    tenant: string;
    /** Ed25519, raw, base64url */
    signPublicKey: string;
    /** X25519, raw, base64url */
    boxPublicKey: string;
    inventory: {
        hostname: string;
        os: string;
        arch: "amd64" | "arm64";
        cpuCores: number;
        /** Bytes */
        memory: number;
        /** Bytes */
        disk: number;
        publicIp?: string | undefined;
        privateIp?: string | undefined;
        dockerVersion?: string | undefined;
        agentVersion: string;
    };
};
export type hello$return = {
    version: string;
    config: {
        poll: {
            idleMs: number;
            activeMs: number;
            terminalMs: number;
        };
        jitterPercent: number;
        summaryIntervalMs: number;
        maxBackoffMs: number;
    };
    server: string;
    status: "pending" | "active" | "rejected";
    pairingCode?: string | undefined;
    pairingExpiresAt?: string | undefined;
    nextPollMs: number;
};
export type poll$body = {
    commandCursor: number;
    appliedVersion?: number;
    /** Sent at most every 60 s, or on a >10% change */
    summary?: {
        /** Used fraction */
        cpu: number;
        memFree: number;
        diskFree: number;
    } | undefined;
};
export type poll$return = {
    nextPollMs: number;
    configVersion: string;
    commands: {
        seq: number;
        type: "ping";
        payload: Record<string, unknown>;
    }[];
};
export type config$return = {
    version: string;
    config: {
        poll: {
            idleMs: number;
            activeMs: number;
            terminalMs: number;
        };
        jitterPercent: number;
        summaryIntervalMs: number;
        maxBackoffMs: number;
    };
};
export type events$body = {
    events: ({
        id: string;
        type: "command.result";
        data: {
            seq: number;
            ok: boolean;
            result?: Record<string, unknown> | undefined;
            error?: string | undefined;
        };
    })[];
};
export type events$return = {
    applied: number;
};
export declare const agentsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        hello$body: hello$body;
        hello$return: hello$return;
        poll$body: poll$body;
        poll$return: poll$return;
        config$return: config$return;
        events$body: events$body;
        events$return: events$return;
    };
    readonly hello: (data: {
        params?: undefined;
        query?: undefined;
        body: hello$body;
    } & TRequestOptions<hello$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<hello$return, any, {}, any>>;
        readonly data: Promise<hello$return>;
        then: <TResult1 = hello$return, TResult2 = never>(onfulfilled?: ((value: hello$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<hello$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<hello$return>;
    };
    readonly poll: (data: {
        params?: undefined;
        query?: undefined;
        body: poll$body;
    } & TRequestOptions<poll$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<poll$return, any, {}, any>>;
        readonly data: Promise<poll$return>;
        then: <TResult1 = poll$return, TResult2 = never>(onfulfilled?: ((value: poll$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<poll$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<poll$return>;
    };
    readonly config: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<config$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<config$return, any, {}, any>>;
        readonly data: Promise<config$return>;
        then: <TResult1 = config$return, TResult2 = never>(onfulfilled?: ((value: config$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<config$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<config$return>;
    };
    readonly events: (data: {
        params?: undefined;
        query?: undefined;
        body: events$body;
    } & TRequestOptions<events$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<events$return, any, {}, any>>;
        readonly data: Promise<events$return>;
        then: <TResult1 = events$return, TResult2 = never>(onfulfilled?: ((value: events$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<events$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<events$return>;
    };
};
