import React from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";
import { resolveURL } from "@/lib/utils";

/** Re-sends the email verification link, tracking the request state. */
export function useResendVerification() {
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");

  const resend = React.useCallback(async (email: string) => {
    setState("sending");
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: resolveURL(
        withSearch("/account", { omit: TRANSIENT_PARAMS }),
      ),
    });

    if (error) {
      setState("idle");
      toast.error(error.message);
    } else setState("sent");
  }, []);

  return { state, resend };
}
