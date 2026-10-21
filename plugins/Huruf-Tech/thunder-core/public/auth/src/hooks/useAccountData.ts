import useSWR from "swr";
import { authClient } from "@/lib/auth";
import { useCapabilities } from "./useCapabilities";

/**
 * Account-scoped queries. Keys include the user id so switching between
 * multi-session accounts never shows the previous account's data.
 */
function useUserId() {
  const { data } = authClient.useSession();
  return data?.user.id;
}

async function unwrap<T>(
  request: Promise<{ data: T | null; error: { message?: string } | null }>,
) {
  const { data, error } = await request;
  if (error) throw new Error(error.message ?? "Request failed");
  return data as T;
}

export function usePasskeys() {
  const userId = useUserId();
  const { has } = useCapabilities();

  return useSWR(userId && has("passkey") ? ["passkeys", userId] : null, () =>
    unwrap(authClient.passkey.listUserPasskeys()),
  );
}

export function useSessions() {
  const userId = useUserId();

  return useSWR(userId ? ["sessions", userId] : null, () =>
    unwrap(authClient.listSessions()),
  );
}

export function useLinkedAccounts() {
  const userId = useUserId();

  return useSWR(userId ? ["accounts", userId] : null, () =>
    unwrap(authClient.listAccounts()),
  );
}
