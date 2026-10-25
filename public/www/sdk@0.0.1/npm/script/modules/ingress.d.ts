import type { TRequestOptions } from "../types.js";
import type { BaseSDK } from "../base.js";
export type acmeChallenge$params = {
    token: string;
};
export declare const ingressModule: (sdk: typeof BaseSDK) => {
    readonly type: {
        acmeChallenge$params: acmeChallenge$params;
    };
    readonly acmeChallenge: (data: {
        params: acmeChallenge$params;
        query?: undefined;
        body?: undefined;
    } & TRequestOptions<unknown>) => {
        readonly raw: Promise<import("axios").AxiosResponse<unknown, any, {}, any>>;
        readonly data: Promise<unknown>;
        then: <TResult1 = unknown, TResult2 = never>(onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined) => Promise<TResult1 | TResult2>;
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined) => Promise<unknown>;
        finally: (onfinally?: (() => void) | null | undefined) => Promise<unknown>;
    };
};
//# sourceMappingURL=ingress.d.ts.map