import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_LOGO, useAppBranding } from "@/hooks/useAppBranding";
import { cn } from "@/lib/utils";

/** The project's logo from branding, falling back to the Huruf logo. */
export function BrandLogo({
  className,
  showName = false,
}: {
  className?: string;
  showName?: boolean;
}) {
  const { isLoading, appName, logo } = useAppBranding();

  if (isLoading)
    return (
      <div className="flex items-center gap-2.5">
        <Skeleton className={cn("size-9 rounded-xl", className)} />
        {showName && <Skeleton className="h-4 w-24" />}
      </div>
    );

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar className={cn("size-9 rounded-xl bg-transparent", className)}>
        <AvatarImage src={logo} alt={appName} className="object-contain" />
        {/* Shown if the project's logo URL fails to load */}
        <AvatarFallback className="rounded-[inherit] bg-transparent">
          <img
            src={DEFAULT_LOGO}
            alt={appName}
            className="size-full object-contain"
          />
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className="truncate text-[15px] font-semibold tracking-tight">
          {appName}
        </span>
      )}
    </div>
  );
}
