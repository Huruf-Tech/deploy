import type { 
    TRequestOptions,
    TFilters,
    TPagination,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

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

export const serversModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        count$query: count$query,
        count$return: count$return,
        get$params: get$params,
        get$query: get$query,
        get$return: get$return,
        update$params: update$params,
        update$body: update$body,
        del$params: del$params,
        partitions$params: partitions$params,
        partitions$return: partitions$return,
        createPartition$params: createPartition$params,
        createPartition$body: createPartition$body,
        createPartition$return: createPartition$return,
        resizePartition$params: resizePartition$params,
        resizePartition$body: resizePartition$body,
        removePartition$params: removePartition$params,
        removePartition$return: removePartition$return,
        agentRelease$return: agentRelease$return,
        updateAgent$params: updateAgent$params,
        accept$params: accept$params,
        accept$body: accept$body,
        reject$params: reject$params,
        prepare$params: prepare$params,
        prepare$return: prepare$return,
        ping$params: ping$params,
        ping$return: ping$return,
        cleanup$params: cleanup$params,
        cleanup$body: cleanup$body,
        cleanup$return: cleanup$return,
        command$params: command$params,
        command$return: command$return,
        bootstrap$body: bootstrap$body,
        bootstrap$return: bootstrap$return,
        bootstrapProgress$params: bootstrapProgress$params,
        bootstrapProgress$return: bootstrapProgress$return,
        installCommand$return: installCommand$return,
        liveness$return: liveness$return,
    };

    const methods = {
        type,
        count(data: {
        params?: undefined,
        query: count$query,
        body?: undefined,
    } & TRequestOptions<count$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "count");

            const method = "get";
            const toPath = compile("servers/api/count");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        get(data: {
        params: get$params,
        query: get$query,
        body?: undefined,
    } & TRequestOptions<get$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "get");

            const method = "get";
            const toPath = compile("servers/api{/:id}");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        update(data: {
        params: update$params,
        query?: undefined,
        body: update$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "update");

            const method = "patch";
            const toPath = compile("servers/api/:id");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        del(data: {
        params: del$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "del");

            const method = "delete";
            const toPath = compile("servers/api/:id");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        partitions(data: {
        params: partitions$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<partitions$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "partitions");

            const method = "get";
            const toPath = compile("servers/api/:id/partitions");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        createPartition(data: {
        params: createPartition$params,
        query?: undefined,
        body: createPartition$body,
    } & TRequestOptions<createPartition$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "createPartition");

            const method = "post";
            const toPath = compile("servers/api/:id/partitions");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        resizePartition(data: {
        params: resizePartition$params,
        query?: undefined,
        body: resizePartition$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "resizePartition");

            const method = "patch";
            const toPath = compile("servers/api/:id/partitions/:name");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        removePartition(data: {
        params: removePartition$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<removePartition$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "removePartition");

            const method = "delete";
            const toPath = compile("servers/api/:id/partitions/:name");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        agentRelease(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<agentRelease$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "agentRelease");

            const method = "get";
            const toPath = compile("servers/api/agent/latest");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        updateAgent(data: {
        params: updateAgent$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "updateAgent");

            const method = "post";
            const toPath = compile("servers/api/:id/updateAgent");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        accept(data: {
        params: accept$params,
        query?: undefined,
        body: accept$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "accept");

            const method = "post";
            const toPath = compile("servers/api/:id/accept");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        reject(data: {
        params: reject$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "reject");

            const method = "post";
            const toPath = compile("servers/api/:id/reject");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        prepare(data: {
        params: prepare$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<prepare$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "prepare");

            const method = "post";
            const toPath = compile("servers/api/:id/prepare");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        ping(data: {
        params: ping$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<ping$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "ping");

            const method = "post";
            const toPath = compile("servers/api/:id/ping");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        cleanup(data: {
        params: cleanup$params,
        query?: undefined,
        body: cleanup$body,
    } & TRequestOptions<cleanup$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "cleanup");

            const method = "post";
            const toPath = compile("servers/api/:id/cleanup");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        command(data: {
        params: command$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<command$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "command");

            const method = "get";
            const toPath = compile("servers/api/:id/commands/:command");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        bootstrap(data: {
        params?: undefined,
        query?: undefined,
        body: bootstrap$body,
    } & TRequestOptions<bootstrap$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "bootstrap");

            const method = "post";
            const toPath = compile("servers/api/bootstrap");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        bootstrapProgress(data: {
        params: bootstrapProgress$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<bootstrapProgress$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "bootstrapProgress");

            const method = "get";
            const toPath = compile("servers/api/bootstrap/:id");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        installCommand(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<installCommand$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "installCommand");

            const method = "get";
            const toPath = compile("servers/api/install/command");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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
        liveness(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<liveness$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("servers", "liveness");

            const method = "get";
            const toPath = compile("servers/api/live/status");
            const requestPayload = {
                method,
                url: toPath(sdk.resolvePathParams(data?.params)),
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

    (methods.count as any).__scope = "servers";
    (methods.get as any).__scope = "servers";
    (methods.update as any).__scope = "servers";
    (methods.del as any).__scope = "servers";
    (methods.partitions as any).__scope = "servers";
    (methods.createPartition as any).__scope = "servers";
    (methods.resizePartition as any).__scope = "servers";
    (methods.removePartition as any).__scope = "servers";
    (methods.agentRelease as any).__scope = "servers";
    (methods.updateAgent as any).__scope = "servers";
    (methods.accept as any).__scope = "servers";
    (methods.reject as any).__scope = "servers";
    (methods.prepare as any).__scope = "servers";
    (methods.ping as any).__scope = "servers";
    (methods.cleanup as any).__scope = "servers";
    (methods.command as any).__scope = "servers";
    (methods.bootstrap as any).__scope = "servers";
    (methods.bootstrapProgress as any).__scope = "servers";
    (methods.installCommand as any).__scope = "servers";
    (methods.liveness as any).__scope = "servers";

    sdk["_moduleGroup"].set(methods, "Infrastructure");

    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":60,"canFilter":true},"labels":{"default":{},"description":"Free-form key/value tags, e.g. region=eu, builder=true","type":"object","propertyNames":{"type":"string","maxLength":40},"additionalProperties":{"type":"string","maxLength":80}},"tenant":{"tsType":"string","ref":"tenants"},"status":{"type":"string","enum":["pending","active","rejected"],"canFilter":true},"identity":{"type":"object","properties":{"signPublicKey":{"type":"string"},"boxPublicKey":{"type":"string"},"fingerprint":{"type":"string"}},"required":["signPublicKey","boxPublicKey","fingerprint"],"additionalProperties":false},"pairingCode":{"type":"string"},"pairingExpiresAt":{"type":"string","format":"date-time"},"installMethod":{"default":"manual","canFilter":true,"type":"string","enum":["manual","ssh"]},"provider":{"default":{"kind":"machine"},"type":"object","properties":{"kind":{"type":"string","enum":["machine","partition","rented","byo"]},"host":{"tsType":"string","ref":"servers","canFilter":true},"partition":{"type":"string"},"meshPort":{"type":"integer","minimum":1,"maximum":65535},"subscription":{"tsType":"string"}},"required":["kind"],"additionalProperties":false},"inventory":{"type":"object","properties":{"hostname":{"type":"string","maxLength":255,"canFilter":true},"os":{"type":"string","maxLength":100,"canFilter":true},"arch":{"type":"string","enum":["amd64","arm64"],"canFilter":true},"cpuCores":{"type":"number","minimum":0.1},"memory":{"type":"integer","minimum":0,"maximum":9007199254740991,"description":"Bytes"},"disk":{"type":"integer","minimum":0,"maximum":9007199254740991,"description":"Bytes"},"publicIp":{"canFilter":true,"type":"string","maxLength":64},"privateIp":{"type":"string","maxLength":64},"dockerVersion":{"type":"string","maxLength":50},"agentVersion":{"type":"string","maxLength":50,"canFilter":true},"agentSha256":{"description":"SHA-256 of the running agent binary: compared with the published one for updates","type":"string","maxLength":64}},"required":["hostname","os","arch","cpuCores","memory","disk","agentVersion"],"additionalProperties":false},"resources":{"type":"object","properties":{"cpu":{"type":"number","minimum":0,"maximum":1,"description":"Used fraction"},"memFree":{"type":"integer","minimum":0,"maximum":9007199254740991},"diskFree":{"type":"integer","minimum":0,"maximum":9007199254740991},"partitions":{"description":"Pool machines only (PLAN §26)","maxItems":200,"type":"array","items":{"type":"object","properties":{"name":{"type":"string","pattern":"^[a-z0-9]{1,12}$"},"remainder":{"type":"boolean"},"state":{"type":"string","description":"Docker state: running, exited…"},"size":{"type":"object","properties":{"cpus":{"type":"number","minimum":0,"maximum":512},"memMb":{"type":"integer","minimum":256,"maximum":9007199254740991},"diskGb":{"type":"integer","minimum":5,"maximum":9007199254740991}},"required":["cpus","memMb","diskGb"],"additionalProperties":false},"cpuMicros":{"type":"integer","minimum":0,"maximum":9007199254740991,"description":"CPU time used since it started"},"memUsed":{"type":"integer","minimum":0,"maximum":9007199254740991,"description":"Bytes it can't give back"},"diskUsed":{"type":"integer","minimum":0,"maximum":9007199254740991},"rxBytes":{"type":"integer","minimum":0,"maximum":9007199254740991,"description":"Traffic in since it was created"},"txBytes":{"type":"integer","minimum":0,"maximum":9007199254740991,"description":"Traffic out since it was created"}},"required":["name","remainder","state","size","cpuMicros","memUsed","diskUsed","rxBytes","txBytes"],"additionalProperties":false}},"reportedAt":{"type":"string","format":"date-time"}},"required":["cpu","memFree","diskFree","reportedAt"],"additionalProperties":false},"setup":{"type":"object","properties":{"status":{"type":"string","enum":["pending","ready","failed"]},"dockerVersion":{"type":"string"},"checks":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"ok":{"type":"boolean"},"detail":{"type":"string"}},"required":["name","ok","detail"],"additionalProperties":false}},"notes":{"type":"array","items":{"type":"string"}},"error":{"type":"string"},"updatedAt":{"type":"string","format":"date-time"}},"required":["status","updatedAt"],"additionalProperties":false},"mesh":{"type":"object","properties":{"index":{"type":"integer","minimum":1,"maximum":9007199254740991},"enabled":{"default":true,"type":"boolean"},"publicKey":{"type":"string"},"endpoint":{"type":"string"},"peers":{"type":"object","propertyNames":{"type":"string"},"additionalProperties":{"type":"boolean"}},"error":{"type":"string"},"reportedAt":{"type":"string","format":"date-time"}},"required":["index","enabled"],"additionalProperties":false},"pool":{"type":"object","properties":{"status":{"type":"string","enum":["pending","ready","failed"]},"mode":{"type":"string","enum":["machine","pool"]},"allocatable":{"type":"object","properties":{"cpus":{"type":"number","minimum":0,"maximum":512},"memMb":{"type":"integer","minimum":256,"maximum":9007199254740991},"diskGb":{"type":"integer","minimum":5,"maximum":9007199254740991}},"required":["cpus","memMb","diskGb"],"additionalProperties":false},"sysbox":{"type":"string"},"notes":{"type":"array","items":{"type":"string"}},"error":{"type":"string"},"updatedAt":{"type":"string","format":"date-time"},"class":{"tsType":"string","ref":"serverClasses"},"accepting":{"type":"boolean"},"monthlyCost":{"type":"integer","minimum":0,"maximum":9007199254740991}},"required":["status","updatedAt"],"additionalProperties":false},"tunnelPort":{"type":"integer","minimum":1,"maximum":65535},"acceptedBy":{"tsType":"string","ref":"users"},"acceptedAt":{"type":"string","format":"date-time"},"createdAt":{"canFilter":true,"type":"string","format":"date-time"}},"required":["name","labels","tenant","status","identity","installMethod","provider","inventory","createdAt"],"additionalProperties":false},"updateSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":60,"canFilter":true},"labels":{"default":{},"description":"Free-form key/value tags, e.g. region=eu, builder=true","type":"object","propertyNames":{"type":"string","maxLength":40},"additionalProperties":{"type":"string","maxLength":80}}},"required":["name"]}}});

    return methods;
};