import { CheckIcon, LogOutIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import useSWR from "swr";
import { UserAvatar } from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoading } from "@/contexts/Loading";
import { useCapabilities } from "@/hooks/useCapabilities";
import { authClient } from "@/lib/auth";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";

/** Avatar menu: switch between signed-in accounts, add one, sign out. */
export function AccountMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setLoading } = useLoading();
  const { has } = useCapabilities();
  const { data: session } = authClient.useSession();
  const multiSession = has("multiSession");

  const {
    data: deviceSessions,
    isLoading,
    mutate,
  } = useSWR(
    multiSession && session ? ["deviceSessions", session.session.id] : null,
    async () => (await authClient.multiSession.listDeviceSessions()).data ?? [],
  );

  const others = (deviceSessions ?? []).filter(
    (s) => s.session.token !== session?.session.token,
  );

  const run = async (
    action: () => Promise<{ error: { message?: string } | null }>,
  ) => {
    setLoading(true);
    const { error } = await action().finally(() => setLoading(false));
    if (error) toast.error(error.message);
    else void mutate();
  };

  const signOutCurrent = () =>
    // With other accounts signed in, revoking this one switches to the next.
    others.length > 0 && session
      ? run(() =>
          authClient.multiSession.revoke({
            sessionToken: session.session.token,
          }),
        )
      : run(() => authClient.signOut());

  if (!session) return null;
  const { user } = session;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Account menu")}
        className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <UserAvatar
          size={34}
          name={user.name}
          email={user.email}
          image={user.image}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-72 p-1.5">
        <div className="flex items-center gap-3 px-2 py-2">
          <UserAvatar
            size={40}
            name={user.name}
            email={user.email}
            image={user.image}
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
          <CheckIcon className="ms-auto size-4 text-primary" />
        </div>

        {multiSession && (
          <>
            {isLoading ? (
              <div className="flex items-center gap-3 px-2 py-2">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : others.length > 0 ? (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center gap-1.5 text-xs">
                  <UsersIcon className="size-3.5" />
                  {t("Switch account")}
                </DropdownMenuLabel>
                {others.map(({ session: s, user: u }) => (
                  <DropdownMenuItem
                    key={s.token}
                    className="gap-3 py-1.5"
                    onClick={() =>
                      run(() =>
                        authClient.multiSession.setActive({
                          sessionToken: s.token,
                        }),
                      )
                    }
                  >
                    <UserAvatar
                      size={30}
                      name={u.name}
                      email={u.email}
                      image={u.image}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{u.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {u.email}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ) : null}

            <DropdownMenuItem
              onClick={() =>
                navigate(
                  withSearch("/login", {
                    omit: TRANSIENT_PARAMS,
                    set: { addAccount: "1" },
                  }),
                )
              }
            >
              <UserPlusIcon />
              {t("Add another account")}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOutCurrent}>
          <LogOutIcon />
          {t("Sign out")}
        </DropdownMenuItem>
        {others.length > 0 && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => run(() => authClient.signOut())}
          >
            <LogOutIcon />
            {t("Sign out of all accounts")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
