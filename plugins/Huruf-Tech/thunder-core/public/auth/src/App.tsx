import React from "react";
import { Outlet, useNavigation, useSearchParams } from "react-router";
import { Toaster } from "sonner";
import { SWRConfig } from "swr";
import { DirectionProvider } from "./components/ui/direction";
import { ConfirmProvider } from "./contexts/Confirm";
import { LoadingProvider, ProgressBar } from "./contexts/Loading";
import { ThemeProvider, useTheme } from "./contexts/Theme";
import { DEFAULT_LOGO, useAppBranding } from "./hooks/useAppBranding";
import { useFavicon } from "./hooks/useFavicon";
import { useLanguage } from "./hooks/useLanguage";
import { applyThemeVars } from "./lib/utils";

function App() {
  const [searchParams] = useSearchParams();

  return (
    <SWRConfig
      value={{
        dedupingInterval: 5000,
        revalidateOnFocus: false,
        revalidateIfStale: true,
        shouldRetryOnError: false,
        revalidateOnReconnect: true,
      }}
    >
      <ThemeProvider initial={searchParams.get("theme")}>
        <Shell language={searchParams.get("lng")} />
      </ThemeProvider>
    </SWRConfig>
  );
}

function Shell({ language }: { language: string | null }) {
  const { app, logo } = useAppBranding();
  const { resolved } = useTheme();
  const { direction } = useLanguage(language);
  const navigation = useNavigation();

  useFavicon(logo, DEFAULT_LOGO);

  React.useEffect(() => {
    if (app?.theme) applyThemeVars(app.theme);
  }, [app]);

  return (
    <DirectionProvider direction={direction}>
      <LoadingProvider>
        <ConfirmProvider>
          {/* Shown while a lazy route chunk is loading */}
          <ProgressBar isLoading={navigation.state === "loading"} />

          <div className="relative isolate flex min-h-svh w-full flex-col">
            <Outlet />
          </div>

          <Toaster
            theme={resolved}
            dir={direction}
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: "!rounded-xl !shadow-lg/5 !font-sans",
                description: "!text-muted-foreground",
              },
            }}
          />
        </ConfirmProvider>
      </LoadingProvider>
    </DirectionProvider>
  );
}

export default App;
