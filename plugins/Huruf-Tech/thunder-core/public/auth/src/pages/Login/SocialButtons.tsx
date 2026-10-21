import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCapabilities } from "@/hooks/useCapabilities";
import { authClient } from "@/lib/auth";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";
import { authProviders, isProviderId, type TProviderId } from "@/lib/providers";
import { cn, resolveURL } from "@/lib/utils";

export function useEnabledProviders() {
  const { capabilities } = useCapabilities();

  return React.useMemo(
    () => (capabilities ?? []).filter(isProviderId),
    [capabilities],
  );
}

/** One button per enabled social provider; redirects to the provider. */
export function SocialButtons({
  mode = "signin",
}: {
  mode?: "signin" | "signup";
}) {
  const { t } = useTranslation();
  const providers = useEnabledProviders();
  const [pending, setPending] = React.useState<TProviderId | null>(null);

  if (providers.length === 0) return null;

  const signIn = async (provider: TProviderId) => {
    setPending(provider);

    // The provider redirects back to us; keep the OAuth / redirect params.
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: resolveURL(
        withSearch("/account", { omit: TRANSIENT_PARAMS }),
      ),
      errorCallbackURL: resolveURL(
        withSearch("/login", { omit: TRANSIENT_PARAMS }),
      ),
      newUserCallbackURL: resolveURL(
        withSearch("/account", { omit: TRANSIENT_PARAMS }),
      ),
    });

    if (error) {
      setPending(null);
      toast.error(error.message);
    }
  };

  const compact = providers.length > 2;

  return (
    <div
      className={cn("grid gap-2.5", compact ? "grid-cols-3" : "grid-cols-1")}
    >
      {providers.map((id) => {
        const provider = authProviders[id];
        const label =
          mode === "signup"
            ? t("Sign up with {{provider}}", { provider: provider.label })
            : t("Continue with {{provider}}", { provider: provider.label });

        return (
          <Button
            key={id}
            variant="outline"
            size="lg"
            className="w-full"
            disabled={pending !== null}
            onClick={() => signIn(id)}
            aria-label={label}
            title={compact ? label : undefined}
          >
            {pending === id ? (
              <Spinner />
            ) : (
              <img
                src={provider.icon}
                alt=""
                className={cn("size-4.5", provider.invert && "dark:invert")}
              />
            )}
            {!compact && label}
          </Button>
        );
      })}
    </div>
  );
}
