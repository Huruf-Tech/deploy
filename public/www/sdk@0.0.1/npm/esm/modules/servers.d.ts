import type { TRequestOptions, TFilters, TPagination } from "../types.js";
import type { BaseSDK } from "../base.js";
export type clearCaches$return = {
    servers: number;
};
export type count$query = {
    /** Client side filters */
    filters?: TFilters | undefined;
    /** Client side sub-filters (Just a second layer of filters) */
    subFilters?: TFilters | undefined;
};
export type count$return = {
    count: number;
};
export type get$params = {
    id?: string | undefined;
};
export type get$query = TPagination;
export type get$return = {
    results: {
        name: string;
        /** Free-form key/value tags, e.g. region=eu, builder=true */
        labels: {
            [K in string]: string;
        };
        tenant: string;
        status: "pending" | "active" | "rejected";
        identity: {
            signPublicKey: string;
            boxPublicKey: string;
            fingerprint: string;
        };
        pairingCode?: string | undefined;
        pairingExpiresAt?: Date | undefined;
        installMethod: "manual" | "ssh";
        provider: {
            kind: "machine" | "partition" | "rented";
            host?: string | undefined;
            partition?: string | undefined;
            meshPort?: number | undefined;
            subscription?: string | undefined;
        };
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
        resources?: {
            /** Used fraction */
            cpu: number;
            memFree: number;
            diskFree: number;
            /** Machines only (PLAN §27) */
            partitions?: {
                name: string;
                /** Docker state: running, exited… */
                state: string;
                /** Its size now: a resize changes it once applied */
                size: {
                    cpus: number;
                    memMb: number;
                    diskGb: number;
                };
                /** A resize to this size is being applied */
                resizing?: {
                    cpus: number;
                    memMb: number;
                    diskGb: number;
                } | undefined;
                /** The latest resize failed; it kept `size` */
                resizeError?: {
                    /** The size it was asked for */
                    size: {
                        cpus: number;
                        memMb: number;
                        diskGb: number;
                    };
                    error: string;
                } | undefined;
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
            reportedAt: Date;
        } | undefined;
        setup?: {
            status: "pending" | "ready" | "failed";
            dockerVersion?: string | undefined;
            checks?: {
                name: string;
                ok: boolean;
                detail: string;
            }[] | undefined;
            notes?: string[] | undefined;
            error?: string | undefined;
            updatedAt: Date;
        } | undefined;
        mesh?: {
            index: number;
            enabled: boolean;
            publicKey?: string | undefined;
            endpoint?: string | undefined;
            peers?: {
                [K in string]: boolean;
            } | undefined;
            error?: string | undefined;
            reportedAt?: Date | undefined;
        } | undefined;
        pool?: {
            status: "pending" | "ready" | "failed";
            allocatable?: {
                cpus: number;
                memMb: number;
                diskGb: number;
            } | undefined;
            error?: string | undefined;
            updatedAt: Date;
            rent?: {
                enabled: boolean;
                autoAccept: boolean;
                prices: {
                    vcpu: number;
                    memGb: number;
                    diskGb: number;
                    whole?: number | undefined;
                    trafficGb: number;
                };
            } | undefined;
            accepting?: boolean | undefined;
            monthlyCost?: number | undefined;
        } | undefined;
        region?: {
            country?: string | undefined;
            ip: string;
            at: Date;
        } | undefined;
        tunnelPort?: number | undefined;
        acceptedBy?: string | undefined;
        acceptedAt?: Date | undefined;
        createdAt: Date;
        _id: string;
    }[];
};
export type update$params = {
    id: string;
};
export type update$body = {
    name?: string | undefined;
    labels?: {
        [K in string]: string;
    } | undefined;
};
export type del$params = {
    id: string;
};
export type profile$params = {
    id?: string;
};
export type profile$return = {
    /** Round trip to the control plane */
    rttMs?: number | undefined;
    /** Percent, last 30 days */
    uptime30d?: number | undefined;
    /** Percent, last 90 days */
    uptime90d?: number | undefined;
    /** CPU the hypervisor took, 0..1 */
    steal?: number | undefined;
    virtualization?: string | undefined;
    /** 0..100, machines */
    rating?: number | undefined;
    tier?: ("Basic" | "Standard" | "Performance") | undefined;
    disk?: ("NVMe" | "SSD" | "HDD") | undefined;
    benchmarkAt?: string | undefined;
    /** CPU used outside partitions, 0..1, machines */
    hostCpu?: number | undefined;
    /** Can be rented whole: nothing else runs on it */
    dedicated?: boolean | undefined;
    /** Why it can't, if not */
    notDedicated?: string | undefined;
};
export type partitions$params = {
    id?: string;
};
export type partitions$return = {
    name: string;
    /** Reported by the machine */
    size?: {
        cpus: number;
        memMb: number;
        diskGb: number;
    } | undefined;
    state?: string | undefined;
    memUsed?: number | undefined;
    diskUsed?: number | undefined;
    server?: {
        _id: string;
        name: string;
    } | undefined;
    /** Its agent hasn't joined yet */
    joining: boolean;
    /** A rental on the platform's machine (PLAN §28) */
    rented?: {
        tenant: string;
        plan: string;
    } | undefined;
    /** The machine doesn't report it yet */
    creating?: boolean | undefined;
    /** Why creating it failed */
    error?: string | undefined;
    /** Its server's name to be */
    label?: string | undefined;
}[];
export type createPartition$params = {
    id?: string;
};
export type createPartition$body = {
    /** The server's name */
    name?: string | undefined;
    size: {
        cpus: number;
        memMb: number;
        diskGb: number;
    };
};
export type createPartition$return = {
    name: string;
};
export type resizePartition$params = {
    id?: string;
    name: string;
};
export type resizePartition$body = {
    size: {
        cpus: number;
        memMb: number;
        diskGb: number;
    };
};
export type removePartition$params = {
    id?: string;
    name: string;
};
export type removePartition$return = {
    /** The machine's partition.remove */
    command: string;
};
export type agentRelease$return = {
    /** arch -> SHA-256 */
    sums: {
        [K in string]: string;
    };
};
export type updateAgent$params = {
    id?: string;
};
export type accept$params = {
    id?: string;
};
export type accept$body = {
    pairingCode: string;
};
export type reject$params = {
    id?: string;
};
export type prepare$params = {
    id?: string;
};
export type prepare$return = {
    command: string;
    seq: number;
};
export type ping$params = {
    id?: string;
};
export type ping$return = {
    command: string;
    seq: number;
};
export type cleanup$params = {
    id?: string;
};
export type cleanup$body = {
    dryRun: boolean;
    removeSysbox?: boolean;
};
export type cleanup$return = {
    command: string;
};
export type command$params = {
    id?: string;
    command?: string;
};
export type command$return = {
    status: "pending" | "delivered" | "done" | "failed";
    result?: {
        [K in string]: unknown;
    } | undefined;
    error?: string | undefined;
};
export type bootstrap$body = {
    host: string;
    port?: number;
    username: string;
    password?: string | undefined;
    privateKey?: string | undefined;
    passphrase?: string | undefined;
};
export type bootstrap$return = {
    session: string;
};
export type bootstrapProgress$params = {
    id?: string;
};
export type bootstrapProgress$return = {
    status: "installing" | "registered" | "online" | "failed";
    steps: {
        at: string;
        message: string;
    }[];
    error?: string | undefined;
    server?: string | undefined;
};
export type installCommand$return = {
    command: string;
};
export type liveness$return = {
    server: string;
    online: boolean;
    lastSeenAt: string;
    offlineSince?: string | undefined;
}[];
export declare const serversModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        clearCaches$return: clearCaches$return;
        count$query: count$query;
        count$return: count$return;
        get$params: get$params;
        get$query: get$query;
        get$return: get$return;
        update$params: update$params;
        update$body: update$body;
        del$params: del$params;
        profile$params: profile$params;
        profile$return: profile$return;
        partitions$params: partitions$params;
        partitions$return: partitions$return;
        createPartition$params: createPartition$params;
        createPartition$body: createPartition$body;
        createPartition$return: createPartition$return;
        resizePartition$params: resizePartition$params;
        resizePartition$body: resizePartition$body;
        removePartition$params: removePartition$params;
        removePartition$return: removePartition$return;
        agentRelease$return: agentRelease$return;
        updateAgent$params: updateAgent$params;
        accept$params: accept$params;
        accept$body: accept$body;
        reject$params: reject$params;
        prepare$params: prepare$params;
        prepare$return: prepare$return;
        ping$params: ping$params;
        ping$return: ping$return;
        cleanup$params: cleanup$params;
        cleanup$body: cleanup$body;
        cleanup$return: cleanup$return;
        command$params: command$params;
        command$return: command$return;
        bootstrap$body: bootstrap$body;
        bootstrap$return: bootstrap$return;
        bootstrapProgress$params: bootstrapProgress$params;
        bootstrapProgress$return: bootstrapProgress$return;
        installCommand$return: installCommand$return;
        liveness$return: liveness$return;
    };
    readonly clearCaches: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<clearCaches$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<clearCaches$return, any, {}, any>>;
        readonly data: Promise<clearCaches$return>;
        then: <TResult1 = clearCaches$return, TResult2 = never>(onfulfilled?: ((value: clearCaches$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<clearCaches$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<clearCaches$return>;
    };
    readonly count: (data: {
        params?: undefined;
        query: count$query;
        body?: undefined;
    } & TRequestOptions<count$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<count$return, any, {}, any>>;
        readonly data: Promise<count$return>;
        then: <TResult1 = count$return, TResult2 = never>(onfulfilled?: ((value: count$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<count$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<count$return>;
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
    readonly profile: (data: {
        params: profile$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<profile$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<profile$return, any, {}, any>>;
        readonly data: Promise<profile$return>;
        then: <TResult1 = profile$return, TResult2 = never>(onfulfilled?: ((value: profile$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<profile$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<profile$return>;
    };
    readonly partitions: (data: {
        params: partitions$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<partitions$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<partitions$return, any, {}, any>>;
        readonly data: Promise<partitions$return>;
        then: <TResult1 = partitions$return, TResult2 = never>(onfulfilled?: ((value: partitions$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<partitions$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<partitions$return>;
    };
    readonly createPartition: (data: {
        params: createPartition$params;
        query?: undefined;
        body: createPartition$body;
    } & TRequestOptions<createPartition$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<createPartition$return, any, {}, any>>;
        readonly data: Promise<createPartition$return>;
        then: <TResult1 = createPartition$return, TResult2 = never>(onfulfilled?: ((value: createPartition$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<createPartition$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<createPartition$return>;
    };
    readonly resizePartition: (data: {
        params: resizePartition$params;
        query?: undefined;
        body: resizePartition$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly removePartition: (data: {
        params: removePartition$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<removePartition$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<removePartition$return, any, {}, any>>;
        readonly data: Promise<removePartition$return>;
        then: <TResult1 = removePartition$return, TResult2 = never>(onfulfilled?: ((value: removePartition$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<removePartition$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<removePartition$return>;
    };
    readonly agentRelease: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<agentRelease$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<agentRelease$return, any, {}, any>>;
        readonly data: Promise<agentRelease$return>;
        then: <TResult1 = agentRelease$return, TResult2 = never>(onfulfilled?: ((value: agentRelease$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<agentRelease$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<agentRelease$return>;
    };
    readonly updateAgent: (data: {
        params: updateAgent$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly accept: (data: {
        params: accept$params;
        query?: undefined;
        body: accept$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly reject: (data: {
        params: reject$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly prepare: (data: {
        params: prepare$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<prepare$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<prepare$return, any, {}, any>>;
        readonly data: Promise<prepare$return>;
        then: <TResult1 = prepare$return, TResult2 = never>(onfulfilled?: ((value: prepare$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<prepare$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<prepare$return>;
    };
    readonly ping: (data: {
        params: ping$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<ping$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<ping$return, any, {}, any>>;
        readonly data: Promise<ping$return>;
        then: <TResult1 = ping$return, TResult2 = never>(onfulfilled?: ((value: ping$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<ping$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<ping$return>;
    };
    readonly cleanup: (data: {
        params: cleanup$params;
        query?: undefined;
        body: cleanup$body;
    } & TRequestOptions<cleanup$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<cleanup$return, any, {}, any>>;
        readonly data: Promise<cleanup$return>;
        then: <TResult1 = cleanup$return, TResult2 = never>(onfulfilled?: ((value: cleanup$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<cleanup$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<cleanup$return>;
    };
    readonly command: (data: {
        params: command$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<command$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<command$return, any, {}, any>>;
        readonly data: Promise<command$return>;
        then: <TResult1 = command$return, TResult2 = never>(onfulfilled?: ((value: command$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<command$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<command$return>;
    };
    readonly bootstrap: (data: {
        params?: undefined;
        query?: undefined;
        body: bootstrap$body;
    } & TRequestOptions<bootstrap$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<bootstrap$return, any, {}, any>>;
        readonly data: Promise<bootstrap$return>;
        then: <TResult1 = bootstrap$return, TResult2 = never>(onfulfilled?: ((value: bootstrap$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<bootstrap$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<bootstrap$return>;
    };
    readonly bootstrapProgress: (data: {
        params: bootstrapProgress$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<bootstrapProgress$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<bootstrapProgress$return, any, {}, any>>;
        readonly data: Promise<bootstrapProgress$return>;
        then: <TResult1 = bootstrapProgress$return, TResult2 = never>(onfulfilled?: ((value: bootstrapProgress$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<bootstrapProgress$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<bootstrapProgress$return>;
    };
    readonly installCommand: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<installCommand$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<installCommand$return, any, {}, any>>;
        readonly data: Promise<installCommand$return>;
        then: <TResult1 = installCommand$return, TResult2 = never>(onfulfilled?: ((value: installCommand$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<installCommand$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<installCommand$return>;
    };
    readonly liveness: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<liveness$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<liveness$return, any, {}, any>>;
        readonly data: Promise<liveness$return>;
        then: <TResult1 = liveness$return, TResult2 = never>(onfulfilled?: ((value: liveness$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<liveness$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<liveness$return>;
    };
};
//# sourceMappingURL=servers.d.ts.map