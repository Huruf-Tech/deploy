import type { 
    TRequestOptions,
    TFilterValue,
    TFilterExpression,
    TMultiFilters,
    TFilters,
    TPagination,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

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
        /** SHA-256 of the running agent binary: compared with the published one for updates */
        agentSha256?: string | undefined;
    };
    /** One-time token from the SSH wizard: activates the server without pairing */
    joinToken?: string | undefined;
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
        /** How often the agent re-checks its workloads against the desired state (self-healing) */
        reconcileIntervalMs: number;
        /** How often the agent samples usage for alerts, autoscaling and footprints */
        monitorIntervalMs: number;
        capacity: {
            /** Kept free for the OS, agent and proxy when computing room (PLAN §7.1) */
            headroomPercent: number;
            /** Daily peaks kept on the agent */
            retentionDays: number;
        };
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
    /** Open terminals: session -> highest input seq applied. Only sent while one is open */
    streams?: Record<string, number> | undefined;
};
export type poll$return = {
    nextPollMs: number;
    configVersion: string;
    commands: {
        seq: number;
        type: "ping" | "docker.ensure" | "stream.open" | "stream.close" | "build.run" | "server.prune" | "agent.update";
        payload: Record<string, unknown>;
    }[];
    /** New terminal input per session, after the cursors in `streams` */
    streamInput?: Record<string, {
        seq: number;
        data?: string | undefined;
        cols?: number | undefined;
        rows?: number | undefined;
    }[]> | undefined;
    /** The agent's cursor is ahead of this server's commands (state from an earlier registration): forget received commands and the stored desired state */
    resetCommands?: boolean | undefined;
    /** Only when the version is newer than appliedVersion */
    desired?: {
        version: number;
        /** The DesiredSpec as JSON, sealed to this agent */
        sealed: string;
    } | undefined;
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
        /** How often the agent re-checks its workloads against the desired state (self-healing) */
        reconcileIntervalMs: number;
        /** How often the agent samples usage for alerts, autoscaling and footprints */
        monitorIntervalMs: number;
        capacity: {
            /** Kept free for the OS, agent and proxy when computing room (PLAN §7.1) */
            headroomPercent: number;
            /** Daily peaks kept on the agent */
            retentionDays: number;
        };
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
    } | {
        id: string;
        type: "stream.chunk";
        data: {
            session: string;
            seq: number;
            data: string;
            /** The stream ended (exec finished) */
            done?: boolean | undefined;
            error?: string | undefined;
        };
    } | {
        id: string;
        type: "workload.status";
        data: {
            /** Desired-state version being applied */
            version: number;
            project: string;
            workload: string;
            release: number;
            state: "starting" | "healthy" | "failed";
            error?: string | undefined;
        };
    } | {
        id: string;
        type: "mesh.status";
        data: {
            publicKey: string;
            /** server -> reachable (a WireGuard handshake in the last 3 minutes) */
            peers: Record<string, boolean>;
            error?: string | undefined;
        };
    } | {
        id: string;
        type: "alert.fired" | "alert.resolved";
        data: {
            rule: string;
            value: number;
            /** Unix ms; identifies the episode */
            firedAt: number;
        };
    } | {
        id: string;
        type: "autoscale.changed";
        data: {
            project: string;
            workload: string;
            from: number;
            to: number;
            reason: string;
        };
    })[];
};
export type events$return = {
    applied: number;
    /** Stream sessions nobody is watching any more: stop them */
    close: string[];
};

export const agentsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        hello$body: hello$body,
        hello$return: hello$return,
        poll$body: poll$body,
        poll$return: poll$return,
        config$return: config$return,
        events$body: events$body,
        events$return: events$return,
    };

    const methods = {
        type,
        hello(data: {
        params?: undefined,
        query?: undefined,
        body: hello$body,
    } & TRequestOptions<hello$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("agents", "hello");

            const method = "post";
            const toPath = compile("agents/api/hello");
            const requestPayload = {
                method,
                url: toPath(data?.params),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        poll(data: {
        params?: undefined,
        query?: undefined,
        body: poll$body,
    } & TRequestOptions<poll$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("agents", "poll");

            const method = "post";
            const toPath = compile("agents/api/poll");
            const requestPayload = {
                method,
                url: toPath(data?.params),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        installScript(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("agents", "installScript");

            const method = "get";
            const toPath = compile("agents/api/install.sh");
            const requestPayload = {
                method,
                url: toPath(data?.params),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        config(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<config$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("agents", "config");

            const method = "post";
            const toPath = compile("agents/api/config");
            const requestPayload = {
                method,
                url: toPath(data?.params),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
        events(data: {
        params?: undefined,
        query?: undefined,
        body: events$body,
    } & TRequestOptions<events$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("agents", "events");

            const method = "post";
            const toPath = compile("agents/api/events");
            const requestPayload = {
                method,
                url: toPath(data?.params),
                params: data?.query,
                data: data?.body,
                signal: data?.signal,
                ...(data?.axiosConfig
                ? sdk.resolveAxiosConfig(data.axiosConfig)
                : undefined),
            };

            sdk.log("Sending Request:", requestPayload);

            const res = await sdk._axios!.request(requestPayload);

            return res;
        }, data);
    },
    } as const;

    (methods.hello as any).__scope = "agents";
    (methods.poll as any).__scope = "agents";
    (methods.installScript as any).__scope = "agents";
    (methods.config as any).__scope = "agents";
    (methods.events as any).__scope = "agents";

    sdk["_moduleGroup"].set(methods, "Agents");


    return methods;
};