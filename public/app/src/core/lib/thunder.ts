import type { AxiosError, AxiosResponse } from "axios";
import { ThunderSDK } from "thunder-sdk";
import { toast } from "sonner";

type TErrorBody = { messages?: { message: string }[] };

/** Ejects the interceptor registered by the previous `initThunder()` call. */
let ejectErrorInterceptor: (() => void) | undefined;

/**
 * Surfaces server-sent error messages as toasts.
 *
 * This has to run for every SDK instance, including the first one created at
 * boot. It previously ran only inside `refreshThunder()`, whose sole caller is
 * `useLogout()` — which then sets `window.location.href`, so the interceptor was
 * torn down by the page reload a moment later and never actually fired.
 */
const registerErrorInterceptor = () => {
    ejectErrorInterceptor?.();
    ejectErrorInterceptor = undefined;

    const axios = ThunderSDK._axios;

    if (!axios) return;

    const id = axios.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError<TErrorBody>) => {
            const messages = error.response?.data?.messages;

            if (messages?.length) {
                for (const { message } of messages) toast.error(message);
            } else if (
                // A request aborted by an AbortController is routine here (every
                // list page cancels in flight), so it must never raise a toast.
                error.code !== "ERR_CANCELED" &&
                error.message !== "canceled"
            ) {
                toast.error(error.message);
            }

            return Promise.reject(error);
        },
    );

    ejectErrorInterceptor = () => axios.interceptors.response.eject(id);
};

export const initThunder = async () => {
    const instance = await ThunderSDK.init({
        logs: import.meta.env.DEV,
        axiosConfig: {
            baseURL: import.meta.env.VITE_API_BASE_URL ||
                window.location.origin,
            withCredentials: true,
        },
        cache: {
            getter: (key: string) => localStorage.getItem(key) || undefined,
            setter: (key: string, value: string) => {
                localStorage.setItem(key, value);
                return true;
            },
            delete: async (key: string) => {
                localStorage.removeItem(key);
                return true;
            },
            keys: () => Object.keys(localStorage),
        },
    });

    registerErrorInterceptor();

    return instance;
};

export const cleanThunder = () => ThunderSDK.clean();

export const refreshThunder = async () => {
    await cleanThunder();
    await initThunder();
};
