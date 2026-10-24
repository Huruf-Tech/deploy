import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
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
export declare const meModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        get$return: get$return;
        setPhoneNumber$body: setPhoneNumber$body;
        verifyPhoneNumber$body: verifyPhoneNumber$body;
    };
    readonly get: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<get$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<get$return, any, {}, any>>;
        readonly data: Promise<get$return>;
        then: <TResult1 = get$return, TResult2 = never>(onfulfilled?: ((value: get$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<get$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<get$return>;
    };
    readonly setPhoneNumber: (data: {
        params?: undefined;
        query?: undefined;
        body: setPhoneNumber$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
    readonly verifyPhoneNumber: (data: {
        params?: undefined;
        query?: undefined;
        body: verifyPhoneNumber$body;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
};
//# sourceMappingURL=me.d.ts.map