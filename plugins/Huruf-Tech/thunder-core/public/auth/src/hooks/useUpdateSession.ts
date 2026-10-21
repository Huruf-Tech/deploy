import React from "react";
import { authClient } from "@/lib/auth";
import { getDeviceInfo } from "@/lib/utils";

/** Attaches client-hint device details (model, platform) to the session once. */
export function useUpdateSession(sessionId?: string) {
  React.useEffect(() => {
    if (!sessionId) return;

    void (async () => {
      const device = await getDeviceInfo().catch(() => undefined);
      if (!device) return;

      const { error } = await authClient.updateSession({
        device,
      } as Parameters<typeof authClient.updateSession>[0]);
      if (error) console.error(error);
    })();
  }, [sessionId]);
}
