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
        /** SHA-256 of the running agent binary: compared with the published one for updates */
        agentSha256?: string | undefined;
        /** What `systemd-detect-virt` says: none on bare metal, else kvm, microsoft… */
        virtualization?: string | undefined;
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
            /** Long polling (PLAN Phase 13): how long the control plane may hold a poll that sends `wait`; 0 or absent = don't send it */
            waitMs?: number | undefined;
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
    /** Hold this poll until there's something for the agent (up to `waitMs`); then `nextPollMs` 0 means poll again now */
    wait?: boolean | undefined;
    appliedVersion?: number;
    /** Sent at most every 60 s, or on a >10% change */
    summary?: {
        /** Used fraction */
        cpu: number;
        memFree: number;
        diskFree: number;
        /** Machines only (PLAN §27) */
        partitions?: {
            name: string;
            /** Docker state: running, exited… */
            state: string;
            size: {
                cpus: number;
                memMb: number;
                diskGb: number;
            };
            /** CPU time used since it started */
            cpuMicros: number;
            /** Bytes it can't give back */
            memUsed: number;
            diskUsed: number;
            /** Traffic in since it was created */
            rxBytes: number;
            /** Traffic out since it was created */
            txBytes: number;
        }[] | undefined;
        /** Round trip to the control plane: the median of recent polls, its own time left out (PLAN §29) */
        rttMs?: number | undefined;
        /** Share of CPU time the hypervisor gave elsewhere: a virtual machine on a busy host */
        steal?: number | undefined;
        /** Machines: CPU used outside partitions, averaged over about an hour (PLAN §29) */
        hostCpu?: number | undefined;
        /** Machines: the latest tests */
        benchmark?: {
            /** When it ran, ISO 8601 */
            at: string;
            /** One core compressing, MB/s */
            cpuSingle: number;
            /** Every core compressing, MB/s in all */
            cpuMulti: number;
            threads: number;
            /** Copying memory, MB/s */
            memory: number;
            /** Writing to the partitions' disk, flushed, MB/s */
            diskWrite: number;
            /** A small write made durable (fsync), milliseconds */
            diskSync: number;
            /** A spinning disk, says the kernel */
            rotational?: boolean | undefined;
        } | undefined;
    } | undefined;
    /** Open terminals: session -> highest input seq applied. Only sent while one is open */
    streams?: {
        [K in string]: number;
    } | undefined;
};
export type poll$return = {
    nextPollMs: number;
    configVersion: string;
    commands: {
        seq: number;
        type: "ping" | "docker.ensure" | "stream.open" | "stream.close" | "build.run" | "cache.clear" | "agent.update" | "registry.delete" | "host.cleanup" | "pool.ensure" | "partition.create" | "partition.resize" | "partition.stop" | "partition.start" | "partition.remove" | "partition.send" | "partition.receive";
        payload: {
            [K in string]: unknown;
        };
    }[];
    /** New terminal input per session, after the cursors in `streams` */
    streamInput?: {
        [K in string]: {
            seq: number;
            data?: string | undefined;
            cols?: number | undefined;
            rows?: number | undefined;
        }[];
    } | undefined;
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
            /** Long polling (PLAN Phase 13): how long the control plane may hold a poll that sends `wait`; 0 or absent = don't send it */
            waitMs?: number | undefined;
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
            result?: {
                [K in string]: unknown;
            } | undefined;
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
            peers: {
                [K in string]: boolean;
            };
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
    readonly installScript: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
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
//# sourceMappingURL=agents.d.ts.map