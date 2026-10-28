import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type list$return = {
    status: "requested" | "rejected" | "active" | "pastDue" | "suspended" | "released" | "canceled";
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd?: Date | undefined;
    lastError?: string | undefined;
    startedAt: Date;
    _id: string;
    server?: string | undefined;
    plan?: {
        _id: string;
        name: string;
        /** Cents per month */
        price: number;
    } | undefined;
    size: {
        cpus: number;
        memMb: number;
        diskGb: number;
    };
    machine?: {
        _id: string;
        name: string;
    } | undefined;
    whole?: boolean | undefined;
    term?: {
        months: number;
        until?: Date | undefined;
    } | undefined;
    /** Its owner stops renting it then */
    endAt?: Date | undefined;
    /** Its machine left */
    lostAt?: Date | undefined;
    /** The plan a resize waits for */
    pendingChange?: string | undefined;
    rejectedReason?: string | undefined;
    suspendedAt?: Date | undefined;
    /** Stopped by Huruf, not unpaid */
    held?: boolean | undefined;
    /** This period so far, percent */
    uptime?: number | undefined;
    moving?: boolean | undefined;
    /** A move its owner asks for (PLAN §30.8) */
    proposal?: {
        to: string;
        toName?: string | undefined;
        price: number;
        expiresAt: Date;
        reason?: string | undefined;
    } | undefined;
    /** A dispute is open */
    dispute?: boolean | undefined;
    /** A paid month has ended: it can be rated or disputed */
    matured?: boolean | undefined;
    /** The rating given */
    stars?: number | undefined;
}[];
export type request$body = {
    vcpu?: number | undefined;
    memMb?: number | undefined;
    diskGb?: number | undefined;
    machine?: string;
    whole?: boolean | undefined;
    termMonths: 1 | 3 | 6 | 12;
    /** Agrees it starts at once, so the paid month isn't refundable */
    waiveWithdrawal: boolean;
};
export type request$return = {
    result: "requested" | "active" | "pending";
    rental: string;
    topup?: string | undefined;
    clientSecret?: string | undefined;
};
export type withdraw$params = {
    id?: string;
};
export type resize$params = {
    id?: string;
};
export type resize$body = {
    vcpu: number;
    memMb: number;
    diskGb: number;
};
export type cancel$params = {
    id?: string;
};
export type acceptProposal$params = {
    id?: string;
};
export type acceptProposal$body = {
    to?: string | undefined;
};
export type declineProposal$params = {
    id?: string;
};
export type proposalTargets$params = {
    id?: string;
};
export type proposalTargets$return = {
    server: string;
    name: string;
    /** Cents per month, from the renewal */
    price: number;
}[];
export type dispute$params = {
    id?: string;
};
export type dispute$body = {
    reason: string;
};
export type dispute$return = {
    dispute: string;
};
export type rateMachine$params = {
    id?: string;
};
export type rateMachine$body = {
    stars: number;
    comment?: string | undefined;
};
export type report$body = {
    machine?: string | undefined;
    subscription?: string | undefined;
    text: string;
};
export declare const rentalsModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        list$return: list$return;
        request$body: request$body;
        request$return: request$return;
        withdraw$params: withdraw$params;
        resize$params: resize$params;
        resize$body: resize$body;
        cancel$params: cancel$params;
        acceptProposal$params: acceptProposal$params;
        acceptProposal$body: acceptProposal$body;
        declineProposal$params: declineProposal$params;
        proposalTargets$params: proposalTargets$params;
        proposalTargets$return: proposalTargets$return;
        dispute$params: dispute$params;
        dispute$body: dispute$body;
        dispute$return: dispute$return;
        rateMachine$params: rateMachine$params;
        rateMachine$body: rateMachine$body;
        report$body: report$body;
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
    readonly request: (data: {
        params?: undefined;
        query?: undefined;
        body: request$body;
    } & TRequestOptions<request$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<request$return, any, {}, any>>;
        readonly data: Promise<request$return>;
        then: <TResult1 = request$return, TResult2 = never>(onfulfilled?: ((value: request$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<request$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<request$return>;
    };
    readonly withdraw: (data: {
        params: withdraw$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly resize: (data: {
        params: resize$params;
        query?: undefined;
        body: resize$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly cancel: (data: {
        params: cancel$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly acceptProposal: (data: {
        params: acceptProposal$params;
        query?: undefined;
        body: acceptProposal$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly declineProposal: (data: {
        params: declineProposal$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly proposalTargets: (data: {
        params: proposalTargets$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<proposalTargets$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<proposalTargets$return, any, {}, any>>;
        readonly data: Promise<proposalTargets$return>;
        then: <TResult1 = proposalTargets$return, TResult2 = never>(onfulfilled?: ((value: proposalTargets$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<proposalTargets$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<proposalTargets$return>;
    };
    readonly dispute: (data: {
        params: dispute$params;
        query?: undefined;
        body: dispute$body;
    } & TRequestOptions<dispute$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<dispute$return, any, {}, any>>;
        readonly data: Promise<dispute$return>;
        then: <TResult1 = dispute$return, TResult2 = never>(onfulfilled?: ((value: dispute$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<dispute$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<dispute$return>;
    };
    readonly rateMachine: (data: {
        params: rateMachine$params;
        query?: undefined;
        body: rateMachine$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly report: (data: {
        params?: undefined;
        query?: undefined;
        body: report$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
};
//# sourceMappingURL=rentals.d.ts.map