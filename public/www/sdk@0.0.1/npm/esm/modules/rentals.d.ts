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
    /** The size a waiting resize asks for */
    resizeTo?: string | undefined;
    /** A smaller size (or a move's price) that starts at the renewal */
    nextSize?: {
        plan: string;
        price: number;
        at: Date;
    } | undefined;
    rejectedReason?: string | undefined;
    /** A resize is applying on its machine */
    resizing?: boolean | undefined;
    /** Its machine couldn't apply the latest resize */
    resizeError?: string | undefined;
    /** Cents its renewal needs, when it couldn't be charged */
    amountDue?: number | undefined;
    pastDueSince?: Date | undefined;
    /** Unpaid: when it's stopped (suspended) */
    stopsAt?: Date | undefined;
    /** Suspended for non-payment: when it's deleted with its data */
    deletedAt?: Date | undefined;
    suspendedAt?: Date | undefined;
    /** Stopped by Huruf, not unpaid */
    held?: boolean | undefined;
    /** This period so far, percent */
    uptime?: number | undefined;
    moving?: boolean | undefined;
    /** The community consent's version the renter accepted */
    consentVersion?: string | undefined;
    /** A move its owner asks for (PLAN §30.8) */
    proposal?: {
        to: string;
        toName?: string | undefined;
        community: boolean;
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
    /** A community machine: the version of the consent accepted (its owner can access the data; the renter answers for its leak or loss) */
    communityConsent?: string | undefined;
};
export type request$return = {
    result: "requested" | "active" | "pending";
    rental: string;
    topup?: string | undefined;
    clientSecret?: string | undefined;
};
export type pay$params = {
    id?: string;
};
export type pay$return = {
    result: "active" | "pending";
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
export type withdrawResize$params = {
    id?: string;
};
export type cancel$params = {
    id?: string;
};
export type acceptProposal$params = {
    id?: string;
};
export type acceptProposal$body = {
    to?: string | undefined;
    /** Moving onto a community machine: the consent's version accepted */
    communityConsent?: string | undefined;
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
    /** A community machine, not Huruf's */
    community: boolean;
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
        pay$params: pay$params;
        pay$return: pay$return;
        withdraw$params: withdraw$params;
        resize$params: resize$params;
        resize$body: resize$body;
        withdrawResize$params: withdrawResize$params;
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
    readonly pay: (data: {
        params: pay$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<pay$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<pay$return, any, {}, any>>;
        readonly data: Promise<pay$return>;
        then: <TResult1 = pay$return, TResult2 = never>(onfulfilled?: ((value: pay$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<pay$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<pay$return>;
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
    readonly withdrawResize: (data: {
        params: withdrawResize$params;
        query?: undefined;
        body?: undefined;
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