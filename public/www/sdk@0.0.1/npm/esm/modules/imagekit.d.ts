import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type auth$return = {
    token: string;
    expire: number;
    signature: string;
    publicKey: string;
};
export declare const imageKitModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        auth$return: auth$return;
    };
    readonly auth: (data?: {
        params?: undefined;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<auth$return>) => {
        readonly raw: Promise<import("axios").AxiosResponse<auth$return, any, {}, any>>;
        readonly data: Promise<auth$return>;
        then: <TResult1 = auth$return, TResult2 = never>(onfulfilled?: ((value: auth$return) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<auth$return | TResult>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<auth$return>;
    };
};
//# sourceMappingURL=imagekit.d.ts.map