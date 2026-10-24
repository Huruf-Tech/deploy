import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type list$query = {
    open?: ("true" | "false") | undefined;
    limit?: number;
};
export type list$return = {
    rule: string;
    ruleName: string;
    metric: "cpu" | "memory" | "disk" | "room" | "agentOffline" | "deployFailed" | "cpCpu" | "cpMemory" | "cpPollLatency" | "cpErrorRate" | "cpPollsMissing";
    threshold: number;
    server?: string | undefined;
    project?: string | undefined;
    instance?: string | undefined;
    firedAt: Date;
    resolvedAt?: Date | undefined;
    value?: number | undefined;
    detail?: string | undefined;
    delivery: {
        notice: "fired" | "resolved";
        status: "pending" | "sent" | "failed";
        attempts: number;
        nextAttemptAt: Date;
        claimedUntil?: Date | undefined;
        error?: string | undefined;
    };
    _id: string;
    open: boolean;
    serverName?: string | undefined;
    projectName?: string | undefined;
}[];
export declare const alertEventsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        list$query: list$query;
        list$return: list$return;
    };
    readonly list: (data: {
        params?: undefined;
        query: list$query;
        body?: undefined;
    } & TRequestOptions<list$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<list$return, any, {}, any>>;
        readonly data: Promise<list$return>;
        then: <TResult1 = list$return, TResult2 = never>(onfulfilled?: ((value: list$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<list$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<list$return>;
    };
};
//# sourceMappingURL=alertEvents.d.ts.map