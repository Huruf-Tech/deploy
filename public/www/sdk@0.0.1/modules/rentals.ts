import type { 
    TRequestOptions,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

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

export const rentalsModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        list$return: list$return,
        request$body: request$body,
        request$return: request$return,
        pay$params: pay$params,
        pay$return: pay$return,
        withdraw$params: withdraw$params,
        resize$params: resize$params,
        resize$body: resize$body,
        withdrawResize$params: withdrawResize$params,
        cancel$params: cancel$params,
        acceptProposal$params: acceptProposal$params,
        acceptProposal$body: acceptProposal$body,
        declineProposal$params: declineProposal$params,
        proposalTargets$params: proposalTargets$params,
        proposalTargets$return: proposalTargets$return,
        dispute$params: dispute$params,
        dispute$body: dispute$body,
        dispute$return: dispute$return,
        rateMachine$params: rateMachine$params,
        rateMachine$body: rateMachine$body,
        report$body: report$body,
    };

    const methods = {
        type,
        list(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<list$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "list");

            const method = "get";
            const toPath = compile("rentals/api/");
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
        request(data: {
        params?: undefined,
        query?: undefined,
        body: request$body,
    } & TRequestOptions<request$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "request");

            const method = "post";
            const toPath = compile("rentals/api/request");
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
        pay(data: {
        params: pay$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<pay$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "pay");

            const method = "post";
            const toPath = compile("rentals/api/:id/pay");
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
        withdraw(data: {
        params: withdraw$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "withdraw");

            const method = "post";
            const toPath = compile("rentals/api/:id/withdraw");
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
        resize(data: {
        params: resize$params,
        query?: undefined,
        body: resize$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "resize");

            const method = "post";
            const toPath = compile("rentals/api/:id/resize");
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
        withdrawResize(data: {
        params: withdrawResize$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "withdrawResize");

            const method = "post";
            const toPath = compile("rentals/api/:id/resize/withdraw");
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
        cancel(data: {
        params: cancel$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "cancel");

            const method = "post";
            const toPath = compile("rentals/api/:id/cancel");
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
        acceptProposal(data: {
        params: acceptProposal$params,
        query?: undefined,
        body: acceptProposal$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "acceptProposal");

            const method = "post";
            const toPath = compile("rentals/api/:id/proposal/accept");
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
        declineProposal(data: {
        params: declineProposal$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "declineProposal");

            const method = "post";
            const toPath = compile("rentals/api/:id/proposal/decline");
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
        proposalTargets(data: {
        params: proposalTargets$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<proposalTargets$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "proposalTargets");

            const method = "get";
            const toPath = compile("rentals/api/:id/proposal/targets");
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
        dispute(data: {
        params: dispute$params,
        query?: undefined,
        body: dispute$body,
    } & TRequestOptions<dispute$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "dispute");

            const method = "post";
            const toPath = compile("rentals/api/:id/dispute");
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
        rateMachine(data: {
        params: rateMachine$params,
        query?: undefined,
        body: rateMachine$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "rateMachine");

            const method = "post";
            const toPath = compile("rentals/api/:id/rate");
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
        report(data: {
        params?: undefined,
        query?: undefined,
        body: report$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentals", "report");

            const method = "post";
            const toPath = compile("rentals/api/report");
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

    (methods.list as any).__scope = "rentals";
    (methods.request as any).__scope = "rentals";
    (methods.pay as any).__scope = "rentals";
    (methods.withdraw as any).__scope = "rentals";
    (methods.resize as any).__scope = "rentals";
    (methods.withdrawResize as any).__scope = "rentals";
    (methods.cancel as any).__scope = "rentals";
    (methods.acceptProposal as any).__scope = "rentals";
    (methods.declineProposal as any).__scope = "rentals";
    (methods.proposalTargets as any).__scope = "rentals";
    (methods.dispute as any).__scope = "rentals";
    (methods.rateMachine as any).__scope = "rentals";
    (methods.report as any).__scope = "rentals";

    sdk["_moduleGroup"].set(methods, "Billing");


    return methods;
};