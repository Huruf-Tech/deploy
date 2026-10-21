import type { 
    TRequestOptions,
    TFilterValue,
    TFilterExpression,
    TMultiFilters,
    TFilters,
    TPagination,
} from "../types.ts";
import type { BaseSDK } from "../base.ts";

import { compile } from "path-to-regexp";

export type get$return = {
    name: string;
    image?: string | undefined;
    email: string;
    fcmTokens?: string[] | undefined;
    emailVerified: boolean;
    phoneNumber?: string | undefined;
    phoneNumberVerified?: boolean | undefined;
    phoneNumberVerificationCode?: string | undefined;
    phoneNumberVerificationRequestAt?: Date | undefined;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    _id: string;
};
export type setPhoneNumber$body = {
    phoneNumber: string;
};
export type verifyPhoneNumber$body = {
    code: string;
};

export const meModule = (sdk: typeof BaseSDK) => {
    const type = {} as unknown as {
        get$return: get$return,
        setPhoneNumber$body: setPhoneNumber$body,
        verifyPhoneNumber$body: verifyPhoneNumber$body,
    };

    const methods = {
        type,
        get(data?: {
        params?: undefined,
        query?: undefined,
        body?: undefined,
    } & TRequestOptions<get$return>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("me", "get");

            const method = "get";
            const toPath = compile("me/api/");
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
        setPhoneNumber(data: {
        params?: undefined,
        query?: undefined,
        body: setPhoneNumber$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("me", "setPhoneNumber");

            const method = "patch";
            const toPath = compile("me/api/phone-number");
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
        verifyPhoneNumber(data: {
        params?: undefined,
        query?: undefined,
        body: verifyPhoneNumber$body,
    } & TRequestOptions<unknown>) {
        return sdk.resolveAxiosResponse(async () => {
            sdk.checkPermission("me", "verifyPhoneNumber");

            const method = "patch";
            const toPath = compile("me/api/phone-number/verify");
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

    (methods.get as any).__scope = "me";
    (methods.setPhoneNumber as any).__scope = "me";
    (methods.verifyPhoneNumber as any).__scope = "me";



    return methods;
};