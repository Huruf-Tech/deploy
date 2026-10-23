import type { 
    TRequestOptions,
    TFilterValue,
    TFilterExpression,
    TMultiFilters,
    TFilters,
    TPagination,
} from "../types.js";
import type { BaseSDK } from "../base.js";

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
        labels: Record<string, string>;
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
            kind: "byo" | "managed";
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
            peers?: Record<string, boolean> | undefined;
            error?: string | undefined;
            reportedAt?: Date | undefined;
        } | undefined;
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
    labels?: Record<string, string> | undefined;
};
export type del$params = {
    id: string;
};
export type agentRelease$return = {
    /** arch -> SHA-256 */
    sums: Record<string, string>;
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
        agentRelease$return: agentRelease$return,
        updateAgent$params: updateAgent$params,
        accept$params: accept$params,
        accept$body: accept$body,
        reject$params: reject$params,
        prepare$params: prepare$params,
        prepare$return: prepare$return,
        ping$params: ping$params,
        ping$return: ping$return,
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

    (methods.count as any).__scope = "servers";
    (methods.get as any).__scope = "servers";
    (methods.update as any).__scope = "servers";
    (methods.del as any).__scope = "servers";
    (methods.agentRelease as any).__scope = "servers";
    (methods.updateAgent as any).__scope = "servers";
    (methods.accept as any).__scope = "servers";
    (methods.reject as any).__scope = "servers";
    (methods.prepare as any).__scope = "servers";
    (methods.ping as any).__scope = "servers";
    (methods.bootstrap as any).__scope = "servers";
    (methods.bootstrapProgress as any).__scope = "servers";
    (methods.installCommand as any).__scope = "servers";
    (methods.liveness as any).__scope = "servers";

    sdk["_moduleGroup"].set(methods, "Infrastructure");

    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":60,"canFilter":true},"labels":{"default":{},"description":"Free-form key/value tags, e.g. region=eu, builder=true","type":"object","propertyNames":{"type":"string","maxLength":40},"additionalProperties":{"type":"string","maxLength":80}},"tenant":{"tsType":"string","ref":"tenants"},"status":{"type":"string","enum":["pending","active","rejected"],"canFilter":true},"identity":{"type":"object","properties":{"signPublicKey":{"type":"string"},"boxPublicKey":{"type":"string"},"fingerprint":{"type":"string"}},"required":["signPublicKey","boxPublicKey","fingerprint"],"additionalProperties":false},"pairingCode":{"type":"string"},"pairingExpiresAt":{"type":"string","format":"date-time"},"installMethod":{"default":"manual","canFilter":true,"type":"string","enum":["manual","ssh"]},"provider":{"default":{"kind":"byo"},"type":"object","properties":{"kind":{"type":"string","enum":["byo","managed"]}},"required":["kind"],"additionalProperties":false},"inventory":{"type":"object","properties":{"hostname":{"type":"string","maxLength":255,"canFilter":true},"os":{"type":"string","maxLength":100,"canFilter":true},"arch":{"type":"string","enum":["amd64","arm64"],"canFilter":true},"cpuCores":{"type":"integer","minimum":1,"maximum":9007199254740991},"memory":{"type":"integer","minimum":0,"maximum":9007199254740991,"description":"Bytes"},"disk":{"type":"integer","minimum":0,"maximum":9007199254740991,"description":"Bytes"},"publicIp":{"canFilter":true,"type":"string","maxLength":64},"privateIp":{"type":"string","maxLength":64},"dockerVersion":{"type":"string","maxLength":50},"agentVersion":{"type":"string","maxLength":50,"canFilter":true},"agentSha256":{"description":"SHA-256 of the running agent binary: compared with the published one for updates","type":"string","maxLength":64}},"required":["hostname","os","arch","cpuCores","memory","disk","agentVersion"],"additionalProperties":false},"resources":{"type":"object","properties":{"cpu":{"type":"number","minimum":0,"maximum":1,"description":"Used fraction"},"memFree":{"type":"integer","minimum":0,"maximum":9007199254740991},"diskFree":{"type":"integer","minimum":0,"maximum":9007199254740991},"reportedAt":{"type":"string","format":"date-time"}},"required":["cpu","memFree","diskFree","reportedAt"],"additionalProperties":false},"setup":{"type":"object","properties":{"status":{"type":"string","enum":["pending","ready","failed"]},"dockerVersion":{"type":"string"},"checks":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"ok":{"type":"boolean"},"detail":{"type":"string"}},"required":["name","ok","detail"],"additionalProperties":false}},"notes":{"type":"array","items":{"type":"string"}},"error":{"type":"string"},"updatedAt":{"type":"string","format":"date-time"}},"required":["status","updatedAt"],"additionalProperties":false},"mesh":{"type":"object","properties":{"index":{"type":"integer","minimum":1,"maximum":9007199254740991},"enabled":{"default":true,"type":"boolean"},"publicKey":{"type":"string"},"endpoint":{"type":"string"},"peers":{"type":"object","propertyNames":{"type":"string"},"additionalProperties":{"type":"boolean"}},"error":{"type":"string"},"reportedAt":{"type":"string","format":"date-time"}},"required":["index","enabled"],"additionalProperties":false},"acceptedBy":{"tsType":"string","ref":"users"},"acceptedAt":{"type":"string","format":"date-time"},"createdAt":{"canFilter":true,"type":"string","format":"date-time"}},"required":["name","labels","tenant","status","identity","installMethod","provider","inventory","createdAt"],"additionalProperties":false},"updateSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":60,"canFilter":true},"labels":{"default":{},"description":"Free-form key/value tags, e.g. region=eu, builder=true","type":"object","propertyNames":{"type":"string","maxLength":40},"additionalProperties":{"type":"string","maxLength":80}}},"required":["name"]}}});

    return methods;
};