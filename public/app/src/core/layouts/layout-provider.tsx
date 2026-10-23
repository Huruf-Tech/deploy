/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { createBrowserRouter } from "react-router";
import { Toaster } from "sonner";
import { useTheme } from "@/components/theme-provider";

import {
  coreLayouts,
  type TCoreLayoutName,
  type TLayoutComponent,
  type TLayoutLoader,
} from "@/core/layouts/registry";
import { layouts as customLayouts } from "@/overrides/layouts";

export interface ILayoutContext {
  router: ReturnType<typeof createBrowserRouter>;
}

const LayoutContext = React.createContext<ILayoutContext | null>(null);

export interface ILayoutProps {
  /**
   * Renders this layout instead of the one `VITE_APP_LAYOUT` selects, and skips
   * the lazy load entirely. Use it when the choice is made in code; register in
   * `src/overrides/layouts.ts` instead when it should follow the env var.
   */
  layout?: TLayoutComponent;
  router: ReturnType<typeof createBrowserRouter>;
  children: React.ReactNode;
}

/** Used when `VITE_APP_LAYOUT` is unset, or names a layout nobody registered. */
const DEFAULT_LAYOUT: TCoreLayoutName = "navbar";

function resolveLayout(): TLayoutLoader {
  const name = import.meta.env.VITE_APP_LAYOUT || DEFAULT_LAYOUT;

  //! The project's registry is consulted first, so a layout can take over a
  //! built-in name rather than having to be called something else everywhere.
  const loader = customLayouts[name] ?? coreLayouts[name as TCoreLayoutName];

  if (loader) return loader;

  //! A typo in an env var should not be a white screen, and it should not be
  //! silence either -- the app comes up on the default layout and says why.
  console.error(
    [
      `[thunder-ui] VITE_APP_LAYOUT="${name}" is not a registered layout.`,
      `Built in: ${Object.keys(coreLayouts).join(", ")}.`,
      `Registered in src/overrides/layouts.ts: ${
        Object.keys(customLayouts).join(", ") || "none"
      }.`,
      `Falling back to "${DEFAULT_LAYOUT}".`,
    ].join(" "),
  );

  return coreLayouts[DEFAULT_LAYOUT];
}

//! `React.lazy` holds the factory until the component first renders, so passing
//! a `layout` prop never requests a chunk that will not be used. It is built at
//! module scope because a lazy component created during render is a new
//! component type on every render, which would remount the entire app.
const ConfiguredLayout = React.lazy(async () => {
  const loaded = await resolveLayout()();
  const Layout = loaded.Layout ?? loaded.default;

  if (!Layout) {
    throw new Error(
      "[thunder-ui] A registered layout module exported neither `Layout` nor a " +
        "default export. See src/overrides/layouts.ts.",
    );
  }

  return { default: Layout };
});

export function LayoutProvider({ children, layout, router }: ILayoutProps) {
  const { resolvedTheme } = useTheme();

  const Layout = layout ?? ConfiguredLayout;

  return (
    <LayoutContext.Provider value={{ router }}>
      {/*
        The fallback is a bare surface in the theme's background colour, not a
        spinner: the layout chunk is fetched on the same connection that just
        delivered the app, and a spinner that appears for one frame reads worse
        than a moment of empty shell.
      */}
      <React.Suspense fallback={<div className="h-dvh w-full bg-background" />}>
        <Layout>{children}</Layout>
      </React.Suspense>

      <Toaster
        theme={resolvedTheme}
        position="bottom-center"
        toastOptions={{
          className: "!items-start !gap-3 !rounded-4xl !p-5",
          classNames: {
            icon: "[&>svg]:!size-7 [&>svg]:mt-2",
            title: "!text-lg",
            description: "!text-sm !text-muted-foreground",
            actionButton: "!p-4 !h-6 !rounded-full capitalize",
          },
        }}
      />
    </LayoutContext.Provider>
  );
}

export const useLayout = () => {
  const context = React.useContext(LayoutContext);

  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }

  return context;
};
