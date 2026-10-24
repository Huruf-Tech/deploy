import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type list$return = {
    _id: string;
    name: string;
    slug: string;
    kind: "app" | "service";
    status: "new" | "deploying" | "running" | "failed";
    /** Short description, e.g. acme/shop@main */
    source: string;
    sourceType: "github" | "git" | "image" | "template" | "compose";
    servers: number;
    /** Its app class for capacity footprints (PLAN §7.1) */
    template?: {
        _id: string;
        name: string;
    } | undefined;
    runtime: {
        cpuReserve: number;
        memReserveMb: number;
    };
    publicPort?: number | undefined;
    release?: number | undefined;
    lastDeployment?: {
        status: "queued" | "building" | "deploying" | "healthy" | "failed" | "cancelled";
        createdAt: string;
        commit?: {
            sha: string;
            message?: string | undefined;
            author?: string | undefined;
        } | undefined;
    } | undefined;
    updatedAt: string;
}[];
export type create$body = {
    name: string;
    slug: string;
    group?: string | undefined;
    source: {
        type: "github";
        gitIntegration?: string;
        installation: number;
        /** owner/name */
        repo: string;
        branch: string;
    } | {
        type: "git";
        /** https://… for public repos, or git@host:owner/repo.git with the deploy key */
        url: string;
        branch: string;
    } | {
        type: "image";
        image: string;
    } | {
        /** One-click service: everything comes from the template */
        type: "template";
    } | {
        /** A compose file pasted by the user (stored encrypted) */
        type: "compose";
    };
    build?: {
        mode?: ("template" | "dockerfile" | "compose" | "none") | undefined;
        rootDir?: string | undefined;
        dockerfilePath?: string | undefined;
        composePath?: string | undefined;
    } | undefined;
    template?: {
        template?: string;
        /** Latest when omitted */
        version?: number | undefined;
    } | undefined;
    /** Template inputs; secret ones become project secret variables */
    inputs?: {
        [K in string]: unknown;
    };
    /** The compose file, for the `compose` source */
    compose?: string | undefined;
    /** Project variables to create with it (e.g. a pasted .env) */
    variables?: {
        key: string;
        value: string;
        isSecret?: boolean;
    }[];
    runtime?: {
        port?: (number | undefined) | undefined;
        healthcheckPath?: (string | undefined) | undefined;
        command?: (string[] | undefined) | undefined;
        cpuLimit?: (number | undefined) | undefined;
        memLimitMb?: (number | undefined) | undefined;
        cpuReserve?: number | undefined;
        memReserveMb?: number | undefined;
        healthTimeoutSec?: number | undefined;
    } | undefined;
    servers: string[];
    replicasPerServer?: number;
    autoscale?: {
        min: number;
        max: number;
        /** Target CPU per replica, as a percent of its CPU limit (else reservation) */
        cpuPercent?: number | undefined;
        /** Target memory per replica, as a percent of its memory limit (else reservation) */
        memPercent?: number | undefined;
        cooldownSec?: number;
    } | undefined;
    publicPort?: number | undefined;
    volumes?: {
        name: string;
        mountPath: string;
        /** S3 storage connection; the volume is local when absent */
        storage?: string | undefined;
        /** Folder in the bucket; <project-slug>/<volume> when empty */
        path?: string | undefined;
    }[];
    deployStrategy?: ("rolling" | "allAtOnce" | "stopFirst") | undefined;
    autoDeploy?: boolean;
    needsPrivateNetwork?: boolean;
    distribution?: "auto" | "perServer" | "registry";
    registry?: string | undefined;
    /** Required for rolling or all-at-once with local volumes (PLAN §10) */
    acknowledgeVolumeRisk?: boolean | undefined;
};
export type create$return = {
    _id: string;
    deployKeyPublic?: string | undefined;
};
export type placementInfo$return = {
    server: string;
    name: string;
    labels: {
        [K in string]: string;
    };
    online: boolean;
    cpuCores: number;
    memoryMb: number;
    cpuReserved: number;
    memReservedMb: number;
    cpuFree: number;
    memFreeMb: number;
    publicPorts: number[];
}[];
export type get$params = {
    id?: string;
};
export type get$return = {
    _id: string;
    name: string;
    slug: string;
    kind: "app" | "service";
    group?: string | undefined;
    status: "new" | "deploying" | "running" | "failed";
    source: {
        type: "github";
        gitIntegration: string;
        installation: number;
        /** owner/name */
        repo: string;
        branch: string;
    } | {
        type: "git";
        /** https://… for public repos, or git@host:owner/repo.git with the deploy key */
        url: string;
        branch: string;
    } | {
        type: "image";
        image: string;
    } | {
        /** One-click service: everything comes from the template */
        type: "template";
    } | {
        /** A compose file pasted by the user (stored encrypted) */
        type: "compose";
    };
    build: {
        mode: string;
        rootDir: string;
        dockerfilePath: string;
        composePath: string;
    };
    template?: {
        template: string;
        version: number;
    } | undefined;
    templateInputs: {
        [K in string]: string | number | boolean;
    };
    runtime: {
        /** Port the app listens on inside the container */
        port?: number | undefined;
        healthcheckPath?: string | undefined;
        command?: string[] | undefined;
        cpuLimit?: number | undefined;
        memLimitMb?: number | undefined;
        cpuReserve: number;
        memReserveMb: number;
        healthTimeoutSec: number;
    };
    servers: {
        _id: string;
        name: string;
        publicIp?: string | undefined;
    }[];
    placedOn: string[];
    replicasPerServer: number;
    autoscale?: {
        min: number;
        max: number;
        /** Target CPU per replica, as a percent of its CPU limit (else reservation) */
        cpuPercent?: number | undefined;
        /** Target memory per replica, as a percent of its memory limit (else reservation) */
        memPercent?: number | undefined;
        cooldownSec: number;
    } | undefined;
    /** The autoscaler's latest change per server */
    autoscaled?: {
        server: string;
        replicas: number;
        reason: string;
        at: string;
    }[] | undefined;
    publicPort?: number | undefined;
    volumes: {
        name: string;
        mountPath: string;
        /** S3 storage connection; the volume is local when absent */
        storage?: string | undefined;
        /** Folder in the bucket; <project-slug>/<volume> when empty */
        path?: string | undefined;
    }[];
    deployStrategy: "rolling" | "allAtOnce" | "stopFirst";
    autoDeploy: boolean;
    distribution: string;
    registry?: string | undefined;
    deployKeyPublic?: string | undefined;
    /** The pasted compose file */
    compose?: string | undefined;
    needsPrivateNetwork?: boolean | undefined;
    /** Servers that can't reach the projects this one uses */
    networkWarnings: string[];
    release?: {
        _id: string;
        number: number;
        commit?: {
            sha: string;
            message?: string | undefined;
            author?: string | undefined;
        } | undefined;
    } | undefined;
    /** The active release's containers, for logs and shells */
    containers: {
        server: string;
        serverName: string;
        name: string;
        service: string;
    }[];
    createdAt: string;
    updatedAt: string;
};
export type update$params = {
    id?: string;
};
export type update$body = {
    name?: string | undefined;
    group?: (string | null) | undefined;
    runtime?: {
        port?: (number | undefined) | undefined;
        healthcheckPath?: (string | undefined) | undefined;
        command?: (string[] | undefined) | undefined;
        cpuLimit?: (number | undefined) | undefined;
        memLimitMb?: (number | undefined) | undefined;
        cpuReserve?: number | undefined;
        memReserveMb?: number | undefined;
        healthTimeoutSec?: number | undefined;
    } | undefined;
    servers?: string[] | undefined;
    replicasPerServer?: number | undefined;
    autoscale?: ({
        min: number;
        max: number;
        /** Target CPU per replica, as a percent of its CPU limit (else reservation) */
        cpuPercent?: number | undefined;
        /** Target memory per replica, as a percent of its memory limit (else reservation) */
        memPercent?: number | undefined;
        cooldownSec?: number;
    } | null) | undefined;
    publicPort?: (number | null) | undefined;
    deployStrategy?: ("rolling" | "allAtOnce" | "stopFirst") | undefined;
    autoDeploy?: boolean | undefined;
    needsPrivateNetwork?: boolean | undefined;
    distribution?: ("auto" | "perServer" | "registry") | undefined;
    registry?: (string | null) | undefined;
    branch?: string | undefined;
    templateVersion?: number | undefined;
    inputs?: {
        [K in string]: string | number | boolean;
    } | undefined;
    compose?: string | undefined;
    volumes?: {
        name: string;
        mountPath: string;
        /** S3 storage connection; the volume is local when absent */
        storage?: string | undefined;
        /** Folder in the bucket; <project-slug>/<volume> when empty */
        path?: string | undefined;
    }[] | undefined;
    acknowledgeVolumeRisk?: boolean | undefined;
};
export type update$return = {
    /** Servers or volumes changed: deploy to apply them */
    redeploy: boolean;
};
export type del$params = {
    id?: string;
};
export type deployProject$params = {
    id?: string;
};
export type deployProject$body = {
    noCache?: boolean;
    /** Branch or commit; the project's branch by default */
    ref?: string | undefined;
};
export type deployProject$return = {
    deployment: string;
};
export type rollbackProject$params = {
    id?: string;
};
export type rollbackProject$body = {
    release?: string;
};
export type rollbackProject$return = {
    deployment: string;
};
export type clearCache$params = {
    id?: string;
};
export type releases$params = {
    id?: string;
};
export type releases$return = {
    _id: string;
    number: number;
    commit?: {
        sha: string;
        message?: string | undefined;
        author?: string | undefined;
    } | undefined;
    image?: string | undefined;
    active: boolean;
    createdAt: string;
}[];
export type deployments$params = {
    id?: string;
};
export type deployments$query = {
    page?: number;
};
export type deployments$return = {
    _id: string;
    status: "queued" | "building" | "deploying" | "healthy" | "failed" | "cancelled";
    trigger: "manual" | "push" | "rollback";
    strategy: "rolling" | "allAtOnce" | "stopFirst";
    releaseNumber?: number | undefined;
    commit?: {
        sha: string;
        message?: string | undefined;
        author?: string | undefined;
    } | undefined;
    noCache: boolean;
    errorSummary?: string | undefined;
    createdAt: string;
    startedAt?: string | undefined;
    finishedAt?: string | undefined;
    durationMs?: number | undefined;
}[];
export type deployment$params = {
    deployment?: string;
};
export type deployment$return = {
    _id: string;
    status: "queued" | "building" | "deploying" | "healthy" | "failed" | "cancelled";
    trigger: "manual" | "push" | "rollback";
    strategy: "rolling" | "allAtOnce" | "stopFirst";
    releaseNumber?: number | undefined;
    commit?: {
        sha: string;
        message?: string | undefined;
        author?: string | undefined;
    } | undefined;
    noCache: boolean;
    errorSummary?: string | undefined;
    createdAt: string;
    startedAt?: string | undefined;
    finishedAt?: string | undefined;
    durationMs?: number | undefined;
    project: string;
    distribution?: string | undefined;
    servers: {
        _id: string;
        name: string;
        build?: ("running" | "done" | "failed") | undefined;
        buildError?: string | undefined;
        buildMs?: number | undefined;
        rollout?: ("pending" | "applying" | "healthy" | "failed") | undefined;
    }[];
    phase?: ("rolling" | "prepare" | "switch") | undefined;
};
export type cancelDeployment$params = {
    deployment?: string;
};
export declare const projectsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        list$return: list$return;
        create$body: create$body;
        create$return: create$return;
        placementInfo$return: placementInfo$return;
        get$params: get$params;
        get$return: get$return;
        update$params: update$params;
        update$body: update$body;
        update$return: update$return;
        del$params: del$params;
        deployProject$params: deployProject$params;
        deployProject$body: deployProject$body;
        deployProject$return: deployProject$return;
        rollbackProject$params: rollbackProject$params;
        rollbackProject$body: rollbackProject$body;
        rollbackProject$return: rollbackProject$return;
        clearCache$params: clearCache$params;
        releases$params: releases$params;
        releases$return: releases$return;
        deployments$params: deployments$params;
        deployments$query: deployments$query;
        deployments$return: deployments$return;
        deployment$params: deployment$params;
        deployment$return: deployment$return;
        cancelDeployment$params: cancelDeployment$params;
    };
    readonly list: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<list$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<list$return, any, {}, any>>;
        readonly data: Promise<list$return>;
        then: <TResult1 = list$return, TResult2 = never>(onfulfilled?: ((value: list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<list$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<list$return>;
    };
    readonly create: (data: {
        params?: undefined;
        query?: undefined;
        body: create$body;
    } & TRequestOptions<create$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<create$return, any, {}, any>>;
        readonly data: Promise<create$return>;
        then: <TResult1 = create$return, TResult2 = never>(onfulfilled?: ((value: create$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<create$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<create$return>;
    };
    readonly placementInfo: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<placementInfo$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<placementInfo$return, any, {}, any>>;
        readonly data: Promise<placementInfo$return>;
        then: <TResult1 = placementInfo$return, TResult2 = never>(onfulfilled?: ((value: placementInfo$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<placementInfo$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<placementInfo$return>;
    };
    readonly get: (data: {
        params: get$params;
        query?: undefined;
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
    } & TRequestOptions<update$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<update$return, any, {}, any>>;
        readonly data: Promise<update$return>;
        then: <TResult1 = update$return, TResult2 = never>(onfulfilled?: ((value: update$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<update$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<update$return>;
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
    readonly deployProject: (data: {
        params: deployProject$params;
        query?: undefined;
        body: deployProject$body;
    } & TRequestOptions<deployProject$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<deployProject$return, any, {}, any>>;
        readonly data: Promise<deployProject$return>;
        then: <TResult1 = deployProject$return, TResult2 = never>(onfulfilled?: ((value: deployProject$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<deployProject$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<deployProject$return>;
    };
    readonly rollbackProject: (data: {
        params: rollbackProject$params;
        query?: undefined;
        body: rollbackProject$body;
    } & TRequestOptions<rollbackProject$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<rollbackProject$return, any, {}, any>>;
        readonly data: Promise<rollbackProject$return>;
        then: <TResult1 = rollbackProject$return, TResult2 = never>(onfulfilled?: ((value: rollbackProject$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<rollbackProject$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<rollbackProject$return>;
    };
    readonly clearCache: (data: {
        params: clearCache$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly releases: (data: {
        params: releases$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<releases$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<releases$return, any, {}, any>>;
        readonly data: Promise<releases$return>;
        then: <TResult1 = releases$return, TResult2 = never>(onfulfilled?: ((value: releases$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<releases$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<releases$return>;
    };
    readonly deployments: (data: {
        params: deployments$params;
        query: deployments$query;
        body?: undefined;
    } & TRequestOptions<deployments$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<deployments$return, any, {}, any>>;
        readonly data: Promise<deployments$return>;
        then: <TResult1 = deployments$return, TResult2 = never>(onfulfilled?: ((value: deployments$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<deployments$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<deployments$return>;
    };
    readonly deployment: (data: {
        params: deployment$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<deployment$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<deployment$return, any, {}, any>>;
        readonly data: Promise<deployment$return>;
        then: <TResult1 = deployment$return, TResult2 = never>(onfulfilled?: ((value: deployment$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<deployment$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<deployment$return>;
    };
    readonly cancelDeployment: (data: {
        params: cancelDeployment$params;
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
//# sourceMappingURL=projects.d.ts.map