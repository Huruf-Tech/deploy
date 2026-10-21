import { createBrowserRouter, Navigate } from "react-router";
import App from "./App";
import RouteError from "./pages/RouteError";

/** Lazily loads a page module's default export as the route component. */
const page =
  (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
    Component: (await load()).default,
  });

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      errorElement: <RouteError />,
      // Shown while the first lazy route chunk loads.
      hydrateFallbackElement: <div className="min-h-svh bg-background" />,
      children: [
        {
          index: true,
          element: (
            <Navigate to={"/account" + window.location.search} replace />
          ),
        },
        {
          path: "account",
          lazy: page(() => import("./pages/Account")),
        },
        { path: "login", lazy: page(() => import("./pages/Login")) },
        { path: "signup", lazy: page(() => import("./pages/Signup")) },
        {
          // Request a password reset email
          path: "reset-password",
          lazy: page(() => import("./pages/Login/ResetPassword")),
        },
        {
          // Landing page of the reset email (carries `?token=`)
          path: "change-password",
          lazy: page(() => import("./pages/ChangePassword")),
        },
        { path: "consent", lazy: page(() => import("./pages/Login/Consent")) },
        {
          path: "invite/:_id",
          lazy: page(() => import("./pages/Account/Members/Invite")),
        },
        { path: "logout", lazy: page(() => import("./pages/Logout")) },
        { path: "*", lazy: page(() => import("./pages/NotFound")) },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
);
