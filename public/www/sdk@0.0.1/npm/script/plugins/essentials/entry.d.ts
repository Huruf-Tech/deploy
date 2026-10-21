/**
 * This SDK plugin is used within SDK generation process
 * You cannot import any files from thunder or any of its sources here cause it will not work.
 * Your code should be isolated in the this/current folder.
 */
export declare class essentialsEntry {
    protected static tenantInterceptorId?: number;
    protected static authInterceptorIds: number[];
    protected static refreshTokenPromise?: Promise<void>;
    protected static accessTokenPromise?: Promise<string | null>;
    protected static tenant?: string;
    static setTenant(tenant: string): void;
    static getTenant(): string | undefined;
    static removeTenant(): void;
    static registerAuthInterceptors(getAccessToken: () => Promise<string | null>, refreshAccessToken?: () => Promise<void>): void;
    static unregisterAuthInterceptors(): void;
    static registerPermissions(): Promise<void>;
    static unregisterPermissions(): void;
    static clean(): void;
}
