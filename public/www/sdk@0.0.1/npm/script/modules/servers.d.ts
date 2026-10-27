import type { TRequestOptions, TFilters, TPagination } from "../types.js";
import type { BaseSDK } from "../base.js";
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
            kind: "machine" | "partition" | "rented" | "byo";
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
        };
        resources?: {
            /** Used fraction */
            cpu: number;
            memFree: number;
            diskFree: number;
            /** Pool machines only (PLAN §26) */
            partitions?: {
                name: string;
                remainder: boolean;
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
            mode?: ("machine" | "pool") | undefined;
            allocatable?: {
                cpus: number;
                memMb: number;
                diskGb: number;
            } | undefined;
            sysbox?: string | undefined;
            notes?: string[] | undefined;
            error?: string | undefined;
            updatedAt: Date;
            class?: string | undefined;
            accepting?: boolean | undefined;
            monthlyCost?: number | undefined;
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
        count$query: count$query;
        count$return: count$return;
        get$params: get$params;
        get$query: get$query;
        get$return: get$return;
        update$params: update$params;
        update$body: update$body;
        del$params: del$params;
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