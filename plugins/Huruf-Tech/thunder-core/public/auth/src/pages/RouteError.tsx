import { CircleAlertIcon, RefreshCcwIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "@/components/ui/button";

/**
 * Last-resort boundary for errors thrown while rendering a route. It renders
 * outside the providers in <App />, so it must stay dependency-free.
 */
function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : String(error);

  // A deploy replaced the lazy chunks this tab was built against.
  const staleChunk =
    /dynamically imported module|Importing a module script/i.test(message);

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-xs/5">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <CircleAlertIcon className="size-6" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold">
            {staleChunk
              ? t("A new version is available")
              : t("Something went wrong")}
          </h1>
          <p className="text-sm break-words text-muted-foreground">
            {staleChunk
              ? t("Reload the page to get the latest version.")
              : message}
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCcwIcon />
          {t("Reload page")}
        </Button>
      </div>
    </div>
  );
}

export default RouteError;
