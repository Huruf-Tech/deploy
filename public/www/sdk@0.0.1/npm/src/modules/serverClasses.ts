import type { 
    TRequestOptions,
    TFilters,
    TPagination,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type create$body = {
    name: string;
    description?: string | undefined;
    family?: string | undefined;
    rates: {
        vcpu: number;
        memGb: number;
        diskGb: number;
        trafficGb: number;
        fixed: number;
    };
    includedTrafficPerVcpu?: number;
    cpuOvercommit?: number;
    maxPerRental?: {
        vcpu: number;
        memMb: number;
        diskGb: number;
    };
    active?: boolean;
    sortOrder?: number;
};
export type create$return = {
    _id: string;
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
        description?: string | undefined;
        family?: string | undefined;
        rates: {
            vcpu: number;
            memGb: number;
            diskGb: number;
            trafficGb: number;
            fixed: number;
        };
        includedTrafficPerVcpu: number;
        cpuOvercommit: number;
        maxPerRental: {
            vcpu: number;
            memMb: number;
            diskGb: number;
        };
        active: boolean;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
        _id: string;
    }[];
};
export type update$params = {
    id: string;
};
export type update$body = {
    name?: (string | undefined) | undefined;
    description?: ((string | undefined) | undefined) | undefined;
    family?: ((string | undefined) | undefined) | undefined;
    rates?: ({
        vcpu: number;
        memGb: number;
        diskGb: number;
        trafficGb: number;
        fixed: number;
    } | undefined) | undefined;
    includedTrafficPerVcpu?: (number | undefined) | undefined;
    cpuOvercommit?: (number | undefined) | undefined;
    maxPerRental?: ({
        vcpu: number;
        memMb: number;
        diskGb: number;
    } | undefined) | undefined;
    active?: (boolean | undefined) | undefined;
    sortOrder?: (number | undefined) | undefined;
};
export type del$params = {
    id: string;
};

export const serverClassesModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        create$body: create$body,
        create$return: create$return,
        count$query: count$query,
        count$return: count$return,
        get$params: get$params,
        get$query: get$query,
        get$return: get$return,
        update$params: update$params,
        update$body: update$body,
        del$params: del$params,
    };

    const methods = {
        type,
        create(data: {
        params?: undefined,
        query?: undefined,
        body: create$body,
    } & TRequestOptions<create$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("serverClasses", "create");

            const method = "post";
            const toPath = compile("serverClasses/api/");
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
        count(data: {
        params?: undefined,
        query: count$query,
        body?: undefined,
    } & TRequestOptions<count$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("serverClasses", "count");

            const method = "get";
            const toPath = compile("serverClasses/api/count");
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
            sdk.checkPermission("serverClasses", "get");

            const method = "get";
            const toPath = compile("serverClasses/api{/:id}");
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
            sdk.checkPermission("serverClasses", "update");

            const method = "patch";
            const toPath = compile("serverClasses/api/:id");
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
            sdk.checkPermission("serverClasses", "del");

            const method = "delete";
            const toPath = compile("serverClasses/api/:id");
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

    (methods.create as any).__scope = "serverClasses";
    (methods.count as any).__scope = "serverClasses";
    (methods.get as any).__scope = "serverClasses";
    (methods.update as any).__scope = "serverClasses";
    (methods.del as any).__scope = "serverClasses";

    sdk["_moduleGroup"].set(methods, "Admin");

    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":50,"canFilter":true},"description":{"type":"string","maxLength":300},"family":{"type":"string","maxLength":30},"rates":{"type":"object","properties":{"vcpu":{"type":"integer","minimum":0,"maximum":9007199254740991},"memGb":{"type":"integer","minimum":0,"maximum":9007199254740991},"diskGb":{"type":"integer","minimum":0,"maximum":9007199254740991},"trafficGb":{"type":"integer","minimum":0,"maximum":9007199254740991},"fixed":{"type":"integer","minimum":0,"maximum":9007199254740991}},"required":["vcpu","memGb","diskGb","trafficGb","fixed"],"additionalProperties":false},"includedTrafficPerVcpu":{"default":100,"type":"integer","minimum":0,"maximum":9007199254740991},"cpuOvercommit":{"default":1,"type":"number","minimum":1,"maximum":8},"maxPerRental":{"default":{"vcpu":4,"memMb":8192,"diskGb":160},"type":"object","properties":{"vcpu":{"type":"number","minimum":0.5},"memMb":{"type":"integer","minimum":512,"maximum":9007199254740991},"diskGb":{"type":"integer","minimum":5,"maximum":9007199254740991}},"required":["vcpu","memMb","diskGb"],"additionalProperties":false},"active":{"default":true,"canFilter":true,"type":"boolean"},"sortOrder":{"default":0,"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991},"createdAt":{"default":"2026-10-28T08:38:22.500Z","type":"string","format":"date-time"},"updatedAt":{"default":"2026-10-28T08:38:22.500Z","type":"string","format":"date-time"}},"required":["name","rates","includedTrafficPerVcpu","cpuOvercommit","maxPerRental","active","sortOrder","createdAt","updatedAt"],"additionalProperties":false},"insertSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":50,"canFilter":true},"description":{"type":"string","maxLength":300},"family":{"type":"string","maxLength":30},"rates":{"type":"object","properties":{"vcpu":{"type":"integer","minimum":0,"maximum":9007199254740991},"memGb":{"type":"integer","minimum":0,"maximum":9007199254740991},"diskGb":{"type":"integer","minimum":0,"maximum":9007199254740991},"trafficGb":{"type":"integer","minimum":0,"maximum":9007199254740991},"fixed":{"type":"integer","minimum":0,"maximum":9007199254740991}},"required":["vcpu","memGb","diskGb","trafficGb","fixed"]},"includedTrafficPerVcpu":{"default":100,"type":"integer","minimum":0,"maximum":9007199254740991},"cpuOvercommit":{"default":1,"type":"number","minimum":1,"maximum":8},"maxPerRental":{"default":{"vcpu":4,"memMb":8192,"diskGb":160},"type":"object","properties":{"vcpu":{"type":"number","minimum":0.5},"memMb":{"type":"integer","minimum":512,"maximum":9007199254740991},"diskGb":{"type":"integer","minimum":5,"maximum":9007199254740991}},"required":["vcpu","memMb","diskGb"]},"active":{"default":true,"canFilter":true,"type":"boolean"},"sortOrder":{"default":0,"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991}},"required":["name","rates"]},"updateSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":50,"canFilter":true},"description":{"type":"string","maxLength":300},"family":{"type":"string","maxLength":30},"rates":{"type":"object","properties":{"vcpu":{"type":"integer","minimum":0,"maximum":9007199254740991},"memGb":{"type":"integer","minimum":0,"maximum":9007199254740991},"diskGb":{"type":"integer","minimum":0,"maximum":9007199254740991},"trafficGb":{"type":"integer","minimum":0,"maximum":9007199254740991},"fixed":{"type":"integer","minimum":0,"maximum":9007199254740991}},"required":["vcpu","memGb","diskGb","trafficGb","fixed"]},"includedTrafficPerVcpu":{"type":"integer","minimum":0,"maximum":9007199254740991},"cpuOvercommit":{"type":"number","minimum":1,"maximum":8},"maxPerRental":{"type":"object","properties":{"vcpu":{"type":"number","minimum":0.5},"memMb":{"type":"integer","minimum":512,"maximum":9007199254740991},"diskGb":{"type":"integer","minimum":5,"maximum":9007199254740991}},"required":["vcpu","memMb","diskGb"]},"active":{"type":"boolean"},"sortOrder":{"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991}}}}});

    return methods;
};