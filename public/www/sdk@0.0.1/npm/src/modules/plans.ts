import type { 
    TRequestOptions,
    TFilters,
    TPagination,
} from "../types.js";
import type { BaseSDK } from "../base.js";

import { compile } from "path-to-regexp";

export type create$body = {
    name: string;
    kind?: "workspace" | "server";
    resources?: {
        vcpu: number;
        memMb: number;
        diskGb: number;
        trafficGb: number;
    } | undefined;
    custom?: boolean | undefined;
    slug: string;
    description?: string | undefined;
    visibility?: "public" | "private";
    allowedTenants?: string[];
    price: {
        amount: number;
        currency: string;
        interval: "month" | "year";
    };
    limits?: {
        servers?: number;
        projects?: number;
        members?: number;
        releasesKept?: number;
        variablesPerScope?: number;
        deploysPerHour?: number;
        concurrentTerminals?: number;
        concurrentStreams?: number;
        variableApiReadsPerMinute?: number;
        templates?: number;
        alertRules?: number;
        gitIntegrations?: number;
        registries?: number;
        domains?: number;
        aiRequestsPerMonth?: number;
    };
    features?: {
        blueGreen?: boolean;
        autoscale?: boolean;
        privateNetwork?: boolean;
        backups?: boolean;
        aiAssistant?: boolean;
    };
    commission?: number;
    isFree?: boolean;
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
        kind: "workspace" | "server";
        resources?: {
            vcpu: number;
            memMb: number;
            diskGb: number;
            trafficGb: number;
        } | undefined;
        custom?: boolean | undefined;
        slug: string;
        description?: string | undefined;
        visibility: "public" | "private";
        allowedTenants: string[];
        price: {
            amount: number;
            currency: string;
            interval: "month" | "year";
        };
        limits: {
            servers: number;
            projects: number;
            members: number;
            releasesKept: number;
            variablesPerScope: number;
            deploysPerHour: number;
            concurrentTerminals: number;
            concurrentStreams: number;
            variableApiReadsPerMinute: number;
            templates: number;
            alertRules: number;
            gitIntegrations: number;
            registries: number;
            domains: number;
            aiRequestsPerMonth: number;
        };
        features: {
            blueGreen: boolean;
            autoscale: boolean;
            privateNetwork: boolean;
            backups: boolean;
            aiAssistant: boolean;
        };
        commission: number;
        isFree: boolean;
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
    kind?: (("workspace" | "server") | undefined) | undefined;
    resources?: (({
        vcpu: number;
        memMb: number;
        diskGb: number;
        trafficGb: number;
    } | undefined) | undefined) | undefined;
    custom?: ((boolean | undefined) | undefined) | undefined;
    slug?: (string | undefined) | undefined;
    description?: ((string | undefined) | undefined) | undefined;
    visibility?: (("public" | "private") | undefined) | undefined;
    allowedTenants?: (string[] | undefined) | undefined;
    price?: ({
        amount: number;
        currency: string;
        interval: "month" | "year";
    } | undefined) | undefined;
    limits?: ({
        servers?: number;
        projects?: number;
        members?: number;
        releasesKept?: number;
        variablesPerScope?: number;
        deploysPerHour?: number;
        concurrentTerminals?: number;
        concurrentStreams?: number;
        variableApiReadsPerMinute?: number;
        templates?: number;
        alertRules?: number;
        gitIntegrations?: number;
        registries?: number;
        domains?: number;
        aiRequestsPerMonth?: number;
    } | undefined) | undefined;
    features?: ({
        blueGreen?: boolean;
        autoscale?: boolean;
        privateNetwork?: boolean;
        backups?: boolean;
        aiAssistant?: boolean;
    } | undefined) | undefined;
    commission?: (number | undefined) | undefined;
    isFree?: (boolean | undefined) | undefined;
    active?: (boolean | undefined) | undefined;
    sortOrder?: (number | undefined) | undefined;
};
export type del$params = {
    id: string;
};

export const plansModule = (sdk: typeof BaseSDK) => {
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
            sdk.checkPermission("plans", "create");

            const method = "post";
            const toPath = compile("plans/api/");
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
            sdk.checkPermission("plans", "count");

            const method = "get";
            const toPath = compile("plans/api/count");
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
            sdk.checkPermission("plans", "get");

            const method = "get";
            const toPath = compile("plans/api{/:id}");
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
            sdk.checkPermission("plans", "update");

            const method = "patch";
            const toPath = compile("plans/api/:id");
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
            sdk.checkPermission("plans", "del");

            const method = "delete";
            const toPath = compile("plans/api/:id");
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

    (methods.create as any).__scope = "plans";
    (methods.count as any).__scope = "plans";
    (methods.get as any).__scope = "plans";
    (methods.update as any).__scope = "plans";
    (methods.del as any).__scope = "plans";

    sdk["_moduleGroup"].set(methods, "Admin");

    sdk["_moduleMetadata"].set(methods, {"crud":{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":50,"canFilter":true},"kind":{"default":"workspace","canFilter":true,"type":"string","enum":["workspace","server"]},"resources":{"type":"object","properties":{"vcpu":{"type":"number","minimum":0.25,"maximum":64},"memMb":{"type":"integer","minimum":256,"maximum":9007199254740991},"diskGb":{"type":"integer","minimum":5,"maximum":9007199254740991},"trafficGb":{"type":"integer","minimum":0,"maximum":9007199254740991}},"required":["vcpu","memMb","diskGb","trafficGb"],"additionalProperties":false},"custom":{"type":"boolean"},"slug":{"type":"string","minLength":1,"maxLength":50,"pattern":"^[a-z0-9-]+$","canFilter":true},"description":{"type":"string","maxLength":500},"visibility":{"default":"public","canFilter":true,"type":"string","enum":["public","private"]},"allowedTenants":{"default":[],"type":"array","items":{"tsType":"string","ref":"tenants"}},"price":{"type":"object","properties":{"amount":{"type":"integer","minimum":0,"maximum":9007199254740991},"currency":{"type":"string","minLength":3,"maxLength":3},"interval":{"type":"string","enum":["month","year"]}},"required":["amount","currency","interval"],"additionalProperties":false},"limits":{"default":{"servers":5,"projects":20,"members":3,"releasesKept":5,"variablesPerScope":200,"deploysPerHour":30,"concurrentTerminals":1,"concurrentStreams":3,"variableApiReadsPerMinute":60,"templates":10,"alertRules":10,"gitIntegrations":10,"registries":10,"domains":3,"aiRequestsPerMonth":50},"type":"object","properties":{"servers":{"default":5,"type":"integer","minimum":0,"maximum":9007199254740991},"projects":{"default":20,"type":"integer","minimum":0,"maximum":9007199254740991},"members":{"default":3,"type":"integer","minimum":0,"maximum":9007199254740991},"releasesKept":{"default":5,"type":"integer","minimum":1,"maximum":9007199254740991},"variablesPerScope":{"default":200,"type":"integer","minimum":0,"maximum":9007199254740991},"deploysPerHour":{"default":30,"type":"integer","minimum":0,"maximum":9007199254740991},"concurrentTerminals":{"default":1,"type":"integer","minimum":0,"maximum":9007199254740991},"concurrentStreams":{"default":3,"type":"integer","minimum":0,"maximum":9007199254740991},"variableApiReadsPerMinute":{"default":60,"type":"integer","minimum":0,"maximum":9007199254740991},"templates":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"alertRules":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"gitIntegrations":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"registries":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"domains":{"default":3,"type":"integer","minimum":0,"maximum":9007199254740991},"aiRequestsPerMonth":{"default":50,"type":"integer","minimum":0,"maximum":9007199254740991}},"required":["servers","projects","members","releasesKept","variablesPerScope","deploysPerHour","concurrentTerminals","concurrentStreams","variableApiReadsPerMinute","templates","alertRules","gitIntegrations","registries","domains","aiRequestsPerMonth"],"additionalProperties":false},"features":{"default":{"blueGreen":true,"autoscale":true,"privateNetwork":true,"backups":true,"aiAssistant":false},"type":"object","properties":{"blueGreen":{"default":true,"type":"boolean"},"autoscale":{"default":true,"type":"boolean"},"privateNetwork":{"default":true,"type":"boolean"},"backups":{"default":true,"type":"boolean"},"aiAssistant":{"default":false,"type":"boolean"}},"required":["blueGreen","autoscale","privateNetwork","backups","aiAssistant"],"additionalProperties":false},"commission":{"default":20,"type":"number","minimum":0,"maximum":100},"isFree":{"default":false,"canFilter":true,"type":"boolean"},"active":{"default":true,"canFilter":true,"type":"boolean"},"sortOrder":{"default":0,"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991},"createdAt":{"default":"2026-10-28T17:55:06.515Z","canFilter":true,"type":"string","format":"date-time"},"updatedAt":{"default":"2026-10-28T17:55:06.515Z","canFilter":true,"type":"string","format":"date-time"}},"required":["name","kind","slug","visibility","allowedTenants","price","limits","features","commission","isFree","active","sortOrder","createdAt","updatedAt"],"additionalProperties":false},"insertSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":50,"canFilter":true},"kind":{"default":"workspace","canFilter":true,"type":"string","enum":["workspace","server"]},"resources":{"type":"object","properties":{"vcpu":{"type":"number","minimum":0.25,"maximum":64},"memMb":{"type":"integer","minimum":256,"maximum":9007199254740991},"diskGb":{"type":"integer","minimum":5,"maximum":9007199254740991},"trafficGb":{"type":"integer","minimum":0,"maximum":9007199254740991}},"required":["vcpu","memMb","diskGb","trafficGb"]},"custom":{"type":"boolean"},"slug":{"type":"string","minLength":1,"maxLength":50,"pattern":"^[a-z0-9-]+$","canFilter":true},"description":{"type":"string","maxLength":500},"visibility":{"default":"public","canFilter":true,"type":"string","enum":["public","private"]},"allowedTenants":{"type":"array","items":{"tsType":"string","ref":"tenants"}},"price":{"type":"object","properties":{"amount":{"type":"integer","minimum":0,"maximum":9007199254740991},"currency":{"type":"string","minLength":3,"maxLength":3},"interval":{"type":"string","enum":["month","year"]}},"required":["amount","currency","interval"]},"limits":{"default":{"servers":5,"projects":20,"members":3,"releasesKept":5,"variablesPerScope":200,"deploysPerHour":30,"concurrentTerminals":1,"concurrentStreams":3,"variableApiReadsPerMinute":60,"templates":10,"alertRules":10,"gitIntegrations":10,"registries":10,"domains":3,"aiRequestsPerMonth":50},"type":"object","properties":{"servers":{"default":5,"type":"integer","minimum":0,"maximum":9007199254740991},"projects":{"default":20,"type":"integer","minimum":0,"maximum":9007199254740991},"members":{"default":3,"type":"integer","minimum":0,"maximum":9007199254740991},"releasesKept":{"default":5,"type":"integer","minimum":1,"maximum":9007199254740991},"variablesPerScope":{"default":200,"type":"integer","minimum":0,"maximum":9007199254740991},"deploysPerHour":{"default":30,"type":"integer","minimum":0,"maximum":9007199254740991},"concurrentTerminals":{"default":1,"type":"integer","minimum":0,"maximum":9007199254740991},"concurrentStreams":{"default":3,"type":"integer","minimum":0,"maximum":9007199254740991},"variableApiReadsPerMinute":{"default":60,"type":"integer","minimum":0,"maximum":9007199254740991},"templates":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"alertRules":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"gitIntegrations":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"registries":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"domains":{"default":3,"type":"integer","minimum":0,"maximum":9007199254740991},"aiRequestsPerMonth":{"default":50,"type":"integer","minimum":0,"maximum":9007199254740991}}},"features":{"default":{"blueGreen":true,"autoscale":true,"privateNetwork":true,"backups":true,"aiAssistant":false},"type":"object","properties":{"blueGreen":{"default":true,"type":"boolean"},"autoscale":{"default":true,"type":"boolean"},"privateNetwork":{"default":true,"type":"boolean"},"backups":{"default":true,"type":"boolean"},"aiAssistant":{"default":false,"type":"boolean"}}},"commission":{"default":20,"type":"number","minimum":0,"maximum":100},"isFree":{"default":false,"canFilter":true,"type":"boolean"},"active":{"default":true,"canFilter":true,"type":"boolean"},"sortOrder":{"default":0,"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991}},"required":["name","slug","price"]},"updateSchema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1,"maxLength":50,"canFilter":true},"kind":{"type":"string","enum":["workspace","server"]},"resources":{"type":"object","properties":{"vcpu":{"type":"number","minimum":0.25,"maximum":64},"memMb":{"type":"integer","minimum":256,"maximum":9007199254740991},"diskGb":{"type":"integer","minimum":5,"maximum":9007199254740991},"trafficGb":{"type":"integer","minimum":0,"maximum":9007199254740991}},"required":["vcpu","memMb","diskGb","trafficGb"]},"custom":{"type":"boolean"},"slug":{"type":"string","minLength":1,"maxLength":50,"pattern":"^[a-z0-9-]+$","canFilter":true},"description":{"type":"string","maxLength":500},"visibility":{"type":"string","enum":["public","private"]},"allowedTenants":{"type":"array","items":{"tsType":"string","ref":"tenants"}},"price":{"type":"object","properties":{"amount":{"type":"integer","minimum":0,"maximum":9007199254740991},"currency":{"type":"string","minLength":3,"maxLength":3},"interval":{"type":"string","enum":["month","year"]}},"required":["amount","currency","interval"]},"limits":{"type":"object","properties":{"servers":{"default":5,"type":"integer","minimum":0,"maximum":9007199254740991},"projects":{"default":20,"type":"integer","minimum":0,"maximum":9007199254740991},"members":{"default":3,"type":"integer","minimum":0,"maximum":9007199254740991},"releasesKept":{"default":5,"type":"integer","minimum":1,"maximum":9007199254740991},"variablesPerScope":{"default":200,"type":"integer","minimum":0,"maximum":9007199254740991},"deploysPerHour":{"default":30,"type":"integer","minimum":0,"maximum":9007199254740991},"concurrentTerminals":{"default":1,"type":"integer","minimum":0,"maximum":9007199254740991},"concurrentStreams":{"default":3,"type":"integer","minimum":0,"maximum":9007199254740991},"variableApiReadsPerMinute":{"default":60,"type":"integer","minimum":0,"maximum":9007199254740991},"templates":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"alertRules":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"gitIntegrations":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"registries":{"default":10,"type":"integer","minimum":0,"maximum":9007199254740991},"domains":{"default":3,"type":"integer","minimum":0,"maximum":9007199254740991},"aiRequestsPerMonth":{"default":50,"type":"integer","minimum":0,"maximum":9007199254740991}}},"features":{"type":"object","properties":{"blueGreen":{"default":true,"type":"boolean"},"autoscale":{"default":true,"type":"boolean"},"privateNetwork":{"default":true,"type":"boolean"},"backups":{"default":true,"type":"boolean"},"aiAssistant":{"default":false,"type":"boolean"}}},"commission":{"type":"number","minimum":0,"maximum":100},"isFree":{"type":"boolean"},"active":{"type":"boolean"},"sortOrder":{"type":"integer","minimum":-9007199254740991,"maximum":9007199254740991}}}}});

    return methods;
};