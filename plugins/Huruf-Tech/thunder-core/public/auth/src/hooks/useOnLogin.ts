import React from "react";
import { useNavigate } from "react-router";
import { TRANSIENT_PARAMS, withSearch } from "@/lib/navigation";

/**
 * Where to go after a successful sign in. The account route takes care of
 * resuming an OAuth authorization (`client_id`) or an external `redirect`.
 */
export function useOnLogin() {
  const navigate = useNavigate();

  return React.useCallback(() => {
    navigate(withSearch("/account", { omit: TRANSIENT_PARAMS }), {
      replace: true,
      viewTransition: true,
    });
  }, [navigate]);
}
