import type { 
    TRequestOptions,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type suspend$params = {
    id?: string;
};
export type suspend$body = {
    reason?: string | undefined;
};
export type resume$params = {
    id?: string;
};
export type terminate$params = {
    id?: string;
};
export type terminate$body = {
    reason?: string | undefined;
};
export type moveTargets$params = {
    id?: string;
};
export type moveTargets$return = {
    from?: string | undefined;
    moving: boolean;
    /** Rough: a minute plus copying */
    downtimeSec: number;
    targets: {
        server: string;
        name: string;
        free: {
            memMb: number;
            diskGb: number;
        };
        cpuRoom: number;
        fits: boolean;
        /** The source machine can be reached: its address, or the tunnel server */
        reachable: boolean;
    }[];
};
export type move$params = {
    id?: string;
};
export type move$body = {
    to?: string;
};
export type cancelMove$params = {
    id?: string;
};
export type capacity$return = {
    machines: {
        _id: string;
        name: string;
        /** The owner's workspace */
        tenant: string;
        forRent: boolean;
        accepting: boolean;
        allocatable: {
            cpus: number;
            memMb: number;
            diskGb: number;
        };
        rentedMemMb: number;
        /** The owner's own partitions */
        ownMemMb: number;
        freeMemMb: number;
        rentals: number;
        /** Cents per month */
        revenue: number;
        /** Cents per month */
        cost: number;
    }[];
};
export type waiting$return = {
    _id: string;
    tenantName?: string | undefined;
    plan?: string | undefined;
    size: {
        cpus: number;
        memMb: number;
        diskGb: number;
    };
    /** The machine's name */
    host?: string | undefined;
    since: Date;
    /** Why it's stuck; absent while it's being set up */
    error?: string | undefined;
}[];
export type recreatePartition$params = {
    id?: string;
};
export type recreatePartition$body = {
    host?: string | undefined;
};
export type refund$params = {
    id?: string;
};
export type refund$body = {
    reason?: string | undefined;
};
export type refund$return = {
    /** Cents refunded */
    amount: number;
};
export type machine$params = {
    id?: string;
};
export type machine$return = {
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
    accepting: boolean;
    monthlyCost?: number | undefined;
    security: {
        /** Cents held for this machine */
        amount: number;
        /** Its whole monthly price, minus commission */
        cap: number;
    };
    /** Percent, from the workspace plan */
    commission: number;
    rentals: {
        _id: string;
        partition?: string | undefined;
        tenantName?: string | undefined;
        plan?: string | undefined;
        /** Cents per month */
        price: number;
        size: {
            cpus: number;
            memMb: number;
            diskGb: number;
        };
        whole?: boolean | undefined;
        status: string;
        held?: boolean | undefined;
        uptime?: number | undefined;
        overDisk?: number | undefined;
        term?: {
            months: number;
            until?: Date | undefined;
        } | undefined;
        endAt?: Date | undefined;
        /** What starts at the renewal: a smaller size */
        nextSize?: {
            plan: string;
            price: number;
            at: Date;
        } | undefined;
        currentPeriodEnd?: Date | undefined;
        moving?: {
            to: string;
            toName?: string | undefined;
            startedAt: Date;
        } | undefined;
        proposal?: {
            to: string;
            toName?: string | undefined;
            expiresAt: Date;
        } | undefined;
        lastMove?: {
            from: string;
            to: string;
            at: Date;
            error?: string | undefined;
        } | undefined;
    }[];
    /** Cents per month from live rentals */
    revenue: number;
};
export type dispute$params = {
    id?: string;
};
export type dispute$return = {
    dispute: {
        _id: string;
        reason: string;
        status: string;
        createdAt: Date;
        evidence: {
            [K in string]: unknown;
        };
        decision?: {
            refund: number;
            note?: string | undefined;
            at: Date;
        } | undefined;
    };
    /** Cents the machine's money can pay */
    held: {
        unreleased: number;
        security: number;
        total: number;
    };
    rental?: {
        _id: string;
        status: string;
        plan?: string | undefined;
        price: number;
        resources?: {
            vcpu: number;
            memMb: number;
            diskGb: number;
            trafficGb: number;
        } | undefined;
        size: {
            cpus: number;
            memMb: number;
            diskGb: number;
        };
        whole: boolean;
        term?: {
            months: number;
            until?: Date | undefined;
        } | undefined;
        startedAt: Date;
        currentPeriodEnd?: Date | undefined;
        cancelAtPeriodEnd: boolean;
        endAt?: Date | undefined;
        lostAt?: Date | undefined;
        heldByAdmin: boolean;
        waivedWithdrawalAt?: Date | undefined;
        /** When the renter accepted a community machine's risks, and which wording */
        communityConsent?: {
            at: Date;
            version: string;
        } | undefined;
        partition?: string | undefined;
        server?: string | undefined;
        uptimeThisPeriod?: number | undefined;
        lastMove?: {
            at: Date;
            error?: string | undefined;
        } | undefined;
    } | undefined;
    periods: {
        _id: string;
        start: Date;
        end: Date;
        paid: number;
        overage?: number | undefined;
        downtimeMs: number;
        refund?: number | undefined;
        commission?: number | undefined;
        ownerShare?: number | undefined;
        toSecurity?: number | undefined;
        left: boolean;
        settled: boolean;
    }[];
    outages: {
        server: string;
        from: Date;
        to?: Date | undefined;
        ongoing?: boolean | undefined;
        minutes: number;
    }[];
    machine: {
        _id: string;
        name: string;
        owner: string;
        country?: string | undefined;
        publicIp?: string | undefined;
        addedAt: Date;
        allocatable?: {
            cpus: number;
            memMb: number;
            diskGb: number;
        } | undefined;
        forRent: boolean;
        profile: {
            rttMs?: number | undefined;
            uptime30d?: number | undefined;
            uptime90d?: number | undefined;
            steal?: number | undefined;
            virtualization?: string | undefined;
            rating?: number | undefined;
            tier?: string | undefined;
            disk?: string | undefined;
            benchmarkAt?: string | undefined;
            hostCpu?: number | undefined;
        };
        renters?: {
            stars: number;
            count: number;
        } | undefined;
        liveRentals: number;
        disputes: number;
        reports: number;
    } | null;
    customer: {
        _id: string;
        name?: string | undefined;
        createdAt?: Date | undefined;
        ownerName?: string | undefined;
        ownerEmail?: string | undefined;
        rentals: number;
        machinesForRent?: number | undefined;
        disputes: number;
        disputesRefunded: number;
        refundedCents: number;
        reportsMade: number;
        reportsValid: number;
    };
    owner: {
        _id: string;
        name?: string | undefined;
        createdAt?: Date | undefined;
        ownerName?: string | undefined;
        ownerEmail?: string | undefined;
        rentals: number;
        machinesForRent?: number | undefined;
        disputes: number;
        disputesRefunded: number;
        refundedCents: number;
        reportsMade: number;
        reportsValid: number;
    };
    /** The same person on both sides */
    linked: boolean;
};
export type report$params = {
    id?: string;
};
export type report$return = {
    report: {
        _id: string;
        text: string;
        status: string;
        createdAt: Date;
        resolution?: {
            valid: boolean;
            note?: string | undefined;
            at: Date;
        } | undefined;
    };
    reporter: {
        _id: string;
        name?: string | undefined;
        createdAt?: Date | undefined;
        ownerName?: string | undefined;
        ownerEmail?: string | undefined;
        rentals: number;
        machinesForRent?: number | undefined;
        disputes: number;
        disputesRefunded: number;
        refundedCents: number;
        reportsMade: number;
        reportsValid: number;
    };
    /** How the reporter relates to the machine */
    relation: "owner" | "renter" | "none";
    rental?: {
        _id: string;
        status: string;
        plan?: string | undefined;
        customer: string;
        size?: {
            cpus: number;
            memMb: number;
            diskGb: number;
        } | undefined;
        startedAt: Date;
    } | undefined;
    machine: {
        _id: string;
        name: string;
        owner: string;
        country?: string | undefined;
        publicIp?: string | undefined;
        addedAt: Date;
        allocatable?: {
            cpus: number;
            memMb: number;
            diskGb: number;
        } | undefined;
        forRent: boolean;
        profile: {
            rttMs?: number | undefined;
            uptime30d?: number | undefined;
            uptime90d?: number | undefined;
            steal?: number | undefined;
            virtualization?: string | undefined;
            rating?: number | undefined;
            tier?: string | undefined;
            disk?: string | undefined;
            benchmarkAt?: string | undefined;
            hostCpu?: number | undefined;
        };
        renters?: {
            stars: number;
            count: number;
        } | undefined;
        liveRentals: number;
        disputes: number;
        reports: number;
    } | null;
    owner: {
        _id: string;
        name?: string | undefined;
        createdAt?: Date | undefined;
        ownerName?: string | undefined;
        ownerEmail?: string | undefined;
        rentals: number;
        machinesForRent?: number | undefined;
        disputes: number;
        disputesRefunded: number;
        refundedCents: number;
        reportsMade: number;
        reportsValid: number;
    } | null;
    /** Other reports on the same machine or rental */
    earlier: {
        _id: string;
        text: string;
        status: string;
        valid?: boolean | undefined;
        createdAt: Date;
    }[];
};
export type fastForwardStatus$return = {
    enabled: boolean;
};
export type fastForwardSubscription$params = {
    id?: string;
};
export type fastForwardSubscription$body = {
    days: number;
};
export type fastForwardSubscription$return = {
    status: string;
    currentPeriodEnd?: Date | undefined;
    fastForwardDays: number;
};
export type listDisputes$query = {
    status?: ("open" | "resolved" | "all") | undefined;
};
export type listDisputes$return = {
    _id: string;
    subscription: string;
    tenantName?: string | undefined;
    ownerName?: string | undefined;
    machine: string;
    machineName?: string | undefined;
    reason: string;
    status: string;
    evidence: {
        [K in string]: unknown;
    };
    /** Cents the machine's money can pay */
    held: number;
    decision?: {
        refund: number;
        note?: string | undefined;
        at: Date;
    } | undefined;
    createdAt: Date;
}[];
export type resolveDispute$params = {
    id?: string;
};
export type resolveDispute$body = {
    refund: number;
    note?: string | undefined;
};
export type listReverts$return = {
    _id: string;
    ownerName?: string | undefined;
    amount: number;
    /** The claim minus what was charged since */
    max: number;
    claimedAt?: Date | undefined;
    /** The wallet's movements since the claim */
    transactions: {
        type: string;
        amount: number;
        description?: unknown | undefined;
        createdAt?: Date | undefined;
    }[];
    createdAt: Date;
}[];
export type decideRevert$params = {
    id?: string;
};
export type decideRevert$body = {
    /** 0 refuses */
    amount: number;
    note?: string | undefined;
};
export type listReports$query = {
    status?: ("open" | "closed" | "all") | undefined;
};
export type listReports$return = {
    _id: string;
    tenantName?: string | undefined;
    machine?: string | undefined;
    machineName?: string | undefined;
    subscription?: string | undefined;
    text: string;
    status: string;
    /** The admin's verdict, once closed */
    valid?: boolean | undefined;
    closedAt?: Date | undefined;
    createdAt: Date;
}[];
export type closeReport$params = {
    id?: string;
};
export type closeReport$body = {
    /** The report held up */
    valid: boolean;
    note?: string | undefined;
};

export const rentalsAdminModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        suspend$params: suspend$params,
        suspend$body: suspend$body,
        resume$params: resume$params,
        terminate$params: terminate$params,
        terminate$body: terminate$body,
        moveTargets$params: moveTargets$params,
        moveTargets$return: moveTargets$return,
        move$params: move$params,
        move$body: move$body,
        cancelMove$params: cancelMove$params,
        capacity$return: capacity$return,
        waiting$return: waiting$return,
        recreatePartition$params: recreatePartition$params,
        recreatePartition$body: recreatePartition$body,
        refund$params: refund$params,
        refund$body: refund$body,
        refund$return: refund$return,
        machine$params: machine$params,
        machine$return: machine$return,
        dispute$params: dispute$params,
        dispute$return: dispute$return,
        report$params: report$params,
        report$return: report$return,
        fastForwardStatus$return: fastForwardStatus$return,
        fastForwardSubscription$params: fastForwardSubscription$params,
        fastForwardSubscription$body: fastForwardSubscription$body,
        fastForwardSubscription$return: fastForwardSubscription$return,
        listDisputes$query: listDisputes$query,
        listDisputes$return: listDisputes$return,
        resolveDispute$params: resolveDispute$params,
        resolveDispute$body: resolveDispute$body,
        listReverts$return: listReverts$return,
        decideRevert$params: decideRevert$params,
        decideRevert$body: decideRevert$body,
        listReports$query: listReports$query,
        listReports$return: listReports$return,
        closeReport$params: closeReport$params,
        closeReport$body: closeReport$body,
    };

    const methods = {
        type,
        suspend(data: {
        params: suspend$params,
        query?: undefined,
        body: suspend$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "suspend");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/suspend");
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
        resume(data: {
        params: resume$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "resume");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/resume");
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
        terminate(data: {
        params: terminate$params,
        query?: undefined,
        body: terminate$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "terminate");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/terminate");
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
        moveTargets(data: {
        params: moveTargets$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<moveTargets$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "moveTargets");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/:id/move");
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
        move(data: {
        params: move$params,
        query?: undefined,
        body: move$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "move");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/move");
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
        cancelMove(data: {
        params: cancelMove$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "cancelMove");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/move/cancel");
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
        capacity(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<capacity$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "capacity");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/capacity");
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
        waiting(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<waiting$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "waiting");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/waiting");
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
        recreatePartition(data: {
        params: recreatePartition$params,
        query?: undefined,
        body: recreatePartition$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "recreatePartition");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/partition");
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
        refund(data: {
        params: refund$params,
        query?: undefined,
        body: refund$body,
    } & TRequestOptions<refund$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "refund");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/refund");
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
        machine(data: {
        params: machine$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<machine$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "machine");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/machines/:id");
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
        body?: undefined,
    } & TRequestOptions<dispute$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "dispute");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/disputes/:id");
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
        params: report$params,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<report$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "report");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/reports/:id");
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
        fastForwardStatus(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<fastForwardStatus$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "fastForwardStatus");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/fastForward");
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
        fastForwardSubscription(data: {
        params: fastForwardSubscription$params,
        query?: undefined,
        body: fastForwardSubscription$body,
    } & TRequestOptions<fastForwardSubscription$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "fastForwardSubscription");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/:id/fastForward");
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
        listDisputes(data: {
        params?: undefined,
        query: listDisputes$query,
        body?: undefined,
    } & TRequestOptions<listDisputes$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "listDisputes");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/disputes");
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
        resolveDispute(data: {
        params: resolveDispute$params,
        query?: undefined,
        body: resolveDispute$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "resolveDispute");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/disputes/:id/resolve");
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
        listReverts(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<listReverts$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "listReverts");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/reverts");
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
        decideRevert(data: {
        params: decideRevert$params,
        query?: undefined,
        body: decideRevert$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "decideRevert");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/reverts/:id/decide");
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
        listReports(data: {
        params?: undefined,
        query: listReports$query,
        body?: undefined,
    } & TRequestOptions<listReports$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "listReports");

            const method = "get";
            const toPath = compile("rentalsAdmin/api/reports");
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
        closeReport(data: {
        params: closeReport$params,
        query?: undefined,
        body: closeReport$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("rentalsAdmin", "closeReport");

            const method = "post";
            const toPath = compile("rentalsAdmin/api/reports/:id/close");
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

    (methods.suspend as any).__scope = "rentalsAdmin";
    (methods.resume as any).__scope = "rentalsAdmin";
    (methods.terminate as any).__scope = "rentalsAdmin";
    (methods.moveTargets as any).__scope = "rentalsAdmin";
    (methods.move as any).__scope = "rentalsAdmin";
    (methods.cancelMove as any).__scope = "rentalsAdmin";
    (methods.capacity as any).__scope = "rentalsAdmin";
    (methods.waiting as any).__scope = "rentalsAdmin";
    (methods.recreatePartition as any).__scope = "rentalsAdmin";
    (methods.refund as any).__scope = "rentalsAdmin";
    (methods.machine as any).__scope = "rentalsAdmin";
    (methods.dispute as any).__scope = "rentalsAdmin";
    (methods.report as any).__scope = "rentalsAdmin";
    (methods.fastForwardStatus as any).__scope = "rentalsAdmin";
    (methods.fastForwardSubscription as any).__scope = "rentalsAdmin";
    (methods.listDisputes as any).__scope = "rentalsAdmin";
    (methods.resolveDispute as any).__scope = "rentalsAdmin";
    (methods.listReverts as any).__scope = "rentalsAdmin";
    (methods.decideRevert as any).__scope = "rentalsAdmin";
    (methods.listReports as any).__scope = "rentalsAdmin";
    (methods.closeReport as any).__scope = "rentalsAdmin";

    sdk["_moduleGroup"].set(methods, "Admin");


    return methods;
};