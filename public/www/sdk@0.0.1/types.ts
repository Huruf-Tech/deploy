import type { AxiosRequestConfig, CreateAxiosDefaults } from "axios";

export type TCacheSetter = (key: string, value: string) => boolean | Promise<boolean>;
export type TCacheGetter = (key: string) => string | undefined | Promise<string | undefined>;
export type TCacheDelete = (key: string) => boolean | Promise<boolean>;
export type TCacheKeys = () => string[] | Promise<string[]>;

export type TSDKOptions = {
    axiosConfig?: CreateAxiosDefaults,
    cache?: {
        setter: TCacheSetter,
        getter: TCacheGetter,
        delete: TCacheDelete,
        keys?: TCacheKeys
    },
    logs?: boolean
};

export type TCacheKey = string | [string, ...(string | undefined)[]];

export type TCacheOptions<T> = {
    cacheKey?: TCacheKey;
    cacheTTL?: number | ((data: T, timestamp: number) => number);
};

export type TRequestOptions<T> = {
    axiosConfig?: Omit<
        AxiosRequestConfig<unknown>,
        "method" | "url" | "data" | "params"
    >;
    signal?: AbortSignal
} & TCacheOptions<T>;

export type TFilterValue = {
    type: "string" | "number" | "boolean" | "objectId" | "date" | "regex" | "null";
    value: string;
    options?: {
        regexFlags?: string | undefined;
    } | undefined;
} | string;
export type TFilterExpression = {
    $exists?: TFilterValue | undefined;
    $eq?: TFilterValue | undefined;
    $ne?: TFilterValue | undefined;
    $gt?: TFilterValue | undefined;
    $gte?: TFilterValue | undefined;
    $lt?: TFilterValue | undefined;
    $lte?: TFilterValue | undefined;
    $mod?: [
        number,
        number
    ] | undefined;
    $regex?: TFilterValue | undefined;
    $in?: TFilterValue[] | undefined;
    $nin?: TFilterValue[] | undefined;
    $all?: TFilterValue[] | undefined;
};
export type TMultiFilters = {
    $and?: Record<string, {
        $not: TFilterExpression;
    } | TFilterExpression>[] | undefined;
    $or?: Record<string, {
        $not: TFilterExpression;
    } | TFilterExpression>[] | undefined;
};
export type TFilters = Record<string, {
    $not: TFilterExpression;
} | TFilterExpression> | TMultiFilters;
export type TPagination = {
    /** Client side filters */
    filters?: TFilters | undefined;
    /** Client side sub-filters (Just a second layer of filters) */
    subFilters?: TFilters | undefined;
    offset?: number;
    limit?: number;
    /** Provide a sorting information in mongodb sort object format */
    sort?: Record<string, number>;
    /** Provide a projection information in mongodb project object format */
    project?: Record<string, number | {
        $slice: number | [
            number,
            number
        ];
    }> | undefined;
};
